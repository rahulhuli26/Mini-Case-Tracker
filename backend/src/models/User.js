import mongoose from 'mongoose';

/**
 * Schema for an application user. `role` determines authorization: a
 * `Manager` creates and assigns cases while an `Agent` works assigned cases.
 * Passwords are stored as bcrypt hashes.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Manager', 'Agent'], required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

/** @typedef {import('mongoose').Document & {name: string, email: string, password: string, role: 'Manager'|'Agent', isActive: boolean}} UserDocument */

/** Mongoose model for the `users` collection. */
const User = mongoose.model('User', userSchema);
export default User;
