import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['consumer', 'admin', 'technician'], required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
