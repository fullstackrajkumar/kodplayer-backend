import { BaseTimestamps, createSchema } from "../../schema.helper";
import { HydratedDocument, Model } from "mongoose";
import { uuidField } from "../../uuid-fields";

export const ADMIN_MODEL_NAME = "Admin";

export const AdminSchema = createSchema(
  {
    adminId: uuidField({ unique: true, index: true }),
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    profilePicture: { type: String, required: false },
    role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    /** Unix epoch milliseconds. */
    lastLoginAt: { type: Number, required: false },
    passwordResetToken: { type: String, required: false, select: false },
    /** Unix epoch milliseconds. */
    passwordResetExpires: { type: Number, required: false, select: false },
  },
  { timestamps: true },
);

export interface Admin extends BaseTimestamps {
  adminId: string;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  role: "admin" | "super_admin";
  isActive: boolean;
  /** Unix epoch milliseconds. */
  lastLoginAt?: number;
  passwordResetToken?: string;
  /** Unix epoch milliseconds. */
  passwordResetExpires?: number;
}

export type AdminDocument = HydratedDocument<Admin>;

export interface AdminModel extends Model<AdminDocument> {}
