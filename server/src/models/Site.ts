import { Schema, model } from 'mongoose';

const siteSchema = new Schema({
  tenantId: { type: String, index: true },
  name: { type: String, required: true },
  address: { type: String },
});

export const Site = model('Site', siteSchema);

const locationSchema = new Schema({
  siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
  name: { type: String, required: true },
});

export const Location = model('Location', locationSchema);
