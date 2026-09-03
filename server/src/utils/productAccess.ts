import { Product } from '../models/Product.js';
import type { AuthTokenPayload } from './jwt.js';

/**
 * null = המוצר לא קיים, undefined = קיים אך המשתמש לא מורשה, אחרת המוצר עצמו.
 * משותף לכל המסלולים שניגשים למוצר לפי מזהה (מסמכים, קריאות שירות וכו') כדי שהבדיקה
 * (בעלים בפועל, או צוות מוסד באותו tenant) לא תישכח/תיכתב שוב בכל מקום בנפרד.
 */
export async function assertProductAccess(productId: string, auth: AuthTokenPayload) {
  const product = await Product.findById(productId);
  if (!product) return null;
  const isOwner = product.ownerUserId && String(product.ownerUserId) === auth.sub;
  const isTenantStaff = auth.role !== 'consumer' && product.tenantId === auth.tenantId;
  if (!isOwner && !isTenantStaff) return undefined;
  return product;
}
