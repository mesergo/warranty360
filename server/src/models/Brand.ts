import { Schema, model } from 'mongoose';

const brandSchema = new Schema({
  name: { type: String, required: true },
  logoPath: { type: String },
});

export const Brand = model('Brand', brandSchema);

const productModelSchema = new Schema({
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: String, required: true },
  modelName: { type: String, required: true },
  specs: { type: Schema.Types.Mixed },
});

export const ProductModel = model('ProductModel', productModelSchema);
