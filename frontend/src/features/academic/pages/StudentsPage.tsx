import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, School } from '../services/classApi';
import { StudentProfileLink } from './StudentProfileLink';

type StudentInput = {
  studentCode: string;
  fullName: string;
  dateOfBirth: string | null;
  admittedOn: string | null;
  revision?: number;
};
type Student = StudentInput & { id: string; status: string; userId: string | null };
type Page = { items: Student[]; total: number; pageSize: number };

const empty: StudentInput = { studentCode: '', fullName: '', dateOfBirth: null, admittedOn: null };
const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2';

export function StudentsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');

  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Student | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<{ id?: string; input: StudentInput } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    setLoadingSchools(true);
    setError('');
    academicRequest<School[]>('students/context', { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setSchools(data);
      setSchoolId(current => data.some(school => school.id === current) ? current : data.length === 1 ? data[0].id : '');
    }).catch(err => {
      if (!abort.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!abort.signal.aborted) setLoadingSchools(false);
    });
    return () => abort.abort();
  }, [refresh]);

  useEffect(() => {
    if (!schoolId || loadingSchools) return;
    const abort = new AbortController();
    setLoadingRows(true);
    const params = new URLSearchParams({ schoolId, search, page: String(page) });
    if (status) params.set('status', status);
    academicRequest<Page>(`students?${params}`, { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setResult(data);
    }).catch(err => {
      if (!abort.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!abort.signal.aborted) setLoadingRows(false);
    });
    return () => abort.abort();
  }, [schoolId, search, status, page, loadingSchools]);

  function open(student?: Student) {
    setSaved('');
    setSaveError('');
    setEditor(student ? { id: student.id, input: {
      studentCode: student.studentCode, fullName: student.fullName,
      dateOfBirth: student.dateOfBirth, admittedOn: student.admittedOn, revision: student.revision,
    } } : { input: empty });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const path = editor.id ? `students/${editor.id}` : 'students';
      await academicRequest<Student>(`${path}?schoolId=${schoolId}`, {
        method: editor.id ? 'PUT' : 'POST', body: JSON.stringify(editor.input),
      });
      setSaved(editor.id ? 'Đã cập nhật hồ sơ.' : 'Đã tạo hồ sơ.');
      setEditor(null);
      setPage(1);
      setQuery('');
      setSearch('');
      setRefresh(value => value + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Không lưu được hồ sơ.');
    } finally {
      setSaving(false);
    }
  }

  async function showDetail(id: string) {
    setSaving(true);
    setSaveError('');
    try {
      setDetail(await academicRequest<Student>(`students/${id}?schoolId=${schoolId}`));
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function archive(student: Student) {
    if (!window.confirm(`Đánh dấu thôi học cho ${student.fullName}?`)) return;
    setSaving(true);
    setSaveError('');
    setSaved('');
    try {
      await academicRequest<Student>(`students/${student.id}/archive?schoolId=${schoolId}`, {
        method: 'POST', body: JSON.stringify({ revision: student.revision }),
      });
      setDetail(null);
      setEditor(null);
      setSaved('Đã lưu trữ hồ sơ.');
      setRefresh(value => value + 1);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const loading = loadingSchools || loadingRows;
  return <section className="space-y-4 rounded-2xl bg-white p-5">
    {schools.length > 0 && <label className="grid max-w-sm gap-1">Trường
      <select className={inputClass} value={schoolId} disabled={saving || schools.length === 1} onChange={event => {
        setSchoolId(event.target.value); setPage(1); setResult(null); setLoadingRows(false);
        setEditor(null); setDetail(null); setError(''); setSaved(''); setSaveError(''); setQuery(''); setSearch(''); setStatus('');
      }}>
        <option value="">Chọn trường</option>
        {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
      </select>
    </label>}
    {schoolId && <div className="flex flex-wrap items-end gap-3">
      <form className="flex items-end gap-2" onSubmit={event => {
        event.preventDefault(); setError(''); setSearch(query.trim()); setPage(1);
      }}>
        <label className="grid gap-1">Tìm theo mã hoặc họ tên
          <input className={inputClass} value={query} maxLength={200} onChange={event => setQuery(event.target.value)} />
        </label>
        <button className={inputClass}>Tìm</button>
      </form>
      <label className="grid gap-1">Trạng thái
        <select className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); setError(''); }}>
          <option value="">Tất cả</option>
          <option value="enrolled">Đang học</option>
          <option value="transferred">Chuyển trường</option>
          <option value="graduated">Tốt nghiệp</option>
          <option value="withdrawn">Thôi học</option>
        </select>
      </label>
      <button className={inputClass} disabled={saving} onClick={() => open()}>Thêm học sinh</button>
    </div>}
    {loading && <p role="status">Đang tải dữ liệu.</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Thử lại</button></p>}
    {saved && <p role="status">{saved}</p>}
    {editor && <form className="space-y-3 rounded-xl bg-slate-50 p-4" onSubmit={save}>
      <h2 className="font-semibold">{editor.id ? 'Sửa hồ sơ' : 'Thêm học sinh'}</h2>
      <fieldset className="grid gap-3 md:grid-cols-2" disabled={saving}>
        <label className="grid gap-1">Mã học sinh<input className={inputClass} required maxLength={50} value={editor.input.studentCode}
          onChange={event => setEditor({ ...editor, input: { ...editor.input, studentCode: event.target.value } })} /></label>
        <label className="grid gap-1">Họ tên<input className={inputClass} required maxLength={200} value={editor.input.fullName}
          onChange={event => setEditor({ ...editor, input: { ...editor.input, fullName: event.target.value } })} /></label>
        <label className="grid gap-1">Ngày sinh<input className={inputClass} type="date" value={editor.input.dateOfBirth ?? ''}
          onChange={event => setEditor({ ...editor, input: { ...editor.input, dateOfBirth: event.target.value || null } })} /></label>
        <label className="grid gap-1">Ngày nhập học<input className={inputClass} type="date" value={editor.input.admittedOn ?? ''}
          onChange={event => setEditor({ ...editor, input: { ...editor.input, admittedOn: event.target.value || null } })} /></label>
      </fieldset>
      {saveError && <p role="alert" className="text-red-800">{saveError}</p>}
      <button className={inputClass} disabled={saving}>{saving ? 'Đang lưu' : 'Lưu hồ sơ'}</button>
      <button className="ml-3 underline" type="button" disabled={saving} onClick={() => setEditor(null)}>Hủy</button>
    </form>}
    {schoolId && !loading && !error && result && <>
      {result.items.length === 0 ? <p>Không tìm thấy học sinh.</p> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>{['Mã học sinh', 'Họ tên', 'Ngày sinh', 'Ngày nhập học', 'Trạng thái', 'Thao tác'].map(label =>
            <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{result.items.map(student => <tr key={student.id} className="border-t">
            <th scope="row" className="p-2">{student.studentCode}</th><td className="p-2">{student.fullName}</td>
            <td className="p-2">{student.dateOfBirth ?? '—'}</td><td className="p-2">{student.admittedOn ?? '—'}</td>
            <td className="p-2">{{ enrolled: 'Đang học', transferred: 'Chuyển trường', graduated: 'Tốt nghiệp', withdrawn: 'Thôi học' }[student.status] ?? student.status}</td>
            <td className="space-x-3 p-2">
              <button className="underline" disabled={saving} onClick={() => void showDetail(student.id)}>Chi tiết</button>
              <button className="underline" disabled={saving} onClick={() => open(student)}>Sửa</button>
              {student.status === 'enrolled' && <button className="underline" disabled={saving} onClick={() => void archive(student)}>Lưu trữ</button>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="flex items-center gap-3">
        <button className={inputClass} disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button>
        <span>Trang {page} · {result.total} học sinh</span>
        <button className={inputClass} disabled={page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Trang sau</button>
      </div>
    </>}
    {saveError && !editor && <p role="alert" className="text-red-800">{saveError}</p>}
    {detail && <section className="space-y-2 rounded-xl border p-4" aria-label="Chi tiết hồ sơ">
      <h2 className="font-semibold">{detail.fullName} · {detail.studentCode}</h2>
      <p>Ngày sinh {detail.dateOfBirth ?? 'chưa cập nhật'}</p>
      <p>Ngày nhập học {detail.admittedOn ?? 'chưa cập nhật'}</p>
      <StudentProfileLink key={detail.id} student={detail} schoolId={schoolId} onSaved={student => {
        setDetail(current => current?.id === student.id ? student : current);
        setRefresh(value => value + 1);
      }} />
      <button className="underline" onClick={() => setDetail(null)}>Đóng chi tiết</button>
    </section>}
  </section>;
}
