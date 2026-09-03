import { Router } from 'express';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Brand, ProductModel } from '../models/Brand.js';
import { Partner } from '../models/Partner.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getWarrantyStatus } from '../utils/warranty.js';

const router = Router();
// כל המסלולים כאן מיועדים למנהל מערכת (superadmin) בלבד - לא למנהל מוסד רגיל.
router.use(requireAuth, requireRole('superadmin'));

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    res.json({ items: await User.find().sort({ createdAt: -1 }) });
  }),
);

const PRODUCT_POPULATE = [
  { path: 'productModelId', populate: { path: 'brandId' } },
  { path: 'importerPartnerId' },
  { path: 'supplierPartnerId' },
  { path: 'warrantyServiceProviderId' },
  { path: 'siteId' },
  { path: 'locationId' },
  { path: 'ownerUserId', select: 'name phone email' },
];

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    // ללא סינון tenantId בכוונה - כל הציוד בכל המוסדות/לקוחות הפרטיים במערכת.
    const products = await Product.find().populate(PRODUCT_POPULATE).sort({ createdAt: -1 });
    res.json({
      items: products.map((p) => {
        const obj = p.toObject();
        return { ...obj, warrantyStatus: getWarrantyStatus(obj.warrantyEnd) };
      }),
    });
  }),
);

router.post(
  '/service-providers',
  asyncHandler(async (req, res) => {
    const { name, providerType, phone, email, address, slaHours, notes, brandIds, categories, isPrivate } =
      req.body as {
        name?: string;
        providerType?: 'importer_lab' | 'general_lab' | 'hybrid';
        phone?: string;
        email?: string;
        address?: string;
        slaHours?: number;
        notes?: string;
        brandIds?: string[];
        categories?: string[];
        isPrivate?: boolean;
      };
    if (!name?.trim() || !providerType || !phone?.trim()) {
      res.status(400).json({ error: 'חובה להזין שם, סוג נותן שירות וטלפון' });
      return;
    }
    const serviceProvider = await ServiceProvider.create({
      name: name.trim(),
      providerType,
      phone: phone.trim(),
      email: email || undefined,
      address: address || undefined,
      slaHours: slaHours || undefined,
      notes: notes || undefined,
      brandIds: brandIds ?? [],
      categories: categories ?? [],
      isPrivate: Boolean(isPrivate),
    });
    res.status(201).json({ item: serviceProvider });
  }),
);

router.patch(
  '/service-providers/:id',
  asyncHandler(async (req, res) => {
    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) {
      res.status(404).json({ error: 'נותן השירות לא נמצא' });
      return;
    }
    const fields = ['name', 'providerType', 'phone', 'email', 'address', 'slaHours', 'notes', 'brandIds', 'categories', 'isPrivate'] as const;
    const body = req.body as Record<string, unknown>;
    for (const field of fields) {
      if (body[field] !== undefined) (provider as any)[field] = body[field];
    }
    await provider.save();
    res.json({ item: provider });
  }),
);

router.delete(
  '/service-providers/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const inUse =
      (await Product.exists({ warrantyServiceProviderId: id })) || (await ServiceRequest.exists({ serviceProviderId: id }));
    if (inUse) {
      res.status(400).json({ error: 'לא ניתן למחוק נותן שירות שמשויך למוצרים או קריאות שירות קיימות' });
      return;
    }
    await ServiceProvider.findByIdAndDelete(id);
    res.status(204).send();
  }),
);

router.patch(
  '/brands/:id',
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: 'חובה להזין שם מותג' });
      return;
    }
    const brand = await Brand.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true });
    if (!brand) {
      res.status(404).json({ error: 'המותג לא נמצא' });
      return;
    }
    res.json({ item: brand });
  }),
);

router.delete(
  '/brands/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const inUse =
      (await ProductModel.exists({ brandId: id })) || (await ServiceProvider.exists({ brandIds: id }));
    if (inUse) {
      res.status(400).json({ error: 'לא ניתן למחוק מותג שיש לו דגמים או נותני שירות משויכים' });
      return;
    }
    await Brand.findByIdAndDelete(id);
    res.status(204).send();
  }),
);

router.patch(
  '/product-models/:id',
  asyncHandler(async (req, res) => {
    const { brandId, category, modelName } = req.body as { brandId?: string; category?: string; modelName?: string };
    const update: Record<string, string> = {};
    if (brandId) update.brandId = brandId;
    if (category?.trim()) update.category = category.trim();
    if (modelName?.trim()) update.modelName = modelName.trim();
    const productModel = await ProductModel.findByIdAndUpdate(req.params.id, update, { new: true }).populate('brandId');
    if (!productModel) {
      res.status(404).json({ error: 'הדגם לא נמצא' });
      return;
    }
    res.json({ item: productModel });
  }),
);

router.delete(
  '/product-models/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (await Product.exists({ productModelId: id })) {
      res.status(400).json({ error: 'לא ניתן למחוק דגם שיש לו מוצרים קיימים' });
      return;
    }
    await ProductModel.findByIdAndDelete(id);
    res.status(204).send();
  }),
);

router.patch(
  '/partners/:id',
  asyncHandler(async (req, res) => {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      res.status(404).json({ error: 'הספק/יבואן לא נמצא' });
      return;
    }
    const fields = ['type', 'name', 'contactName', 'phone', 'email', 'slaHours', 'webhookUrl'] as const;
    const body = req.body as Record<string, unknown>;
    for (const field of fields) {
      if (body[field] !== undefined) (partner as any)[field] = body[field];
    }
    await partner.save();
    res.json({ item: partner });
  }),
);

router.delete(
  '/partners/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const inUse =
      (await Product.exists({ $or: [{ importerPartnerId: id }, { supplierPartnerId: id }] })) ||
      (await ServiceRequest.exists({ assignedPartnerId: id }));
    if (inUse) {
      res.status(400).json({ error: 'לא ניתן למחוק ספק/יבואן שמשויך למוצרים או קריאות שירות קיימות' });
      return;
    }
    await Partner.findByIdAndDelete(id);
    res.status(204).send();
  }),
);

export default router;
