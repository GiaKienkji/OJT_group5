import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, School } from '../services/classApi';

type SubjectInput = { code: string; name: string; isActive: boolean; revision?: number };
type Subject = SubjectInput & { id: string };
type SubjectPage = { items: Subject[]; total: number; pageSize: number };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2';

export function SubjectsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [result, setResult] = useState<SubjectPage | null>(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [scopeRetry, setScopeRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editor, setEditor] = useState<(SubjectInput & { id?: string }) | null>(null);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError('');
    academicRequest<School[]>('subjects/context', { signal: abort.signal }).then(data => {
      setSchools(data);
      if (data.length === 1) setSchoolId(data[0].id);
    }).catch(err => {
      if (!abort.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, [scopeRetry]);

  useEffect(() => {
    if (!schoolId) return;
    const abort = new AbortController();
    const params = new URLSearchParams({ schoolId, page: String(page), search });
    if (status) params.set('isActive', status);
    setLoading(true);
    setError('');
    academicRequest<SubjectPage>(`subjects?${params}`, { signal: abort.signal }).then(setResult).catch(err => {
      if (!abort.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!abort.signal.aborted) setLoading(false);
    });
    return () => abort.abort();
  }, [schoolId, page, search, status, reload]);

  function open(subject?: Subject) {
    setSaveError('');
    setMessage('');
    setEditor(subject ?? { code: '', name: '', isActive: true });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const path = editor.id ? `subjects/${editor.id}` : 'subjects';
      await academicRequest<Subject>(`${path}?schoolId=${schoolId}`, {
        method: editor.id ? 'PUT' : 'POST', body: JSON.stringify(editor),
      });
      setEditor(null);
      setMessage(editor.id ? 'Đã cập nhật môn học.' : 'Đã tạo môn học.');
      setReload(value => value + 1);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="space-y-4 rounded-2xl bg-white p-5">
    <div className="flex flex-wrap items-end gap-3">
      {schools.length > 0 && <label className="grid gap-1">Trường
        <select className={field} value={schoolId} disabled={saving || schools.length === 1} onChange={event => {
          setSchoolId(event.target.value);
          setPage(1); setEditor(null); setResult(null); setMessage('');
        }}>
          <option value="">Chọn trường</option>
          {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
        </select>
      </label>}
      {schoolId && <>
        <form className="flex items-end gap-2" onSubmit={event => {
          event.preventDefault(); setPage(1); setSearch(query.trim());
        }}>
          <label className="grid gap-1">Tìm theo mã hoặc tên
            <input className={field} value={query} maxLength={200} onChange={event => setQuery(event.target.value)} />
          </label>
          <button className={field}>Tìm</button>
        </form>
        <label className="grid gap-1">Trạng thái
          <select className={field} value={status} onChange={event => { setPage(1); setStatus(event.target.value); }}>
            <option value="">Tất cả</option><option value="true">Đang hoạt động</option><option value="false">Ngừng hoạt động</option>
          </select>
        </label>
        <button className={field} disabled={saving} onClick={() => open()}>Thêm môn học</button>
      </>}
    </div>
    {loading && <p role="status">Đang tải môn học.</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => {
      if (schoolId) setReload(value => value + 1); else setScopeRetry(value => value + 1);
    }}>Thử lại</button></p>}
    {message && <p role="status">{message}</p>}
    {editor && <form className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={save}>
      <h2 className="font-semibold">{editor.id ? 'Sửa môn học' : 'Thêm môn học'}</h2>
      <fieldset className="flex flex-wrap items-end gap-3" disabled={saving}>
        <label className="grid gap-1">Mã môn<input className={field} required maxLength={50} value={editor.code}
          onChange={event => setEditor({ ...editor, code: event.target.value })} /></label>
        <label className="grid gap-1">Tên môn<input className={field} required maxLength={200} value={editor.name}
          onChange={event => setEditor({ ...editor, name: event.target.value })} /></label>
        <label className="flex items-center gap-2 pb-2"><input type="checkbox" checked={editor.isActive}
          onChange={event => setEditor({ ...editor, isActive: event.target.checked })} /> Đang hoạt động</label>
      </fieldset>
      {saveError && <p role="alert" className="text-red-800">{saveError}</p>}
      <button className={field} disabled={saving}>{saving ? 'Đang lưu' : 'Lưu môn học'}</button>
      <button type="button" className="ml-3 underline" disabled={saving} onClick={() => setEditor(null)}>Hủy</button>
    </form>}
    {schoolId && !loading && !error && result && (result.total === 0 ? <p>Không tìm thấy môn học.</p> : <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>{['Mã môn', 'Tên môn', 'Trạng thái', 'Thao tác'].map(label =>
            <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{result.items.map(subject => <tr key={subject.id} className="border-t">
            <th scope="row" className="p-2">{subject.code}</th><td className="p-2">{subject.name}</td>
            <td className="p-2">{subject.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</td>
            <td className="p-2"><button className="underline" disabled={saving} onClick={() => open(subject)}>Sửa</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button className={field} disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button>
        <span>Trang {page} · {result.total} môn học</span>
        <button className={field} disabled={page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Trang sau</button>
      </div>
    </>)}
  </section>;
}
