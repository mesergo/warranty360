/** ממיר תאריך ISO מהשרת לפורמט yyyy-MM-dd המתאים ל-<input type="date">. */
export function toInputDate(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}
