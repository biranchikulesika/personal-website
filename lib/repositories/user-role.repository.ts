import type { AppRole, UserRole } from "@/lib/types";

export interface UserRoleRepository {
  getUserRole(userId: string): Promise<AppRole | null>;
  setUserRole(userId: string, role: AppRole): Promise<void>;
  getAllUserRoles(): Promise<UserRole[]>;
}
