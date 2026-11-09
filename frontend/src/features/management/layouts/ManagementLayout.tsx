import React from 'react';
import { ManagementSidebar } from '../components/ManagementSidebar';
import { ManagementHeader } from '../components/ManagementHeader';

interface ManagementLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  title: string;
  subtitle: string;
  pendingCount?: number;
  children: React.ReactNode;
}

export const ManagementLayout: React.FC<ManagementLayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  subtitle,
  pendingCount = 0,
  children
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <ManagementSidebar 
        currentTab={currentTab} 
        onSelectTab={onSelectTab} 
        pendingCount={pendingCount} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ManagementHeader title={title} subtitle={subtitle} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

