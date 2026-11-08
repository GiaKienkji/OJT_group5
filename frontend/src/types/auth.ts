export interface DashboardOption {
  roleCode: string;
  roleName: string;
  route: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarPath?: string | null;
  roles: string[];
  permissions: string[];
  defaultDashboard: string;
  availableDashboards: DashboardOption[];
  schoolId?: string | null;
  schoolName?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: CurrentUser;
}
