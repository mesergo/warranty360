import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { ProductDocument } from '../models/ProductDocument.js';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertProductAccess } from '../utils/productAccess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// מותרים רק סוגי קבצים שהאפליקציה באמת מציגה (חשבוניות/תעודות בפורמט PDF, או תמונה של המסמך).
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // שם קובץ אקראי לגמרי - לעולם לא נגזר מ-originalname (שהוא קלט חיצוני לא מהימן), כדי
  // שלא יהיה אפשר "לברוח" מתיקיית ההעלאות עם path traversal (../) ולדרוס קבצים אחרים בשרת.
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype] ?? '';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
      cb(new Error('סוג קובץ לא נתמך - יש להעלות PDF או תמונה (JPG/PNG/WEBP/HEIC) בלבד'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { productId } = req.query as { productId?: string };
    if (!productId || typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
      res.status(400).json({ error: 'חובה לספק מזהה מוצר תקין' });
      return;
    }
    const product = await assertProductAccess(productId, req.auth!);
    if (!product) {
      res.status(product === null ? 404 : 403).json({ error: 'אין הרשאה לצפות במסמכי מוצר זה' });
      return;
    }
    res.json({ items: await ProductDocument.find({ productId }).sort({ createdAt: -1 }) });
  }),
);

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { productId, type } = req.body as { productId?: string; type?: 'invoice' | 'warranty' | 'other' };
    if (!req.file || !productId || typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(400).json({ error: 'חסר קובץ או מזהה מוצר תקין' });
      return;
    }

    const product = await assertProductAccess(productId, req.auth!);
    if (!product) {
      fs.unlink(req.file.path, () => {});
      res.status(product === null ? 404 : 403).json({ error: 'אין הרשאה להעלות מסמך למוצר זה' });
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
    } else {
      // מסמך בלי productId לא אמור לקרות דרך ה-API (תמיד נדרש בהעלאה), אבל ליתר ביטחון
      // דוחים ולא מוחקים - ברירת מחדל "אין הרשאה" ולא "אין בדיקה".
      res.status(403).json({ error: 'אין הרשאה למחוק מסמך זה' });
      return;
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
