// Level utility functions for XP and progress calculations

/**
 * Compute total experience points (XP) based on user activity.
 * This is a simple heuristic; adjust the formula to match your game design.
 *
 * @param param0 - Object containing response count, number of published forms, and drafts.
 * @returns total XP as a number
 */
export function computeXp({ responses, published, drafts }: { responses: number; published: number; drafts: number }): number {
  // Example weighting: each response = 10 XP, each published form = 100 XP, each draft = 20 XP
  const xp = responses * 10 + published * 100 + drafts * 20;
  return xp;
}

/**
 * Calculate progress towards the next level.
 * Returns an object with the current level, the XP required for the current level,
 * the XP required for the next level, and the percentage progress within the level.
 *
 * This implementation uses a simple exponential curve where XP needed for a level
 * is `baseXP * level^2`. Adjust `baseXP` as needed.
 */
export function progressForLevel(xp: number) {
  const baseXP = 100; // XP required for level 1
  // Find level such that xpNeeded(level) <= xp < xpNeeded(level + 1)
  let level = 1;
  while (xp >= xpNeeded(level + 1)) {
    level++;
  }
  const cur = xpNeeded(level);
  const next = xpNeeded(level + 1);
  const pct = ((xp - cur) / (next - cur)) * 100;
  return { level, xp, cur, next, pct };
}

function xpNeeded(level: number): number {
  // Simple quadratic curve: XP = baseXP * level^2
  const baseXP = 100;
  return baseXP * Math.pow(level, 2);
}
