import { Schema, model } from 'mongoose';

const partnerSchema = new Schema({
  type: { type: String, enum: ['supplier', 'importer'], required: true },
  name: { type: String, required: true },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  slaHours: { type: Number },
  webhookUrl: { type: String },
});

export const Partner = model('Partner', partnerSchema);
