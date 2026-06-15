import * as bcrypt from "bcrypt";
import { getAdminsData } from "./admins.data";

const SALT_ROUNDS = 10;

interface AdminFormattedData {
  adminId: string;
  name: string;
  email: string;
  password: string;
  profilePicture: string;
  role: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function getAdminsFormattedData(): Promise<AdminFormattedData[]> {
  const raw = getAdminsData();
  return Promise.all(
    raw.map(async (row) => ({
      adminId: row.adminId,
      name: row.name,
      email: row.email.toLowerCase(),
      password: await bcrypt.hash(row.password, SALT_ROUNDS),
      profilePicture: row.profilePicture ?? "",
      role: row.role ?? "admin",
      isActive: row.isActive !== false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  );
}
