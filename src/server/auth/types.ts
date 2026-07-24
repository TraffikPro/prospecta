export type UserRole = "ADMIN" | "MEMBER";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
};
