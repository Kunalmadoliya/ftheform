import { and, count, db, eq, gte } from "@repo/database";
import { user } from "@repo/database/auth-schema";
import { formGenerationJob } from "@repo/database/models/form-schema";
import { DAILY_FREE_GENERATION_QUOTA } from "../form_ai/credits";

export default class PaymentService {
  public async getUserCredits(userId: string): Promise<{ credits: number; dailyFreeRemaining: number }> {
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
}

export const paymentServiceInstance = new PaymentService();
