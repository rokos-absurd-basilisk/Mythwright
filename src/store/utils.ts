// Simple nanoid-compatible UUID generator (no extra dep needed)
export function nanoid(): string {
  return crypto.randomUUID()
}
