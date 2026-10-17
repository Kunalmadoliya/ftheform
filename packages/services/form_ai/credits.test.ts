import { describe, expect, it } from "vitest";
import {
  CREDIT_EXHAUSTED_MESSAGE,
  DAILY_FREE_GENERATION_QUOTA,
  evaluateCreditDecrement,
  evaluateGenerationCreditEligibility,
} from "./credits";

describe("evaluateGenerationCreditEligibility", () => {
  it("allows free tier generations when daily job count is under 10 (usedCredit = false)", () => {
    // 0 jobs today: 10 remaining free
    const eligibility0 = evaluateGenerationCreditEligibility(0, 0, 0);
    expect(eligibility0.allowed).toBe(true);
    expect(eligibility0.usedCredit).toBe(false);
    expect(eligibility0.availableCredits).toBe(10);

    // 9 jobs today: 1 remaining free
    const eligibility9 = evaluateGenerationCreditEligibility(9, 0, 0);
    expect(eligibility9.allowed).toBe(true);
    expect(eligibility9.usedCredit).toBe(false);
    expect(eligibility9.availableCredits).toBe(1);
  });

  it("allows paid credit generation when free quota is exhausted and user has credits (usedCredit = true)", () => {
    // 10 jobs today (free exhausted), user has 5 credits, 0 pending paid jobs
    const eligibility = evaluateGenerationCreditEligibility(10, 5, 0);
    expect(eligibility.allowed).toBe(true);
    expect(eligibility.usedCredit).toBe(true);
    expect(eligibility.availableCredits).toBe(5);

    // 15 jobs today, user has 1 credit
    const eligibilityLater = evaluateGenerationCreditEligibility(15, 1, 0);
    expect(eligibilityLater.allowed).toBe(true);
    expect(eligibilityLater.usedCredit).toBe(true);
    expect(eligibilityLater.availableCredits).toBe(1);
  });

  it("blocks generation when free quota is exhausted and user has 0 credits", () => {
    // 10 jobs today, user has 0 credits
    const eligibility = evaluateGenerationCreditEligibility(10, 0, 0);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.usedCredit).toBe(true);
    expect(eligibility.availableCredits).toBe(0);

    // Friendly message check
    expect(CREDIT_EXHAUSTED_MESSAGE).toBe(
      "Daily free generation limit reached. Buy credits (Rs. 400 for 20 generations) to continue.",
    );
  });

  it("counts pending and running paid jobs against available credits to prevent race conditions", () => {
    // User has 2 credits, but 2 pending paid jobs already running
    const eligibilityBlocked = evaluateGenerationCreditEligibility(10, 2, 2);
    expect(eligibilityBlocked.allowed).toBe(false);
    expect(eligibilityBlocked.availableCredits).toBe(0);

    // User has 3 credits and 2 pending paid jobs: 1 available credit remains
    const eligibilityAllowed = evaluateGenerationCreditEligibility(10, 3, 2);
    expect(eligibilityAllowed.allowed).toBe(true);
    expect(eligibilityAllowed.usedCredit).toBe(true);
    expect(eligibilityAllowed.availableCredits).toBe(1);
  });
});

describe("evaluateCreditDecrement", () => {
  it("decrements by 1 on success when usedCredit = true", () => {
    const result = evaluateCreditDecrement(5, true, false);
    expect(result.decremented).toBe(true);
    expect(result.newCredits).toBe(4);
  });

  it("never decrements below 0", () => {
    const result = evaluateCreditDecrement(0, true, false);
    expect(result.decremented).toBe(true);
    expect(result.newCredits).toBe(0);
  });

  it("does NOT decrement for free tier generations (usedCredit = false)", () => {
    const result = evaluateCreditDecrement(5, false, false);
    expect(result.decremented).toBe(false);
    expect(result.newCredits).toBe(5);
  });

  it("does NOT double decrement on Inngest retry when job is already completed (idempotency)", () => {
    const result = evaluateCreditDecrement(5, true, true);
    expect(result.decremented).toBe(false);
    expect(result.newCredits).toBe(5);
  });
});
