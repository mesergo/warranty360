import { Router } from 'express';
import { QrTag } from '../models/QrTag.js';
import { Product } from '../models/Product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'technician'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const productIds = await Product.find({ tenantId: req.auth!.tenantId, siteId: { $ne: null } }).distinct(
      '_id',
    );
    const tags = await QrTag.find({ productId: { $in: productIds } }).populate({
      path: 'productId',
      populate: [
        { path: 'productModelId', populate: { path: 'brandId' } },
        { path: 'importerPartnerId' },
        { path: 'supplierPartnerId' },
        { path: 'siteId' },
        { path: 'locationId' },
      ],
    });
    res.json({ items: tags });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const tag = await QrTag.findById(req.params.id);
    if (!tag) {
      res.status(404).json({ error: 'מדבקה לא נמצאה' });
      return;
    }
    // מוודאים שהמוצר שהמדבקה מצביעה עליו שייך לטננט של המשתמש - אחרת אפשר לעדכן מדבקה
    // (סטטוס הדפסה) ששייכת למוסד אחר לגמרי.
    const product = await Product.findOne({ _id: tag.productId, tenantId: req.auth!.tenantId });
    if (!product) {
      res.status(403).json({ error: 'אין הרשאה למדבקה זו' });
      return;
    }
    const { printed } = req.body as { printed?: boolean };
    if (printed !== undefined) tag.printed = printed;
    await tag.save();
    res.json({ item: tag });
  }),
);

export default router;
