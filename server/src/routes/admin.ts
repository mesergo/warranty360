import { Router } from 'express';
import { User } from '../models/User.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
// כל המסלולים כאן מיועדים למנהל מערכת (superadmin) בלבד - לא למנהל מוסד רגיל.
router.use(requireAuth, requireRole('superadmin'));

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    res.json({ items: await User.find().sort({ createdAt: -1 }) });
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

export default router;
