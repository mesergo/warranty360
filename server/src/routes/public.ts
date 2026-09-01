import { Router } from 'express';
import { QrTag } from '../models/QrTag.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const router = Router();

router.get(
  '/qr/:code',
  asyncHandler(async (req, res) => {
    const tag = await QrTag.findOne({ code: req.params.code });
    if (!tag) {
      res.status(404).json({ error: 'מדבקה לא נמצאה' });
      return;
    }

    tag.scansCount += 1;
    tag.lastScannedAt = new Date();
    await tag.save();

    const product = await Product.findById(tag.productId).populate([
      { path: 'productModelId', populate: { path: 'brandId' } },
      { path: 'siteId' },
      { path: 'locationId' },
      { path: 'importerPartnerId' },
      { path: 'supplierPartnerId' },
      { path: 'warrantyServiceProviderId' },
    ]);
    if (!product) {
      res.status(404).json({ error: 'המוצר המשויך למדבקה לא נמצא' });
      return;
    }

    res.json({
      productId: String(product._id),
      warrantyStatus: getWarrantyStatus(product.warrantyEnd),
      product,
    });
  }),
);

export default router;
