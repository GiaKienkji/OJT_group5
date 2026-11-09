import React from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  subtitle,
  children
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

