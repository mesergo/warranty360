import { Schema, model } from 'mongoose';

const documentSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
    type: { type: String, enum: ['invoice', 'warranty', 'other'], required: true },
    fileName: { type: String, required: true },
    filePath: { type: String },
    mime: { type: String },
    extractionStatus: { type: String, enum: ['pending', 'processing', 'done', 'failed'] },
    extractedJson: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const ProductDocument = model('ProductDocument', documentSchema);
