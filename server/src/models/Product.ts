import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    tenantId: { type: String, index: true },
    productModelId: { type: Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    serialNumber: { type: String },
    assetTag: { type: String },
    purchaseDate: { type: Date, required: true },
    warrantyStart: { type: Date, required: true },
    warrantyEnd: { type: Date, required: true },
    purchasedAtBranch: { type: String },
    importerPartnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
    supplierPartnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
    warrantyServiceProviderId: { type: Schema.Types.ObjectId, ref: 'ServiceProvider' },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    reportedInstallLocation: { type: String },
    status: { type: String, enum: ['active', 'retired'], default: 'active' },
    notes: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export const Product = model('Product', productSchema);
