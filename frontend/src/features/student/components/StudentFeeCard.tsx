import React from 'react';
import { Wallet, Receipt, CreditCard, ChevronRight, Calendar } from 'lucide-react';
import { StudentFeeItem } from '../types/student.types';

interface StudentFeeCardProps {
  fee?: StudentFeeItem | null;
  onViewAll?: () => void;
}

export const StudentFeeCard: React.FC<StudentFeeCardProps> = ({
  fee,
  onViewAll
}) => {
  const feeTitle = fee?.title || 'Học phí học kỳ II';
  const amount = fee?.finalAmount ?? 4500000;
  const formattedAmount = `${amount.toLocaleString('vi-VN')}đ`;
  const isPaid = fee?.status === 'paid';
  const statusText = fee?.statusTextVi || (isPaid ? 'Đã thanh toán' : 'Chưa thanh toán');
  const dueDateStr = fee?.dueDate ? new Date(fee.dueDate).toLocaleDateString('vi-VN') : '28/11/2026';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Khoản thu
            </h2>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer shrink-0"
            >
              Xem chi tiết
            </button>
          )}
        </div>

        {/* Fee Item Card */}
        <div 
          onClick={onViewAll}
          className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-all cursor-pointer space-y-3 my-auto"
        >
          {/* Fee Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate" title={feeTitle}>
                {feeTitle}
              </h3>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hạn: {dueDateStr}</span>
              </div>
            </div>
          </div>

          {/* Amount and Status Pill */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Số tiền
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                {formattedAmount}
              </span>
            </div>

            <span className={`inline-block text-xs sm:text-sm font-bold px-3 py-1 rounded-full ${
              isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onViewAll && (
        <div className="pt-4 border-t border-slate-100 mt-3 flex justify-end">
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer group"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Thanh toán &amp; Biên lai</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};
