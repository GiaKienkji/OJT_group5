import React from 'react';

export const fmtMoney = (n: number | string | null | undefined): string => {
  const num = typeof n === 'string' ? parseFloat(n) : (n as number | null | undefined);
  if (num === null || num === undefined || isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('vi-VN');
};

export const fmtDateTime = (d: string | null | undefined): string => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString('vi-VN');
};

export const cls = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');

type Tone = 'navy' | 'green' | 'amber' | 'red' | 'slate' | 'blue' | 'purple' | 'cyan';

const badgeTones: Record<Tone, string> = {
  navy: 'bg-blue-50 text-[#0B4F8A]',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  cyan: 'bg-cyan-50 text-cyan-700',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = 'slate', children }) => (
  <span className={cls('inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold', badgeTones[tone])}>
    {children}
  </span>
);

export const statusTone = (status: string): Tone => {
  const s = status.toLowerCase();
  if (['paid', 'verified', 'approved', 'active', 'available', 'working', 'resolved', 'closed', 'completed', 'handed_over', 'planned', 'done', 'executed'].includes(s)) return 'green';
  if (['partially_paid', 'pending', 'in_progress', 'assigned', 'maintenance', 'draft', 'damaged', 'open'].includes(s)) return 'amber';
  if (['unpaid', 'rejected', 'refunded', 'overdue', 'lost', 'critical', 'high', 'canceled', 'cancelled'].includes(s)) return 'red';
  if (['retired', 'medium', 'low'].includes(s)) return 'slate';
  return 'navy';
};

export const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    paid: 'Đã thu', unpaid: 'Chưa thu', partially_paid: 'Thu một phần', overdue: 'Quá hạn',
    verified: 'Đã xác nhận', pending: 'Chờ xử lý', rejected: 'Từ chối', refunded: 'Đã hoàn tiền',
    approved: 'Đã duyệt', active: 'Đang áp dụng', draft: 'Nháp',
    available: 'Hoạt động', maintenance: 'Đang bảo trì', closed: 'Đóng',
    working: 'Hoạt động', damaged: 'Hỏng', retired: 'Thanh lý', lost: 'Mất',
    open: 'Mở', assigned: 'Đã phân công', in_progress: 'Đang xử lý', resolved: 'Đã xử lý',
    completed: 'Hoàn tất', handed_over: 'Đã bàn giao', returned: 'Đã trả',
    planned: 'Theo kế hoạch', executed: 'Đã thực hiện', refund: 'Hoàn tiền',
    correction: 'Điều chỉnh', low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Nghiêm trọng',
  };
  return labels[status] || status;
};

export const moneyTone = (status: string): Tone => {
  const s = status.toUpperCase();
  if (['PAID', 'PENDING'].includes(s)) return 'green';
  return 'amber';
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

type ButtonExtra = { size?: 'sm' | 'md' };

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonExtra> = ({ size, ...props }) => (
  <button
    {...props}
    className={cls(
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
      'inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F8A] text-white font-semibold',
      'hover:bg-[#0a4481] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      props.className,
    )}
  />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonExtra> = ({ size, ...props }) => (
  <button
    {...props}
    className={cls(
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
      'inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold',
      'hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      props.className,
    )}
  />
);

export const DangerButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonExtra> = ({ size, ...props }) => (
  <button
    {...props}
    className={cls(
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
      'inline-flex items-center gap-1.5 rounded-xl bg-red-600 text-white font-semibold',
      'hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      props.className,
    )}
  />
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={cls(
      'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900',
      'focus:outline-none focus:ring-2 focus:ring-[#0B4F8A]/30 focus:border-[#0B4F8A] placeholder:text-slate-400',
      props.className,
    )}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={cls(
      'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900',
      'focus:outline-none focus:ring-2 focus:ring-[#0B4F8A]/30 focus:border-[#0B4F8A]',
      props.className,
    )}
  />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={cls(
      'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900',
      'focus:outline-none focus:ring-2 focus:ring-[#0B4F8A]/30 focus:border-[#0B4F8A] placeholder:text-slate-400',
      props.className,
    )}
  />
);

export const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
}> = ({ title, onClose, children, footer, open = true }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <th
    {...props}
    className={cls('px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500', props.className)}
  />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <td {...props} className={cls('px-4 py-3 text-sm text-slate-700 border-t border-slate-100', props.className)} />
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cls('bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden', className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <h3 className="font-bold text-slate-900">{title}</h3>
    {action}
  </div>
);

export const TableWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto">{children}</div>
);

export const Loading: React.FC<{ text?: string }> = ({ text = 'Đang tải dữ liệu…' }) => (
  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
    <span className="inline-block w-5 h-5 border-2 border-[#0B4F8A] border-t-transparent rounded-full animate-spin mr-2" />
    {text}
  </div>
);

export const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
    <span>{message}</span>
    {onRetry && (
      <button onClick={onRetry} className="font-semibold underline cursor-pointer shrink-0 ml-3">Thử lại</button>
    )}
  </div>
);

export const Empty: React.FC<{ text?: string }> = ({ text = 'Chưa có dữ liệu' }) => (
  <div className="py-10 text-center text-sm text-slate-400">{text}</div>
);

export const Toast: React.FC<{ message: string; onClose: () => void; tone?: 'success' | 'error' }> = ({ message, onClose, tone = 'success' }) => (
  <div className="fixed top-4 right-4 z-[60] flex items-center gap-3 bg-white rounded-xl shadow-lg border px-4 py-3 text-sm font-medium animate-[fadeIn_.2s_ease]">
    <span className={tone === 'success' ? 'text-emerald-600' : 'text-red-600'}>{tone === 'success' ? '✓' : '✕'}</span>
    <span className="text-slate-800">{message}</span>
    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
  </div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: string }> = ({ label, value, icon, tone = 'text-[#0B4F8A]' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-3">
    {icon && <div className={cls('w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0', tone)}>{icon}</div>}
    <div>
      <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  </div>
);