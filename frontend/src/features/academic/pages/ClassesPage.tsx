import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, AcademicYear, ClassInput, ClassPage, ClassRow, Grade, School } from '../services/classApi';

import { ClassRoster } from './ClassRoster';
import { ClassAssignments } from './ClassAssignments';
import { useAuth } from '../../../context/AuthContext';

const emptyForm: ClassInput = { code: '', name: '', academicYearId: '', gradeLevelId: '', capacity: null };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2';
const button = 'rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50';

export function ClassesPage() {
  const { hasPermission } = useAuth();
  const canAssign = hasPermission('teaching_assignments.manage') || hasPermission('homeroom.assign') || hasPermission('subjects.manage');
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [yearId, setYearId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ClassPage | null>(null);
  const [retry, setRetry] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ClassRow | null>(null);
  const [roster, setRoster] = useState<ClassRow | null>(null);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [form, setForm] = useState<ClassInput | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setLoading(true);
    academicRequest<School[]>('classes/context', { signal: controller.signal }).then(data => {
      setSchools(data);
      setSchoolId(selected => data.some(school => school.id === selected) ? selected : data.length === 1 ? data[0].id : '');
      setLoading(false);
    }).catch(err => {
      if (controller.signal.aborted) return;
      setError(err.message);
      setLoading(false);
    });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (!schoolId) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      academicRequest<AcademicYear[]>(`academic-years?schoolId=${schoolId}`, options),
      academicRequest<Grade[]>(`grade-levels?schoolId=${schoolId}`, options),
    ]).then(([availableYears, availableGrades]) => {
      setYears(availableYears);
      setGrades(availableGrades);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    });
    return () => controller.abort();
  }, [schoolId, retry]);

  useEffect(() => {
    if (!schoolId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ schoolId, page: String(page) });
    if (yearId) params.set('academicYearId', yearId);
    if (search) params.set('search', search);
    setLoading(true);
    academicRequest<ClassPage>(`classes?${params}`, { signal: controller.signal }).then(data => {
      setResult(data);
      setLoading(false);
    }).catch(err => {
      if (controller.signal.aborted) return;
      setError(err.message);
      setLoading(false);
    });
    return () => controller.abort();
  }, [schoolId, yearId, search, page, retry, reload]);

  function openForm(row: ClassRow | null) {
    setEditing(row);
    setSaveError('');
    setSaved('');
    setForm(row ? {
      code: row.code, name: row.name, academicYearId: row.academicYearId,
      gradeLevelId: row.gradeLevelId, capacity: row.capacity, revision: row.revision,
    } : { ...emptyForm, academicYearId: yearId || years.find(year => year.status === 'active')?.id || '' });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const path = editing ? `classes/${editing.id}` : 'classes';
      await academicRequest<ClassRow>(`${path}?schoolId=${schoolId}`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setForm(null);
      setAssignments(null);
      setRoster(null);
      setSaved(editing ? 'Đã cập nhật lớp.' : 'Đã tạo lớp.');
      setYearId(form.academicYearId);
      setSearchText('');
      setSearch('');
      setPage(1);
      setReload(value => value + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Không lưu được lớp.');
    } finally {
      setSaving(false);
    }
  }

  async function archive(row: ClassRow) {
    if (!window.confirm(`Lưu trữ lớp ${row.code}?`)) return;
    setSaving(true);
    setSaveError('');
    setSaved('');
    try {
      await academicRequest<ClassRow>(`classes/${row.id}/archive?schoolId=${schoolId}`, {
        method: 'POST', body: JSON.stringify({ revision: row.revision }),
      });
      setForm(null);
      setAssignments(null);
      setRoster(null);
      setSaved('Đã lưu trữ lớp.');
      setReload(value => value + 1);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-end gap-3">
      {schools.length > 0 && <label className="grid gap-1">Trường
        <select className={field} disabled={saving || schools.length === 1} value={schoolId} onChange={event => {
          setSchoolId(event.target.value);
          setLoading(false);
          setYearId(''); setPage(1); setYears([]); setGrades([]); setResult(null);
          setSearchText(''); setSearch('');
          setAssignments(null); setRoster(null); setForm(null); setSaved(''); setError(''); setSaveError('');
        }}>
          <option value="">Chọn trường</option>
          {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
        </select>
      </label>}
      {schoolId && <label className="grid gap-1">Năm học
        <select className={field} value={yearId} onChange={event => { setYearId(event.target.value); setPage(1); }}>
          <option value="">Tất cả năm học</option>
          {years.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select>
      </label>}
      {schoolId && <form className="flex items-end gap-2" onSubmit={event => {
        event.preventDefault();
        setSearch(searchText.trim());
        setPage(1);
      }}>
        <label className="grid gap-1">Tìm theo mã hoặc tên lớp
          <input className={field} maxLength={200} value={searchText} onChange={event => setSearchText(event.target.value)} />
        </label>
        <button className={field} type="submit">Tìm</button>
      </form>}
      {schoolId && <button className={button} disabled={!years.length || !grades.length || saving} onClick={() => openForm(null)}>Tạo lớp</button>}
    </div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
      {error} <button className="ml-2 font-semibold underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>
    </div>}
    {loading && <p role="status">Đang tải dữ liệu…</p>}
    {saved && <p role="status" className="text-emerald-800">{saved}</p>}
    {!loading && !error && schoolId && (!years.length || !grades.length) &&
      <p className="text-amber-800">Trường chưa có {(!years.length && !grades.length) ? 'năm học và khối' : !years.length ? 'năm học' : 'khối'}. Cần bổ sung danh mục trước khi tạo lớp.</p>}
    {form && <form onSubmit={save} className="space-y-3 rounded-xl bg-slate-50 p-4">
      <h2 className="font-semibold">{editing ? 'Sửa lớp' : 'Tạo lớp'}</h2>
      <fieldset disabled={saving} className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">Mã lớp<input className={field} required maxLength={50} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label>
        <label className="grid gap-1">Tên lớp<input className={field} required maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className="grid gap-1">Năm học<select className={field} required value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}>
          <option value="">Chọn năm học</option>
          {years.map(year => <option key={year.id} value={year.id}>{year.name}</option>)}
        </select></label>
        <label className="grid gap-1">Khối<select className={field} required value={form.gradeLevelId} onChange={e => setForm({ ...form, gradeLevelId: e.target.value })}>
          <option value="">Chọn khối</option>
          {grades.map(grade => <option key={grade.id} value={grade.id}>{grade.gradeNumber}</option>)}
        </select></label>
        <label className="grid gap-1">Sức chứa<input className={field} type="number" min={1} max={2147483647} value={form.capacity ?? ''} onChange={e => setForm({ ...form, capacity: e.target.value ? e.target.valueAsNumber : null })} /></label>
      </fieldset>
      {saveError && <p role="alert" className="text-red-800">{saveError}</p>}
      <button className={button} disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu lớp'}</button>
      <button className="ml-3 px-3 py-2" disabled={saving} type="button" onClick={() => setForm(null)}>Hủy</button>
    </form>}
    {schoolId && !loading && !error && result && (result.items.length === 0 ? <p>Chưa có lớp học.</p> :
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr>{['Mã lớp', 'Tên lớp', 'Năm học', 'Khối', 'Sức chứa', 'Trạng thái', 'Thao tác'].map(label =>
            <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead>
          <tbody>{result.items.map(row => <tr key={row.id} className="border-b border-slate-100">
            <th scope="row" className="p-3">{row.code}</th><td className="p-3">{row.name}</td>
            <td className="p-3">{row.academicYear}</td><td className="p-3">{row.gradeNumber}</td>
            <td className="p-3">{row.capacity ?? '—'}</td>
            <td className="p-3">{row.status === 'active' ? 'Đang hoạt động' : row.status === 'archived' ? 'Đã lưu trữ' : row.status}</td>
            <td className="space-x-3 p-3">
              <button className="underline" disabled={saving} onClick={() => { setAssignments(null); setRoster(row); }}>Ghi danh</button>
              {canAssign && <button className="underline" disabled={saving} onClick={() => { setRoster(null); setAssignments(row); }}>Phân công</button>}
              {row.status === 'active' && <>
                <button className="underline" disabled={saving} onClick={() => openForm(row)} aria-label={`Sửa lớp ${row.code}`}>Sửa</button>
                <button className="underline" disabled={saving} onClick={() => void archive(row)}>Lưu trữ</button>
              </>}
            </td>
          </tr>)}</tbody>
        </table>
        <div className="mt-4 flex items-center gap-4">
          <button className={field} disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button>
          <span>Trang {page} · {result.total} lớp</span>
          <button className={field} disabled={page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      </div>)}
    {saveError && !form && <p role="alert" className="text-red-800">{saveError}</p>}
    {assignments && <ClassAssignments key={`${schoolId}/${assignments.id}`} row={assignments} schoolId={schoolId} onClose={() => {
      setAssignments(null);
      setReload(value => value + 1);
    }} />}
    {roster && <ClassRoster key={`${schoolId}/${roster.id}`} row={roster} schoolId={schoolId} onClose={() => setRoster(null)} />}
  </section>;
}
