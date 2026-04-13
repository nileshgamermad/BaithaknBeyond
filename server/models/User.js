import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String },              // optional — OAuth users have no password
    role:       { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar:     { type: String },
    provider:   { type: String, default: 'local' }, // 'local' | 'google' | 'facebook' | 'apple'
    googleId:   { type: String },
    facebookId: { type: String },
    appleId:    { type: String },
    bookmarks:  { type: [String], default: [] }, // story IDs saved by this user
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
