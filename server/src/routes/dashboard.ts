import { Router } from 'express';
import { Product } from '../models/Product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const router = Router();

router.get(
  '/institution',
  requireAuth,
  requireRole('admin', 'technician'),
  asyncHandler(async (req, res) => {
    const products = await Product.find({ tenantId: req.auth!.tenantId, siteId: { $ne: null } }).populate([
      { path: 'productModelId', populate: { path: 'brandId' } },
      { path: 'importerPartnerId' },
      { path: 'supplierPartnerId' },
      { path: 'siteId' },
      { path: 'locationId' },
    ]);

    const statuses = products.map((p) => getWarrantyStatus(p.warrantyEnd));
    res.json({
      total: products.length,
      inWarranty: statuses.filter((s) => s === 'in_warranty').length,
      nearExpiry: statuses.filter((s) => s === 'near_expiry').length,
      outOfWarranty: statuses.filter((s) => s === 'out_of_warranty').length,
      items: products.map((p, i) => ({ ...p.toObject(), warrantyStatus: statuses[i] })),
    });
  }),
);

export default router;
