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

    // סריקה ציבורית ללא התחברות - חושפים רק את השדות שהמסך הציבורי באמת מציג
    // (שם דגם/מבנה/מיקום/ספק ותוקף אחריות), לא את כל מסמך המוצר (tenantId, מספר סידורי,
    // הערות פנימיות, כתובת מדויקת, webhookUrl וכו').
    const product = await Product.findById(tag.productId).populate([
      { path: 'productModelId', select: 'modelName category', populate: { path: 'brandId', select: 'name' } },
      { path: 'siteId', select: 'name' },
      { path: 'locationId', select: 'name' },
      { path: 'importerPartnerId', select: 'name phone' },
      { path: 'supplierPartnerId', select: 'name phone' },
      { path: 'warrantyServiceProviderId', select: 'name phone slaHours' },
    ]);
    if (!product) {
      res.status(404).json({ error: 'המוצר המשויך למדבקה לא נמצא' });
      return;
    }

    res.json({
      productId: String(product._id),
      warrantyStatus: getWarrantyStatus(product.warrantyEnd),
      product: {
        _id: product._id,
        productModelId: product.productModelId,
        siteId: product.siteId,
        locationId: product.locationId,
        importerPartnerId: product.importerPartnerId,
        supplierPartnerId: product.supplierPartnerId,
        warrantyServiceProviderId: product.warrantyServiceProviderId,
        warrantyEnd: product.warrantyEnd,
      },
    });
  }),
);

export default router;
