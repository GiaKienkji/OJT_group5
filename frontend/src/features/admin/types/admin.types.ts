export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarPath?: string;
  status: 'active' | 'locked' | 'inactive';
  roles: string[];
  roleNamesVi: string[];
  schoolId?: string;
  schoolName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  roleCodes: string[];
  schoolId?: string;
}

export interface UpdateUserInput {
  fullName: string;
  phone?: string;
  status: string;
  roleCodes: string[];
}

export interface UserQueryFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  roleCode?: string;
  status?: string;
  schoolId?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RoleDetail {
  code: string;
  nameVi: string;
  description?: string;
  userCount: number;
  permissionCodes: string[];
}

export interface PermissionItem {
  code: string;
  description?: string;
  module: string;
}

export interface SchoolConfig {
  id: string;
  code: string;
  name: string;
  level: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export interface AcademicYearItem {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semesters: SemesterItem[];
}

export interface SemesterItem {
  id: string;
  academicYearId: string;
  code: string;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface CreateAcademicYearInput {
  schoolId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semesters?: {
    code: string;
    name: string;
    termNumber: number;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }[];
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityName?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userFullName?: string;
  schoolName?: string;
  createdAt: string;
}

export interface UserSessionItem {
  id: string;
  userId: string;
  userFullName: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface SystemHealthStatus {
  status: string;
  serverTime: string;
  activeUsersCount: number;
  totalUsersCount: number;
  totalSchoolsCount: number;
  databaseConnection: string;
}

