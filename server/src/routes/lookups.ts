import { Router } from 'express';
import { Brand, ProductModel } from '../models/Brand.js';
import { Partner } from '../models/Partner.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { Site, Location } from '../models/Site.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/brands',
  asyncHandler(async (_req, res) => {
    res.json({ items: await Brand.find().sort({ name: 1 }) });
  }),
);

router.post(
  '/brands',
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: 'חובה להזין שם מותג' });
      return;
    }
    const existing = await Brand.findOne({ name: name.trim() });
    if (existing) {
      res.status(201).json({ item: existing });
      return;
    }
    const brand = await Brand.create({ name: name.trim() });
    res.status(201).json({ item: brand });
  }),
);

router.get(
  '/product-models',
  asyncHandler(async (_req, res) => {
    res.json({ items: await ProductModel.find().populate('brandId').sort({ modelName: 1 }) });
  }),
);

router.post(
  '/product-models',
  asyncHandler(async (req, res) => {
    const { brandId, category, modelName } = req.body as { brandId?: string; category?: string; modelName?: string };
    if (!brandId || !category?.trim() || !modelName?.trim()) {
      res.status(400).json({ error: 'חובה לבחור מותג ולהזין קטגוריה ושם דגם' });
      return;
    }
    const model = await ProductModel.create({ brandId, category: category.trim(), modelName: modelName.trim() });
    const populated = await model.populate('brandId');
    res.status(201).json({ item: populated });
  }),
);

router.get(
  '/partners',
  asyncHandler(async (_req, res) => {
    // webhookUrl הוא שדה אינטגרציה פנימי (נערך רק ע"י superadmin) - לא לחשוף אותו ללקוחות.
    res.json({ items: await Partner.find().select('-webhookUrl').sort({ name: 1 }) });
  }),
);

router.post(
  '/partners',
  asyncHandler(async (req, res) => {
    const { type, name, phone, contactName, email } = req.body as {
      type?: 'supplier' | 'importer';
      name?: string;
      phone?: string;
      contactName?: string;
      email?: string;
    };
    if (!name?.trim() || (type !== 'supplier' && type !== 'importer')) {
      res.status(400).json({ error: 'חובה להזין שם ולבחור סוג (ספק/יבואן)' });
      return;
    }
    const partner = await Partner.create({ type, name: name.trim(), phone, contactName, email });
    res.status(201).json({ item: partner });
  }),
);

router.get(
  '/service-providers',
  asyncHandler(async (req, res) => {
    // ספק "פרטי" (isPrivate) שייך למוסד ספציפי - לא לחשוף אותו למוסדות/לקוחות אחרים.
    res.json({
      items: await ServiceProvider.find({
        $or: [{ isPrivate: { $ne: true } }, { tenantId: req.auth!.tenantId }],
      }),
    });
  }),
);

router.get(
  '/sites',
  asyncHandler(async (req, res) => {
    res.json({ items: await Site.find({ tenantId: req.auth!.tenantId }).sort({ name: 1 }) });
  }),
);

router.post(
  '/sites',
  requireRole('admin', 'technician'),
  asyncHandler(async (req, res) => {
    const { name, address } = req.body as { name?: string; address?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: 'חובה להזין שם מבנה' });
      return;
    }
    const site = await Site.create({ tenantId: req.auth!.tenantId, name: name.trim(), address });
    res.status(201).json({ item: site });
  }),
);

router.get(
  '/locations',
  asyncHandler(async (req, res) => {
    // מיקומים אינם ישות משותפת כמו מותג/ספק - הם ספציפיים למבנה של מוסד מסוים,
    // ולכן חייבים סינון לפי מבנים ששייכים לטננט הנוכחי בלבד.
    const siteIds = await Site.find({ tenantId: req.auth!.tenantId }).distinct('_id');
    res.json({ items: await Location.find({ siteId: { $in: siteIds } }).sort({ name: 1 }) });
  }),
);

router.post(
  '/locations',
  requireRole('admin', 'technician'),
  asyncHandler(async (req, res) => {
    const { siteId, name, parentId } = req.body as { siteId?: string; name?: string; parentId?: string };
    if (!siteId || !name?.trim()) {
      res.status(400).json({ error: 'חובה לבחור מבנה ולהזין שם מיקום' });
      return;
    }
    // מוודאים שהמבנה שייך לטננט של הקורא - אחרת אפשר "לתלות" מיקום במבנה של מוסד אחר.
    const site = await Site.findOne({ _id: siteId, tenantId: req.auth!.tenantId });
    if (!site) {
      res.status(403).json({ error: 'אין הרשאה למבנה זה' });
      return;
    }
    const location = await Location.create({ siteId, name: name.trim(), parentId: parentId || undefined });
    res.status(201).json({ item: location });
  }),
);

export default router;
