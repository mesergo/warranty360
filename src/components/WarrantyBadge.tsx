import { Badge } from './Badge';
import { warrantyStatusColor, warrantyStatusLabel } from '../lib/warranty';
import type { WarrantyStatus } from '../types';

export function WarrantyBadge({ status }: { status: WarrantyStatus }) {
  return <Badge className={warrantyStatusColor[status]}>{warrantyStatusLabel[status]}</Badge>;
}
