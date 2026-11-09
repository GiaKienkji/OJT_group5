import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  User, 
  X
} from 'lucide-react';
import { managementApi } from '../services/managementApi';
import { SchoolTaskItem, CreateTaskInput } from '../types/management.types';

export const TaskManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<SchoolTaskItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [createForm, setCreateForm] = useState<CreateTaskInput>({
    schoolId: '',
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
    dueDate: '',
    assigneeIds: []
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await managementApi.getTasks(undefined, statusFilter || undefined);
      setTasks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await managementApi.createTask(createForm);
      alert('Đã giao nhiệm vụ mới thành công!');
      setShowCreateModal(false);
      setCreateForm({
        schoolId: '',
        title: '',
        description: '',
        category: 'academic',
        priority: 'medium',
        dueDate: '',
        assigneeIds: []
      });
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo nhiệm vụ');
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await managementApi.completeTask(id);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận hoàn thành');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Giao việc & Giám sát Tiến độ Nhà trường (BF08)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ban giám hiệu phân công nhiệm vụ cho Tổ trưởng chuyên môn (TV3) và nhân viên Cơ sở vật chất (TV4).
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Giao nhiệm vụ mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        {['', 'not_started', 'in_progress', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? 'Tất cả nhiệm vụ' : s === 'not_started' ? 'Chưa bắt đầu' : s === 'in_progress' ? 'Đang thực hiện' : 'Đã hoàn thành'}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            {loading ? 'Đang tải danh sách công việc...' : 'Không có nhiệm vụ nào trong danh sách.'}
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {task.categoryNameVi}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {task.status === 'completed' ? 'Hoàn tất' : task.status === 'in_progress' ? 'Đang làm' : 'Chưa bắt đầu'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description || 'Không có mô tả chi tiết.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {task.assignments[0]?.assigneeName || 'Tổ bộ môn phụ trách'}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không hạn'}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Tiến độ thực hiện</span>
                    <span>{task.assignments[0]?.progressPercent || (task.status === 'completed' ? 100 : 0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${task.assignments[0]?.progressPercent || (task.status === 'completed' ? 100 : 0)}%` }}
                    />
                  </div>
                </div>

                {task.status !== 'completed' && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Giao Nhiệm vụ & Công việc Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề nhiệm vụ *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Ví dụ: Kiểm kê thiết bị phòng máy số 2 trước kỳ thi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="academic">Chuyên môn (TV3)</option>
                    <option value="facility">Cơ sở vật chất (TV4)</option>
                    <option value="administrative">Hành chính / Giáo vụ</option>
                    <option value="event">Sự kiện nhà trường</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức ưu tiên</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Bình thường</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hạn nộp / Hoàn thành</label>
                <input
                  type="date"
                  value={createForm.dueDate || ''}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung yêu cầu chi tiết</label>
                <textarea
                  rows={3}
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Ghi rõ tiêu chuẩn đầu ra, tài liệu bàn giao..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500"
                >
                  Giao nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
