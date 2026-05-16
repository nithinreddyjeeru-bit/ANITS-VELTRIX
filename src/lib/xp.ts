/** Level rule: level = floor(xp / 1000) + 1 (matches schema.sql attendance trigger). */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 1000) + 1;
}
