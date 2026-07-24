import {
  listUsersForAdmin,
  type AdminUserRow,
} from "@/server/repositories/user.repository";

export type { AdminUserRow };

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  return listUsersForAdmin();
}
