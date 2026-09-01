import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ProductDocument } from '../models/ProductDocument.js';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { productId } = req.query as { productId?: string };
    const query = productId ? { productId } : {};
    res.json({ items: await ProductDocument.find(query).sort({ createdAt: -1 }) });
  }),
);

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { productId, type } = req.body as { productId?: string; type?: 'invoice' | 'warranty' | 'other' };
    if (!req.file || !productId) {
      res.status(400).json({ error: 'חסר קובץ או מזהה מוצר' });
      return;
    }

    const docType = type ?? 'invoice';
    // כרגע ללא ניתוח AI - העלאה גולמית בלבד.
    const doc = await ProductDocument.create({
      productId,
      type: docType,
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mime: req.file.mimetype,
    });

    res.status(201).json({ item: doc });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await ProductDocument.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'המסמך לא נמצא' });
      return;
    }

    if (doc.productId) {
      const product = await Product.findById(doc.productId);
      const isOwner = product?.ownerUserId && String(product.ownerUserId) === req.auth!.sub;
      const isTenantStaff = req.auth!.role !== 'consumer' && product?.tenantId === req.auth!.tenantId;
      if (!isOwner && !isTenantStaff) {
        res.status(403).json({ error: 'אין הרשאה למחוק מסמך זה' });
        return;
      }
    }

    if (doc.filePath) {
      const absolutePath = path.join(UPLOAD_DIR, path.basename(doc.filePath));
      fs.unlink(absolutePath, () => {});
    }
    await doc.deleteOne();
    res.status(204).send();
  }),
);

export default router;
