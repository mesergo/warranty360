import { Schema, model } from 'mongoose';

const otpLoginSchema = new Schema(
  {
    tenantId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    phone: { type: String, required: true, index: true },
    // provider='internal' (קוד מיוצר ומאוחסן מוצפן על ידינו, למצב פיתוח/גיבוי)
    // provider='external' (השליחה והאימות מתבצעים מול wa.message.co.il, לפי תיעוד ה-API)
    provider: { type: String, enum: ['internal', 'external'], required: true, default: 'internal' },
    codeHash: { type: String },
    providerCookie: { type: String },
    channel: { type: String, enum: ['sms', 'whatsapp', 'ivr'], default: 'sms' },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export const OtpLogin = model('OtpLogin', otpLoginSchema);
