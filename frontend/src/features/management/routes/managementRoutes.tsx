import React, { useState } from 'react';
import { ManagementLayout } from '../layouts/ManagementLayout';
import { ExecutiveDashboardPage } from '../pages/ExecutiveDashboardPage';
import { ApprovalCenterPage } from '../pages/ApprovalCenterPage';
import { TaskManagementPage } from '../pages/TaskManagementPage';
import { SchoolReportsPage } from '../pages/SchoolReportsPage';

export const ManagementRoutes: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const getPageInfo = () => {
    switch (currentTab) {
      case 'approvals':
        return {
          title: 'Trung tâm Phê duyệt & Ký duyệt Điều hành',
          subtitle: 'Phê duyệt thời khóa biểu, lịch giảng dạy, đơn xin nghỉ và đề xuất mua sắm, sửa chữa CSVC (MGT-07 → MGT-13, MGT-21, MGT-22)'
        };
      case 'tasks':
        return {
          title: 'Giao nhiệm vụ & Theo dõi Tiến độ Nhà trường',
          subtitle: 'Phân công công việc cho Tổ trưởng chuyên môn và Cơ sở vật chất, xử lý nhiệm vụ quá hạn (MGT-18 → MGT-20)'
        };
      case 'reports':
        return {
          title: 'Báo cáo Tổng hợp Vận hành & Niên khóa',
          subtitle: 'Thống kê kết quả đào tạo, chuyên cần, tiến độ vào điểm và tình hình tài chính trường học (MGT-33, MGT-34)'
        };
      case 'dashboard':
      default:
        return {
          title: 'Bảng Điều hành Toàn diện Ban Giám Hiệu',
          subtitle: 'Giám sát vận hành thời gian thực, quản lý kế hoạch năm học và khuyến nghị điều phối từ AI (MGT-02 → MGT-06, MGT-32)'
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  const renderContent = () => {
    switch (currentTab) {
      case 'approvals':
        return <ApprovalCenterPage />;
      case 'tasks':
        return <TaskManagementPage />;
      case 'reports':
        return <SchoolReportsPage />;
      case 'dashboard':
      default:
        return <ExecutiveDashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <ManagementLayout
      currentTab={currentTab}
      onSelectTab={(tab) => setCurrentTab(tab)}
      title={title}
      subtitle={subtitle}
    >
      {renderContent()}
    </ManagementLayout>
  );
};

