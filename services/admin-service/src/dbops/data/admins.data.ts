import { _getDateLogs } from "../dbops.helper";

/** Source rows for admin seed / migrations (`password` is plain text; hashed in `getAdminsFormattedData`). */
export interface AdminSeedRow {
  /** Stable business id (JWT `sub`); keep fixed per email so re-seeding does not break sessions. */
  adminId: string;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  role: "admin" | "super_admin";
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
}

export const getAdminsData = (): AdminSeedRow[] => [
  {
    adminId: "a0000001-0000-4000-8000-000000000001",
    name: "KodPlayer Admin",
    email: "admin@kodplayer.com",
    password: "Admin@123456",
    profilePicture: "",
    role: "super_admin",
    isActive: true,
    ..._getDateLogs(),
  },
];
