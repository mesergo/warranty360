const NEAR_EXPIRY_DAYS = 90;

export type WarrantyStatus = 'in_warranty' | 'near_expiry' | 'out_of_warranty';

export function getWarrantyStatus(warrantyEnd: Date | string, today: Date = new Date()): WarrantyStatus {
  const end = new Date(warrantyEnd);
  const diffDays = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'out_of_warranty';
  if (diffDays <= NEAR_EXPIRY_DAYS) return 'near_expiry';
  return 'in_warranty';
}
