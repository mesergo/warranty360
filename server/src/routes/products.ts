import { Router } from 'express';
import { Product } from '../models/Product.js';
import { QrTag } from '../models/QrTag.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const router = Router();
router.use(requireAuth);

const POPULATE = [
  { path: 'productModelId', populate: { path: 'brandId' } },
  { path: 'importerPartnerId' },
  { path: 'supplierPartnerId' },
  { path: 'warrantyServiceProviderId' },
  { path: 'siteId' },
  { path: 'locationId' },
];

const CONSUMER_EDITABLE_FIELDS = [
  'productModelId',
  'serialNumber',
  'purchaseDate',
  'warrantyStart',
  'warrantyEnd',
  'purchasedAtBranch',
  'importerPartnerId',
  'supplierPartnerId',
  'reportedInstallLocation',
] as const;

const STAFF_EDITABLE_FIELDS = [
  ...CONSUMER_EDITABLE_FIELDS,
  'assetTag',
  'siteId',
  'locationId',
  'warrantyServiceProviderId',
  'notes',
  'status',
] as const;

function shape(product: any) {
  const obj = product.toObject ? product.toObject() : product;
  return {
    ...obj,
    warrantyStatus: getWarrantyStatus(obj.warrantyEnd),
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { siteId, partnerId, status } = req.query as Record<string, string | undefined>;
    const query: Record<string, unknown> = {};

    if (req.auth!.role === 'consumer') {
      query.ownerUserId = req.auth!.sub;
    } else {
      query.tenantId = req.auth!.tenantId;
      query.siteId = { $ne: null };
      if (siteId) query.siteId = siteId;
      if (partnerId) query.$or = [{ importerPartnerId: partnerId }, { supplierPartnerId: partnerId }];
    }

    const products = await Product.find(query).populate(POPULATE).sort({ createdAt: -1 });
    let shaped = products.map(shape);
    if (status) shaped = shaped.filter((p) => p.warrantyStatus === status);
    res.json({ items: shaped });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(POPULATE);
    if (!product) {
      res.status(404).json({ error: 'המוצר לא נמצא' });
      return;
    }
    const isOwner = product.ownerUserId && String(product.ownerUserId) === req.auth!.sub;
    const isTenantStaff = req.auth!.role !== 'consumer' && product.tenantId === req.auth!.tenantId;
    if (!isOwner && !isTenantStaff) {
      res.status(403).json({ error: 'אין הרשאה לצפות במוצר זה' });
      return;
    }
    res.json({ item: shape(product) });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'המוצר לא נמצא' });
      return;
    }
    const isOwner = product.ownerUserId && String(product.ownerUserId) === req.auth!.sub;
    const isTenantStaff = req.auth!.role !== 'consumer' && product.tenantId === req.auth!.tenantId;
    if (!isOwner && !isTenantStaff) {
      res.status(403).json({ error: 'אין הרשאה לעדכן מוצר זה' });
      return;
    }

    const allowedFields = isTenantStaff ? STAFF_EDITABLE_FIELDS : CONSUMER_EDITABLE_FIELDS;
    const body = req.body as Record<string, unknown>;
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (product as any)[field] = body[field] || undefined;
      }
    }
    await product.save();

    const populated = await product.populate(POPULATE);
    res.json({ item: shape(populated) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const isStaff = req.auth!.role !== 'consumer';

    if (!body.productModelId || !body.purchaseDate || !body.warrantyStart || !body.warrantyEnd) {
      res.status(400).json({ error: 'חסרים שדות חובה (דגם, תאריך רכישה ותאריכי אחריות)' });
      return;
    }
    if (isStaff && !body.siteId) {
      res.status(400).json({ error: 'חובה לבחור מבנה עבור ציוד מוסדי' });
      return;
    }

    const allowedFields = isStaff ? STAFF_EDITABLE_FIELDS : CONSUMER_EDITABLE_FIELDS;
    const data: Record<string, unknown> = { tenantId: req.auth!.tenantId };
    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== '') data[field] = body[field];
    }

    if (isStaff) {
      data.ownerUserId = undefined;
    } else {
      data.ownerUserId = req.auth!.sub;
      data.siteId = undefined;
      data.locationId = undefined;
    }

    const product = await Product.create(data);

    if (isStaff) {
      // כל ציוד מוסדי מקבל מדבקת QR אוטומטית, כדי שיופיע מיד במסך הדפסת המדבקות.
      await QrTag.create({ productId: product._id, code: `W360-${String(product._id).slice(-8).toUpperCase()}` });
    }

    const populated = await product.populate(POPULATE);
    res.status(201).json({ item: shape(populated) });
  }),
);

export default router;
