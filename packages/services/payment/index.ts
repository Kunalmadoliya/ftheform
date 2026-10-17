import crypto from "crypto";
import Razorpay from "razorpay";
import { and, count, db, eq, gte, sql } from "@repo/database";
import { user } from "@repo/database/auth-schema";
import { formGenerationJob } from "@repo/database/models/form-schema";
import { payment } from "@repo/database/models/payment-schema";
import { logger } from "@repo/logger";
import { serviceError } from "../errors";
import { env } from "../env";
import { DAILY_FREE_GENERATION_QUOTA } from "../form_ai/credits";
import {
  RAZORPAY_CREDITS_PER_PURCHASE,
  RAZORPAY_PAYMENT_AMOUNT_PAISE,
  RAZORPAY_PAYMENT_CURRENCY,
} from "./constants";
import type {
  CreateRazorpayOrderOutput,
  VerifyPaymentInput,
  VerifyPaymentOutput,
} from "./model";

// ---------------------------------------------------------------------------
// Rate limiter for order creation: max 10 order requests per hour per user
// ---------------------------------------------------------------------------
interface OrderRateLimit {
  count: number;
  resetAt: number;
}
const orderRateLimits = new Map<string, OrderRateLimit>();

export function checkOrderRateLimit(userId: string, limit = 10, windowMs = 3600_000): void {
  const now = Date.now();
  const record = orderRateLimits.get(userId);
  if (record && now < record.resetAt) {
    if (record.count >= limit) {
      throw serviceError("TOO_MANY_REQUESTS", "Too many order requests. Please try again later.");
    }
    record.count++;
  } else {
    orderRateLimits.set(userId, { count: 1, resetAt: now + windowMs });
  }
}

export function _resetOrderRateLimits(): void {
  orderRateLimits.clear();
}

// ---------------------------------------------------------------------------
// Timing-safe HMAC SHA256 Signature Verification Helpers
// ---------------------------------------------------------------------------
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf-8");
  const expectedBuf = Buffer.from(expectedSignature, "utf-8");

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string,
): boolean {
  if (!rawBody || !signature || !secret) return false;

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf-8");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf-8");
  const expectedBuf = Buffer.from(expectedSignature, "utf-8");

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

// ---------------------------------------------------------------------------
// Shared Crediting Function (Used by BOTH verifyPayment and Webhook)
// ---------------------------------------------------------------------------
export async function creditPaymentOrder(
  orderId: string,
  paymentId: string,
  signature?: string,
): Promise<{ status: "pending" | "captured" | "failed"; credits: number }> {
  return await db.transaction(async (tx) => {
    // 1. SELECT ... FOR UPDATE on payment row by razorpay_order_id
    const [existingPayment] = await tx
      .select()
      .from(payment)
      .where(eq(payment.razorpayOrderId, orderId))
      .for("update");

    if (!existingPayment) {
      throw serviceError("NOT_FOUND", "Payment order not found.");
    }

    // 2. Fetch current user credits
    const [userRecord] = await tx
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, existingPayment.userId))
      .for("update");
    const currentCredits = userRecord?.credits ?? 0;

    // 3. If already captured, do nothing (idempotent)
    if (existingPayment.status === "captured") {
      return { status: "captured", credits: currentCredits };
    }

    // 4. If paymentId is already attached to a DIFFERENT payment row, do not credit
    if (paymentId) {
      const [duplicatePayment] = await tx
        .select({ id: payment.id })
        .from(payment)
        .where(and(
          eq(payment.razorpayPaymentId, paymentId),
          sql`${payment.id} <> ${existingPayment.id}`,
        ));
      if (duplicatePayment) {
        logger.warn(
          `Razorpay payment ID ${paymentId} is already attached to another payment record.`,
        );
        return { status: existingPayment.status, credits: currentCredits };
      }
    }

    // 5. Update payment status to captured and increment user credits by 20
    try {
      await tx
        .update(payment)
        .set({
          status: "captured",
          razorpayPaymentId: paymentId || existingPayment.razorpayPaymentId,
          signature: signature ?? existingPayment.signature,
          creditsAdded: RAZORPAY_CREDITS_PER_PURCHASE,
        })
        .where(eq(payment.id, existingPayment.id));

      await tx
        .update(user)
        .set({
          credits: sql`${user.credits} + ${RAZORPAY_CREDITS_PER_PURCHASE}`,
        })
        .where(eq(user.id, existingPayment.userId));
    } catch (err: unknown) {
      logger.error("Failed to credit payment order due to database error", { error: err });
      return { status: existingPayment.status, credits: currentCredits };
    }

    return {
      status: "captured",
      credits: currentCredits + RAZORPAY_CREDITS_PER_PURCHASE,
    };
  });
}

// ---------------------------------------------------------------------------
// PaymentService Class
// ---------------------------------------------------------------------------
export default class PaymentService {
  public async getUserCredits(
    userId: string,
  ): Promise<{ credits: number; dailyFreeRemaining: number }> {
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [userData] = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, userId));

    const [dailyJobs] = await db
      .select({ count: count() })
      .from(formGenerationJob)
      .where(and(
        eq(formGenerationJob.userId, userId),
        gte(formGenerationJob.createdAt, dayStart),
      ));

    const dailyJobsCount = dailyJobs?.count ?? 0;
    const dailyFreeRemaining = Math.max(0, DAILY_FREE_GENERATION_QUOTA - dailyJobsCount);
    const credits = userData?.credits ?? 0;

    return {
      credits,
      dailyFreeRemaining,
    };
  }

  public async createOrder(userId: string): Promise<CreateRazorpayOrderOutput> {
    const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw serviceError("INTERNAL_SERVER_ERROR", "Payment gateway is not configured.");
    }

    checkOrderRateLimit(userId);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const order = await razorpay.orders.create({
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      receipt,
      notes: {
        userId,
      },
    });

    await db.insert(payment).values({
      userId,
      razorpayOrderId: order.id,
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      status: "pending",
      creditsAdded: 0,
    });

    return {
      orderId: order.id,
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      keyId,
    };
  }

  public async verifyPayment(
    input: VerifyPaymentInput,
    userId: string,
  ): Promise<VerifyPaymentOutput> {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw serviceError("INTERNAL_SERVER_ERROR", "Payment gateway is not configured.");
    }

    const { orderId, paymentId, signature } = input;

    // Verify payment order exists and belongs to this user
    const [existingPayment] = await db
      .select()
      .from(payment)
      .where(and(eq(payment.razorpayOrderId, orderId), eq(payment.userId, userId)));

    if (!existingPayment) {
      throw serviceError("NOT_FOUND", "Payment order not found.");
    }

    const isValid = verifyPaymentSignature(orderId, paymentId, signature, keySecret);
    if (!isValid) {
      throw serviceError("BAD_REQUEST", "Invalid payment signature.");
    }

    return await creditPaymentOrder(orderId, paymentId, signature);
  }
}

export const paymentServiceInstance = new PaymentService();

// ---------------------------------------------------------------------------
// Webhook Processing Handler
// ---------------------------------------------------------------------------
export async function handleRazorpayWebhook(
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
): Promise<{ status: number; body: { message: string } }> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    return { status: 500, body: { message: "Webhook not configured" } };
  }

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    logger.warn("Razorpay webhook received without signature header.");
    return { status: 400, body: { message: "Missing signature" } };
  }

  const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    logger.warn("Razorpay webhook signature verification failed.");
    return { status: 400, body: { message: "Invalid signature" } };
  }

  let eventPayload: {
    event?: string;
    payload?: {
      order?: { entity?: { id?: string; amount?: number; amount_paid?: number } };
      payment?: { entity?: { id?: string; order_id?: string; amount?: number } };
    };
  };

  try {
    eventPayload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    logger.warn("Razorpay webhook payload could not be parsed as JSON.");
    return { status: 400, body: { message: "Invalid JSON payload" } };
  }

  const eventName = eventPayload.event;
  logger.info(`Razorpay webhook event received: ${eventName}`);

  if (eventName !== "order.paid" && eventName !== "payment.captured") {
    return { status: 200, body: { message: "Event ignored" } };
  }

  let orderId: string | undefined;
  let paymentId: string | undefined;
  let amount: number | undefined;

  if (eventName === "order.paid") {
    orderId = eventPayload.payload?.order?.entity?.id;
    amount = eventPayload.payload?.order?.entity?.amount_paid ?? eventPayload.payload?.order?.entity?.amount;
    paymentId = eventPayload.payload?.payment?.entity?.id;
  } else if (eventName === "payment.captured") {
    orderId = eventPayload.payload?.payment?.entity?.order_id;
    paymentId = eventPayload.payload?.payment?.entity?.id;
    amount = eventPayload.payload?.payment?.entity?.amount;
  }

  if (!orderId) {
    logger.warn(`Razorpay webhook ${eventName} missing order ID.`);
    return { status: 200, body: { message: "Missing order ID, ignored" } };
  }

  // Find the payment row by razorpay_order_id. If it does not exist, ignore it.
  const [existingPayment] = await db
    .select()
    .from(payment)
    .where(eq(payment.razorpayOrderId, orderId));

  if (!existingPayment) {
    logger.info(`Razorpay order ${orderId} not found in our database. Ignored.`);
    return { status: 200, body: { message: "Order not found, ignored" } };
  }

  // Check that the amount in the payload equals our stored amount before crediting
  if (amount !== undefined && amount !== existingPayment.amount) {
    logger.warn(
      `Razorpay webhook amount mismatch for order ${orderId}. Expected ${existingPayment.amount}, got ${amount}.`,
    );
    return { status: 200, body: { message: "Amount mismatch, ignored" } };
  }

  await creditPaymentOrder(
    orderId,
    paymentId || existingPayment.razorpayPaymentId || "",
    undefined,
  );

  return { status: 200, body: { message: "Webhook processed successfully" } };
}
