import React from 'react';
import { 
  Download, 
  PieChart, 
  CheckCircle2, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const SchoolReportsPage: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Báo cáo Vận hành Toàn trường & Niên khóa (MGT-33, MGT-34)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu chuyên môn, điểm danh, tiến độ nhập điểm giáo viên và doanh thu học phí theo định kỳ.
          </p>
        </div>

        <button
          onClick={() => alert('Đang tạo báo cáo tổng hợp PDF (MGT-34)...')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo Ban Giám Hiệu
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Chuyên cần & Tỷ lệ đi học</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tỷ lệ chuyên cần trung bình toàn trường đạt <strong>97.2%</strong>. Khối 12 đạt tỷ lệ cao nhất (98.4%).
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Báo cáo tuần 11</span>
            <button 
              onClick={() => alert('Đang tải file CSV...')}
              className="flex items-center gap-1 hover:underline"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Tiến độ Nhập điểm & Học tập</h3>
            <p className="text-xs text-slate-500 mt-1">
              Đã hoàn thành <strong>88.0%</strong> cột điểm định kỳ. Có 2 tổ chuyên môn cần nhắc nhở khóa điểm trước ngày 15.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Học kỳ 1 • 2025-2026</span>
            <button 
              onClick={() => alert('Đang tải file CSV...')}
              className="flex items-center gap-1 hover:underline"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Thu Học phí & Đối soát Tài chính</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tổng tiền thu được <strong>2.85 tỷ / 3.20 tỷ VNĐ</strong> (đạt 89.1%). Công nợ còn lại thuộc về các diện nộp chậm.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Đợt thu 1</span>
            <button 
              onClick={() => alert('Đang tải file CSV...')}
              className="flex items-center gap-1 hover:underline"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
