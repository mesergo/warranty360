import { Router } from 'express';
import { ServiceRequest, ServiceMessage } from '../models/ServiceRequest.js';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const router = Router();
router.use(requireAuth);

const PRODUCT_POPULATE = [
  {
    path: 'productId',
    populate: [
      { path: 'productModelId', populate: { path: 'brandId' } },
      { path: 'siteId' },
      { path: 'locationId' },
    ],
  },
  { path: 'serviceProviderId' },
  { path: 'assignedPartnerId' },
];

async function assertProductAccess(productId: string, auth: { sub: string; tenantId: string; role: string }) {
  const product = await Product.findById(productId);
  if (!product) return null;
  const isOwner = product.ownerUserId && String(product.ownerUserId) === auth.sub;
  const isTenantStaff = auth.role !== 'consumer' && product.tenantId === auth.tenantId;
  if (!isOwner && !isTenantStaff) return undefined;
  return product;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { productId } = req.query as { productId?: string };

    if (productId) {
      const product = await assertProductAccess(productId, req.auth!);
      if (product === null) {
        res.status(404).json({ error: 'המוצר לא נמצא' });
        return;
      }
      if (product === undefined) {
        res.status(403).json({ error: 'אין הרשאה' });
        return;
      }
      res.json({ items: await ServiceRequest.find({ productId }).sort({ createdAt: -1 }).populate(PRODUCT_POPULATE) });
      return;
    }

    if (req.auth!.role === 'consumer') {
      const productIds = await Product.find({ ownerUserId: req.auth!.sub }).distinct('_id');
      res.json({
        items: await ServiceRequest.find({ productId: { $in: productIds } })
          .sort({ createdAt: -1 })
          .populate(PRODUCT_POPULATE),
      });
      return;
    }

    const productIds = await Product.find({
      tenantId: req.auth!.tenantId,
      siteId: { $ne: null },
    }).distinct('_id');
    res.json({
      items: await ServiceRequest.find({ productId: { $in: productIds } })
        .sort({ createdAt: -1 })
        .populate(PRODUCT_POPULATE),
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId, description, priority } = req.body as {
      productId?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
    };
    if (!productId || !description?.trim()) {
      res.status(400).json({ error: 'חסר מזהה מוצר או תיאור התקלה' });
      return;
    }

    const product = await assertProductAccess(productId, req.auth!);
    if (!product) {
      res.status(product === null ? 404 : 403).json({ error: 'לא ניתן לפתוח קריאת שירות למוצר זה' });
      return;
    }

    const isUnderWarranty = getWarrantyStatus(product.warrantyEnd) !== 'out_of_warranty';
    const request = await ServiceRequest.create({
      productId,
      openedByUserId: req.auth!.sub,
      assignedPartnerId: product.importerPartnerId ?? product.supplierPartnerId,
      serviceProviderId: product.warrantyServiceProviderId,
      // status/leadStatus נשארים 'draft'/'new' - אין שליחה אוטומטית בפועל.
      // המשתמש מעדכן בעצמו ל"נשלחה" (PATCH /:id/status) אחרי שבאמת שלח את התוכן לנותן השירות.
      status: 'draft',
      priority: priority ?? 'medium',
      description: description.trim(),
      warrantySnapshot: { isUnderWarranty, warrantyEnd: product.warrantyEnd },
    });

    await ServiceMessage.create({
      serviceRequestId: request._id,
      authorType: 'system',
      body: 'קריאת השירות נוצרה. יש להעתיק את התוכן ולשלוח אותו בעצמכם לנותן השירות, ולסמן כ"נשלחה" לאחר מכן.',
    });

    await request.populate(PRODUCT_POPULATE);
    res.status(201).json({ item: request });
  }),
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status?: 'sent' };
    if (status !== 'sent') {
      res.status(400).json({ error: 'עדכון סטטוס נתמך רק ל"נשלחה"' });
      return;
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'קריאת השירות לא נמצאה' });
      return;
    }
    const product = await assertProductAccess(String(request.productId), req.auth!);
    if (!product) {
      res.status(product === null ? 404 : 403).json({ error: 'אין הרשאה' });
      return;
    }

    request.status = 'sent';
    request.leadStatus = 'sent';
    request.sentAt = new Date();
    await request.save();

    await ServiceMessage.create({
      serviceRequestId: request._id,
      authorType: 'system',
      body: 'הקריאה סומנה כנשלחה בפועל לנותן השירות.',
    });

    await request.populate(PRODUCT_POPULATE);
    res.json({ item: request });
  }),
);

router.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    res.json({
      items: await ServiceMessage.find({ serviceRequestId: req.params.id }).sort({ createdAt: 1 }),
    });
  }),
);

router.post(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const { body } = req.body as { body?: string };
    if (!body?.trim()) {
      res.status(400).json({ error: 'חסר תוכן הודעה' });
      return;
    }
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'קריאת השירות לא נמצאה' });
      return;
    }
    const product = await assertProductAccess(String(request.productId), req.auth!);
    if (!product) {
      res.status(product === null ? 404 : 403).json({ error: 'אין הרשאה' });
      return;
    }

    const message = await ServiceMessage.create({
      serviceRequestId: request._id,
      authorType: req.auth!.role === 'consumer' ? 'user' : 'partner',
      authorId: req.auth!.sub,
      body: body.trim(),
    });
    res.status(201).json({ item: message });
  }),
);

export default router;
