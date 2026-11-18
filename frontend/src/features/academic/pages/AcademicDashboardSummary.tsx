import { useEffect, useState } from 'react';
import { academicRequest, AcademicYear, School } from '../services/classApi';

type Semester = { id: string; name: string; academicYearId: string };
type Counts = { students: number; classes: number; unmetAssignments: number; drafts: number; conflictedDrafts: number; needsSubstitute: number };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2';

export function AcademicDashboardSummary() {
  const [schools, setSchools] = useState<School[]>([]);
  const [school, setSchool] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [filters, setFilters] = useState<{ years: AcademicYear[]; semesters: Semester[] } | null>(null);
  const [summary, setSummary] = useState<Counts | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setError(''); setPending(true);
    academicRequest<School[]>('context', { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setSchools(data);
      setSchool(current => data.some(item => item.id === current) ? current : data.length === 1 ? data[0].id : '');
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setPending(false); });
    return () => abort.abort();
  }, [retry]);

  useEffect(() => {
    if (!school) return;
    const abort = new AbortController();
    academicRequest<{ years: AcademicYear[]; semesters: Semester[] }>(`dashboard/filters?schoolId=${school}`, { signal: abort.signal })
      .then(data => { if (!abort.signal.aborted) setFilters(data); })
      .catch(err => { if (!abort.signal.aborted) setError(err.message); });
    return () => abort.abort();
  }, [school, retry]);

  useEffect(() => {
    if (!school) return;
    const abort = new AbortController();
    const query = new URLSearchParams({ schoolId: school });
    if (year) query.set('academicYearId', year);
    if (semester) query.set('semesterId', semester);
    setPending(true); setSummary(null);
    academicRequest<Counts>(`dashboard?${query}`, { signal: abort.signal })
      .then(data => { if (!abort.signal.aborted) setSummary(data); })
      .catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setPending(false); });
    return () => abort.abort();
  }, [school, year, semester, retry]);

  return <section className="space-y-4" aria-label="Tổng quan Giáo vụ">
    <div className="flex flex-wrap gap-3">
      {schools.length > 0 && <label className="grid gap-1">Trường
        <select className={field} value={school} disabled={schools.length === 1} onChange={event => {
          setSchool(event.target.value); setFilters(null); setYear(''); setSemester(''); setSummary(null); setError('');
        }}><option value="">Chọn trường</option>
          {schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>}
      {filters && <>
        <label className="grid gap-1">Năm học<select className={field} value={year}
          onChange={event => { setYear(event.target.value); setSemester(''); setError(''); }}>
          <option value="">Tất cả năm</option>{filters.years.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label className="grid gap-1">Học kỳ<select className={field} value={semester}
          onChange={event => { setSemester(event.target.value); setError(''); }}>
          <option value="">Tất cả học kỳ</option>
          {filters.semesters.filter(item => !year || item.academicYearId === year)
            .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
      </>}
    </div>
    {pending && <p role="status">Đang tải số liệu Giáo vụ.</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button></p>}
    {summary && <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {([
        ['Học sinh đang học', summary.students], ['Lớp hoạt động', summary.classes],
        ['Môn lớp/kỳ còn thiếu tiết phân công', summary.unmetAssignments], ['Lịch nháp', summary.drafts],
        ['Bản nháp có xung đột', summary.conflictedDrafts], ['Ca cần dạy thay trong 7 ngày', summary.needsSubstitute],
      ] as const).map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
        <dt className="text-sm text-slate-700">{label}</dt><dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd>
      </div>)}
    </dl>}
  </section>;
}
