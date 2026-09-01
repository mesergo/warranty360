import { Schema, model } from 'mongoose';

const serviceProviderSchema = new Schema({
  tenantId: { type: String },
  name: { type: String, required: true },
  providerType: { type: String, enum: ['importer_lab', 'general_lab', 'hybrid'], required: true },
  isPrivate: { type: Boolean, default: false },
  supportsWarranty: { type: Boolean, default: true },
  supportsOutOfWarranty: { type: Boolean, default: true },
  partsOnly: { type: Boolean, default: false },
  supportsRepair: { type: Boolean, default: true },
  supportsOnsite: { type: Boolean, default: false },
  supportsPickupDelivery: { type: Boolean, default: false },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  slaHours: { type: Number },
  notes: { type: String },
  brandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
  categories: [{ type: String }],
});

export const ServiceProvider = model('ServiceProvider', serviceProviderSchema);
