import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface ManagementHeaderProps {
  title: string;
  subtitle: string;
}

export const ManagementHeader: React.FC<ManagementHeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* AI Insight Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200/60 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
          <span>Trợ lý AI BGH sẵn sàng</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.fullName}</div>
            <div className="text-[11px] text-indigo-600 font-medium">Ban Giám Hiệu</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {user?.fullName?.charAt(0) || 'M'}
          </div>
        </div>
      </div>
    </header>
  );
};
