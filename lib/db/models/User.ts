import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * Member / administrator account.
 *
 * `passwordHash` holds a bcrypt hash — plain-text passwords are never stored
 * and the field is `select: false`, so it is excluded from query results unless
 * a caller explicitly asks for it (the login flow does). That makes it very
 * hard to leak a hash through an API response by accident.
 */

export const USER_ROLES = ["member", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type UserDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "member", index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

// One account per email address. Unique index doubles as the lookup index for
// sign-in, which queries by email on every attempt.
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", UserSchema);
