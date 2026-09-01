import { Schema, model } from 'mongoose';

const qrTagSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  printed: { type: Boolean, default: false },
  lastScannedAt: { type: Date },
  scansCount: { type: Number, default: 0 },
});

export const QrTag = model('QrTag', qrTagSchema);
