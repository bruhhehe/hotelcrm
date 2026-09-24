/** "LDG-000123": the human reference shown to staff and guests. */
export function formatReservationReference(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new RangeError("sequence must be ≥ 1");
  return `LDG-${String(sequence).padStart(6, "0")}`;
}
