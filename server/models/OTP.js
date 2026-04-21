import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  otpHash:   { type: String, required: true },
  purpose:   { type: String, enum: ['login', 'profile_update'], default: 'login' },
  expiresAt: { type: Date, required: true },
  attempts:  { type: Number, default: 0 },
}, { timestamps: true });

// MongoDB auto-deletes expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 });

export default mongoose.model('OTP', otpSchema);
