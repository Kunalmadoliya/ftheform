export const DAILY_FREE_GENERATION_QUOTA = 10;
export const CREDIT_EXHAUSTED_MESSAGE =
  "Daily free generation limit reached. Buy credits (Rs. 400 for 20 generations) to continue.";

export interface GenerationCreditEligibility {
  allowed: boolean;
  usedCredit: boolean;
  availableCredits: number;
}

/**
 * Pure evaluation for whether a generation job can proceed, and whether
 * it should be charged to paid credits (usedCredit = true) or daily free quota.
 */
export function evaluateGenerationCreditEligibility(
  dailyJobsCount: number,
  userCredits: number,
  pendingPaidJobsCount: number,
  dailyFreeQuota = DAILY_FREE_GENERATION_QUOTA,
): GenerationCreditEligibility {
  if (dailyJobsCount < dailyFreeQuota) {
    return {
      allowed: true,
      usedCredit: false,
      availableCredits: Math.max(0, dailyFreeQuota - dailyJobsCount),
    };
  }

  const availableCredits = userCredits - pendingPaidJobsCount;
  if (availableCredits <= 0) {
    return {
      allowed: false,
      usedCredit: true,
      availableCredits: 0,
    };
  }

  return {
    allowed: true,
    usedCredit: true,
    availableCredits,
  };
}

export interface CreditDecrementResult {
  newCredits: number;
  decremented: boolean;
}

/**
 * Pure evaluation for decrementing user credits upon successful job completion.
 * - Free tier jobs (usedCredit = false) NEVER decrement.
 * - Already completed jobs (retry / idempotency) NEVER decrement twice.
 * - Paid jobs decrement by 1, and never drop below 0.
 */
export function evaluateCreditDecrement(
  currentCredits: number,
  jobUsedCredit: boolean,
  isJobAlreadyCompleted: boolean,
): CreditDecrementResult {
  if (isJobAlreadyCompleted || !jobUsedCredit) {
    return {
      newCredits: currentCredits,
      decremented: false,
    };
  }

  return {
    newCredits: Math.max(0, currentCredits - 1),
    decremented: true,
  };
}
