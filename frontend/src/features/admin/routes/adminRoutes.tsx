import React, { useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { RolePermissionsPage } from '../pages/RolePermissionsPage';
import { SchoolConfigPage } from '../pages/SchoolConfigPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';

export const AdminRoutes: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const getPageInfo = () => {
    switch (currentTab) {
      case 'users':
        return {
          title: 'Quản lý Tài khoản & Người dùng',
          subtitle: 'Thêm mới, cập nhật, khóa tài khoản và phân quyền cho cán bộ, giáo viên, học sinh (ADM-04 → ADM-09)'
        };
      case 'roles':
        return {
          title: 'Ma trận Phân quyền Vai trò (RBAC)',
          subtitle: 'Thiết lập danh mục 9 Actor và tùy biến chi tiết 56 Permissions (ADM-10 → ADM-12)'
        };
      case 'config':
        return {
          title: 'Cấu hình Đơn vị & Năm học',
          subtitle: 'Quản trị hồ sơ trường học, thiết lập niên khóa và các học kỳ đào tạo (ADM-13, ADM-14)'
        };
      case 'audit':
        return {
          title: 'Nhật ký Hoạt động & Giám sát An toàn',
          subtitle: 'Theo dõi lịch sử đăng nhập, phiên truy cập và ghi vết thay đổi dữ liệu nhạy cảm (ADM-21, ADM-22)'
        };
      case 'dashboard':
      default:
        return {
          title: 'Bảng điều khiển Quản trị viên Tối cao',
          subtitle: 'Tổng quan vận hành hệ thống, tình trạng dịch vụ và chỉ số tài khoản'
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  const renderContent = () => {
    switch (currentTab) {
      case 'users':
        return <UserManagementPage />;
      case 'roles':
        return <RolePermissionsPage />;
      case 'config':
        return <SchoolConfigPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'dashboard':
      default:
        return <AdminDashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => setCurrentTab(tab)}
      title={title}
      subtitle={subtitle}
    >
      {renderContent()}
    </AdminLayout>
  );
};

