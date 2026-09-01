/** מפענח את שדה exp (זמן תפוגה, שניות מאז epoch) מתוך JWT, ללא אימות חתימה (לצורך UI בלבד). */
export function decodeJwtExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
