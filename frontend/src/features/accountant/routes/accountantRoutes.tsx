import React, { useState } from 'react';
import {
  Building, FileText, CheckCircle, DollarSign, Wallet,
  Bell, FileEdit, FileSpreadsheet,
} from 'lucide-react';
import { FinanceDashboardPage } from '../pages/FinanceDashboardPage';
import { FeeCategoriesPage } from '../pages/FeeCategoriesPage';
import { FeeCampaignsPage } from '../pages/FeeCampaignsPage';
import { ChargesPage } from '../pages/ChargesPage';
import { ExemptionsPage } from '../pages/ExemptionsPage';
import { NoticesPage } from '../pages/NoticesPage';
import { AdjustmentsPage } from '../pages/AdjustmentsPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { FinanceReportsPage } from '../pages/FinanceReportsPage';

const TABS = [
  { key: 'dashboard', label: 'Tổng quan', icon: <Building className="w-4 h-4" />, page: <FinanceDashboardPage /> },
  { key: 'categories', label: 'Danh mục khoản thu', icon: <FileText className="w-4 h-4" />, page: <FeeCategoriesPage /> },
  { key: 'campaigns', label: 'Chiến dịch học phí', icon: <CheckCircle className="w-4 h-4" />, page: <FeeCampaignsPage /> },
  { key: 'charges', label: 'Khoản thu & Công nợ', icon: <Wallet className="w-4 h-4" />, page: <ChargesPage /> },
  { key: 'payments', label: 'Thanh toán & Đối soát', icon: <DollarSign className="w-4 h-4" />, page: <PaymentsPage /> },
  { key: 'exemptions', label: 'Miễn giảm', icon: <FileText className="w-4 h-4" />, page: <ExemptionsPage /> },
  { key: 'notices', label: 'Thông báo', icon: <Bell className="w-4 h-4" />, page: <NoticesPage /> },
  { key: 'adjustments', label: 'Điều chỉnh & Hoàn tiền', icon: <FileEdit className="w-4 h-4" />, page: <AdjustmentsPage /> },
  { key: 'reports', label: 'Báo cáo & Xuất file', icon: <FileSpreadsheet className="w-4 h-4" />, page: <FinanceReportsPage /> },
];

export const AccountantRoutes: React.FC = () => {
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
