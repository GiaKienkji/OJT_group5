export type School = { id: string; name: string };
export type AcademicYear = { id: string; name: string; status: string };
export type Grade = { id: string; gradeNumber: number };
export type ClassInput = {
  code: string;
  name: string;
  academicYearId: string;
  gradeLevelId: string;
  capacity: number | null;
  revision?: number;
};
export type ClassRow = ClassInput & {
  id: string;
  academicYear: string;
  gradeNumber: number;
  status: string;
};
export type ClassPage = { items: ClassRow[]; total: number; pageSize: number };

export async function academicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('soms_access_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`/api/academic/${path}`, { ...options, headers });
  if (response.ok) return response.json();
  const problem = await response.json().catch(() => ({}));
  const errors = Object.values(problem.errors ?? {}).flat().join(' ');
  const fallback = response.status === 403 ? 'Bạn không có quyền thực hiện thao tác tại trường này.'
    : response.status === 401 ? 'Phiên đăng nhập đã hết hạn.'
    : `Không tải được dữ liệu (HTTP ${response.status}).`;
  const explanation = [problem.title, problem.detail].filter(item => typeof item === 'string' && item).join(' ');
  throw new Error(errors || (response.status < 500 ? explanation : null) || fallback);
}
