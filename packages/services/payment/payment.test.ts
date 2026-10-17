import crypto from "crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, eq } from "@repo/database";
import { user } from "@repo/database/auth-schema";
import { payment } from "@repo/database/models/payment-schema";
import {
  _resetOrderRateLimits,
  checkOrderRateLimit,
  creditPaymentOrder,
  handleRazorpayWebhook,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "./index";
import PaymentService from "./index";
import {
  RAZORPAY_CREDITS_PER_PURCHASE,
  RAZORPAY_PAYMENT_AMOUNT_PAISE,
  RAZORPAY_PAYMENT_CURRENCY,
} from "./constants";

const TEST_SECRET = "test_key_secret_1234567890";
const TEST_WEBHOOK_SECRET = "test_webhook_secret_abcdef";

describe("Payment Signatures & Cryptography", () => {
  it("verifies valid and rejects invalid payment signatures with timing-safe comparison", () => {
    const orderId = "order_12345678";
    const paymentId = "pay_87654321";
    const validSignature = crypto
      .createHmac("sha256", TEST_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Valid signature
    expect(verifyPaymentSignature(orderId, paymentId, validSignature, TEST_SECRET)).toBe(true);

    // Invalid signature (tampered hex)
    const tampered = validSignature.slice(0, -2) + "ff";
    expect(verifyPaymentSignature(orderId, paymentId, tampered, TEST_SECRET)).toBe(false);

    // Wrong secret
    expect(verifyPaymentSignature(orderId, paymentId, validSignature, "wrong_secret")).toBe(false);

    // Different length signature (must not throw error)
    expect(verifyPaymentSignature(orderId, paymentId, "short_sig", TEST_SECRET)).toBe(false);
    expect(verifyPaymentSignature(orderId, paymentId, validSignature + "extra", TEST_SECRET)).toBe(false);

    // Empty fields
    expect(verifyPaymentSignature("", paymentId, validSignature, TEST_SECRET)).toBe(false);
    expect(verifyPaymentSignature(orderId, "", validSignature, TEST_SECRET)).toBe(false);
  });

  it("verifies valid and rejects invalid webhook signatures on raw bodies", () => {
    const rawBody = Buffer.from(JSON.stringify({ event: "order.paid", order_id: "order_test" }));
    const validSignature = crypto
      .createHmac("sha256", TEST_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    // Valid webhook signature
    expect(verifyWebhookSignature(rawBody, validSignature, TEST_WEBHOOK_SECRET)).toBe(true);

    // Tampered body
    const tamperedBody = Buffer.from(JSON.stringify({ event: "order.paid", order_id: "order_hacked" }));
    expect(verifyWebhookSignature(tamperedBody, validSignature, TEST_WEBHOOK_SECRET)).toBe(false);

    // Tampered signature
    expect(verifyWebhookSignature(rawBody, "bad_signature_hex", TEST_WEBHOOK_SECRET)).toBe(false);
  });

  it("enforces order creation rate limit (max 10/hour)", () => {
    _resetOrderRateLimits();
    const testUser = "user_rate_limit_test";

    for (let i = 0; i < 10; i++) {
      expect(() => checkOrderRateLimit(testUser)).not.toThrow();
    }

    expect(() => checkOrderRateLimit(testUser)).toThrow("Too many order requests");
  });
});

describe("Payment Crediting & Webhook Integration", () => {
  const testUserId = `test_user_${Date.now()}`;
  const testUserBId = `test_user_b_${Date.now()}`;

  beforeAll(async () => {
    // Insert test users
    await db.insert(user).values([
      {
        id: testUserId,
        name: "Test User A",
        email: `test_a_${Date.now()}@example.com`,
        credits: 0,
      },
      {
        id: testUserBId,
        name: "Test User B",
        email: `test_b_${Date.now()}@example.com`,
        credits: 0,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(payment).where(eq(payment.userId, testUserId));
    await db.delete(payment).where(eq(payment.userId, testUserBId));
    await db.delete(user).where(eq(user.id, testUserId));
    await db.delete(user).where(eq(user.id, testUserBId));
  });

  it("credits payment order and prevents double-crediting (idempotency)", async () => {
    const orderId = `order_${Date.now()}_1`;
    const paymentId = `pay_${Date.now()}_1`;

    await db.insert(payment).values({
      userId: testUserId,
      razorpayOrderId: orderId,
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      status: "pending",
      creditsAdded: 0,
    });

    // 1st crediting call (e.g. from verifyPayment)
    const result1 = await creditPaymentOrder(orderId, paymentId, "sig_1");
    expect(result1.status).toBe("captured");
    expect(result1.credits).toBe(RAZORPAY_CREDITS_PER_PURCHASE);

    // Check DB record
    const [dbUser1] = await db.select().from(user).where(eq(user.id, testUserId));
    expect(dbUser1?.credits).toBe(20);

    // 2nd crediting call (e.g. from webhook arriving afterwards)
    const result2 = await creditPaymentOrder(orderId, paymentId, "sig_1");
    expect(result2.status).toBe("captured");
    expect(result2.credits).toBe(20); // Still 20, NOT 40

    // Check DB user credits remained 20
    const [dbUser2] = await db.select().from(user).where(eq(user.id, testUserId));
    expect(dbUser2?.credits).toBe(20);
  });

  it("handles concurrent crediting calls without double crediting", async () => {
    const orderId = `order_${Date.now()}_concurrent`;
    const paymentId = `pay_${Date.now()}_concurrent`;

    await db.insert(payment).values({
      userId: testUserId,
      razorpayOrderId: orderId,
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      status: "pending",
      creditsAdded: 0,
    });

    const [userBefore] = await db.select().from(user).where(eq(user.id, testUserId));
    const initialCredits = userBefore?.credits ?? 0;

    // Run 2 simultaneous crediting calls concurrently
    await Promise.all([
      creditPaymentOrder(orderId, paymentId, "sig_concurrent"),
      creditPaymentOrder(orderId, paymentId, "sig_concurrent"),
    ]);

    const [userAfter] = await db.select().from(user).where(eq(user.id, testUserId));
    expect(userAfter?.credits).toBe(initialCredits + RAZORPAY_CREDITS_PER_PURCHASE);
  });

  it("prevents wrong user from verifying someone else's order", async () => {
    const orderId = `order_${Date.now()}_ownership`;
    const paymentId = `pay_${Date.now()}_ownership`;

    await db.insert(payment).values({
      userId: testUserId, // Belongs to User A
      razorpayOrderId: orderId,
      amount: RAZORPAY_PAYMENT_AMOUNT_PAISE,
      currency: RAZORPAY_PAYMENT_CURRENCY,
      status: "pending",
      creditsAdded: 0,
    });

    const paymentService = new PaymentService();

    // User B attempts to verify User A's order
    await expect(
      paymentService.verifyPayment(
        { orderId, paymentId, signature: "dummy_sig" },
        testUserBId,
      ),
    ).rejects.toThrow("Payment order not found.");
  });

  it("webhook ignores unknown orders without creating rows or crediting", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    const unknownOrderId = `order_unknown_${Date.now()}`;
    const payload = {
      event: "order.paid",
      payload: {
        order: {
          entity: {
            id: unknownOrderId,
            amount_paid: 40000,
          },
        },
        payment: {
          entity: {
            id: `pay_${Date.now()}`,
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = crypto
      .createHmac("sha256", TEST_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const result = await handleRazorpayWebhook(rawBody, signature);
    expect(result.status).toBe(200);
    expect(result.body.message).toContain("ignored");

    // Ensure no payment was created for unknown order
    const [row] = await db.select().from(payment).where(eq(payment.razorpayOrderId, unknownOrderId));
    expect(row).toBeUndefined();
  });

  it("webhook ignores orders where the payload amount does not match the stored amount", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    const orderId = `order_${Date.now()}_mismatch`;
    await db.insert(payment).values({
      userId: testUserId,
      razorpayOrderId: orderId,
      amount: 40000, // Expected 40000 paise
      currency: "INR",
      status: "pending",
      creditsAdded: 0,
    });

    const [userBefore] = await db.select().from(user).where(eq(user.id, testUserId));
    const creditsBefore = userBefore?.credits ?? 0;

    const payload = {
      event: "order.paid",
      payload: {
        order: {
          entity: {
            id: orderId,
            amount_paid: 1000, // Mismatched amount: only 1000 paise
          },
        },
        payment: {
          entity: {
            id: `pay_${Date.now()}`,
          },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = crypto
      .createHmac("sha256", TEST_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const result = await handleRazorpayWebhook(rawBody, signature);
    expect(result.status).toBe(200);
    expect(result.body.message).toContain("Amount mismatch, ignored");

    // Payment should remain pending and user credits unchanged
    const [storedPayment] = await db.select().from(payment).where(eq(payment.razorpayOrderId, orderId));
    expect(storedPayment?.status).toBe("pending");

    const [userAfter] = await db.select().from(user).where(eq(user.id, testUserId));
    expect(userAfter?.credits).toBe(creditsBefore);
  });
});
