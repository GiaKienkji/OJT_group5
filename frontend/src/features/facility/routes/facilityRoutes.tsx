import React, { useState } from 'react';
import {
  Building, FileText, CheckCircle, ClipboardCheck, ArrowLeftRight,
  Wrench, Calendar, ShoppingCart, FileSpreadsheet,
} from 'lucide-react';
import { FacilityDashboardPage } from '../pages/FacilityDashboardPage';
import { RoomsPage } from '../pages/RoomsPage';
import { AssetsPage } from '../pages/AssetsPage';
import { BorrowRequestsPage } from '../pages/BorrowRequestsPage';
import { IncidentsAndRepairsPage } from '../pages/IncidentsAndRepairsPage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { ProposalsPage } from '../pages/ProposalsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { FacilityReportsPage } from '../pages/FacilityReportsPage';

const TABS = [
  { key: 'dashboard', label: 'Tổng quan', icon: <Building className="w-4 h-4" />, page: <FacilityDashboardPage /> },
  { key: 'rooms', label: 'Phòng học', icon: <FileText className="w-4 h-4" />, page: <RoomsPage /> },
  { key: 'assets', label: 'Tài sản', icon: <CheckCircle className="w-4 h-4" />, page: <AssetsPage /> },
  { key: 'inventory', label: 'Kiểm kê', icon: <ClipboardCheck className="w-4 h-4" />, page: <InventoryPage /> },
  { key: 'loans', label: 'Mượn / Trả', icon: <ArrowLeftRight className="w-4 h-4" />, page: <BorrowRequestsPage /> },
  { key: 'repairs', label: 'Sự cố & Sửa chữa', icon: <Wrench className="w-4 h-4" />, page: <IncidentsAndRepairsPage /> },
  { key: 'maintenance', label: 'Bảo trì định kỳ', icon: <Calendar className="w-4 h-4" />, page: <MaintenancePage /> },
  { key: 'proposals', label: 'Đề xuất mua sắm', icon: <ShoppingCart className="w-4 h-4" />, page: <ProposalsPage /> },
  { key: 'reports', label: 'Báo cáo & Xuất file', icon: <FileSpreadsheet className="w-4 h-4" />, page: <FacilityReportsPage /> },
];

export const FacilityRoutes: React.FC = () => {
  const [active, setActive] = useState<string>('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              active === t.key
                ? 'bg-[#0B4F8A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">{TABS.find((t) => t.key === active)?.page}</div>
    </div>
  );
};
