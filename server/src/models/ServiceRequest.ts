import { Schema, model } from 'mongoose';

const serviceRequestSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    openedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedPartnerId: { type: Schema.Types.ObjectId, ref: 'Partner' },
    serviceProviderId: { type: Schema.Types.ObjectId, ref: 'ServiceProvider' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'in_progress', 'waiting', 'closed', 'cancelled'],
      default: 'draft',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    description: { type: String, required: true },
    warrantySnapshot: {
      isUnderWarranty: { type: Boolean, required: true },
      warrantyEnd: { type: Date, required: true },
    },
    leadStatus: {
      type: String,
      enum: ['new', 'sent', 'received', 'in_treatment', 'rejected', 'closed'],
    },
    sentAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export const ServiceRequest = model('ServiceRequest', serviceRequestSchema);

const serviceMessageSchema = new Schema(
  {
    serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    authorType: { type: String, enum: ['user', 'partner', 'system'], required: true },
    authorId: { type: Schema.Types.ObjectId },
    body: { type: String, required: true },
    attachmentsJson: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const ServiceMessage = model('ServiceMessage', serviceMessageSchema);
