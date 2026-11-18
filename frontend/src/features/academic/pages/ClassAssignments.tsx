import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, ClassRow } from '../services/classApi';
import { useAuth } from '../../../context/AuthContext';

type Semester = { id: string; name: string };
type Teacher = { id: string; code: string; fullName: string };
type Subject = { id: string; code: string; name: string };
type Curriculum = { subjectId: string; code: string; name: string; weeklyPeriods: number };
type TeachingInput = { subjectId: string; staffId: string; weeklyPeriods: number; status: string; revision?: number };
type TeachingRow = TeachingInput & { id: string; subjectName: string; teacherName: string };
type HomeroomHistory = { classRevision: number; items: { id: string; fullName: string; startsOn: string; endsBefore: string | null }[] };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50';
const emptyTeaching: TeachingInput = { subjectId: '', staffId: '', weeklyPeriods: 1, status: 'draft' };
const statusLabels: Record<string, string> = { draft: 'Nháp', active: 'Hoạt động', inactive: 'Đã lưu trữ' };

export function ClassAssignments({ row, schoolId, onClose }: { row: ClassRow; schoolId: string; onClose: () => void }) {
  const { hasPermission } = useAuth();
  const canCurriculum = hasPermission('subjects.manage');
  const canTeach = hasPermission('teaching_assignments.manage');
  const canHomeroom = hasPermission('homeroom.assign');
  const active = row.status === 'active';
  const scope = `schoolId=${schoolId}`;
  const classPath = `classes/${row.id}`;
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [homeroomTeachers, setHomeroomTeachers] = useState<Teacher[]>([]);
  const [homeroom, setHomeroom] = useState<HomeroomHistory | null>(null);
  const [homeroomId, setHomeroomId] = useState('');
  const [assignments, setAssignments] = useState<TeachingRow[]>([]);
  const [edit, setEdit] = useState<(TeachingInput & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const abort = new AbortController();
    const options = { signal: abort.signal };
    const schoolQuery = `schoolId=${schoolId}`;
    if (canCurriculum || canTeach) {
      academicRequest<Semester[]>(`semesters?${schoolQuery}&academicYearId=${row.academicYearId}`, options)
        .then(data => {
          if (abort.signal.aborted) return;
          setSemesters(data);
          setSemesterId(current => data.some(item => item.id === current) ? current : data[0]?.id ?? '');
        }).catch(err => { if (!abort.signal.aborted) setError(err.message); });
    }
    if (canHomeroom) {
      Promise.all([
        academicRequest<HomeroomHistory>(`classes/${row.id}/homeroom-assignments?${schoolQuery}`, options),
        academicRequest<Teacher[]>(`teachers?${schoolQuery}&homeroom=true`, options),
      ]).then(([history, eligible]) => {
        if (abort.signal.aborted) return;
        setHomeroom(history);
        setHomeroomTeachers(eligible);
        setHomeroomId('');
      }).catch(err => { if (!abort.signal.aborted) setError(err.message); });
    }
    return () => abort.abort();
  }, [schoolId, row.id, row.academicYearId, canCurriculum, canTeach, canHomeroom, refresh]);

  useEffect(() => {
    if (!semesterId) return;
    const abort = new AbortController();
    const options = { signal: abort.signal };
    const query = `schoolId=${schoolId}&semesterId=${semesterId}`;
    setLoading(true);
    setEdit(null);
    setCurriculum([]);
    setAssignments([]);
    setTeachers([]);
    const tasks: Promise<unknown>[] = [];
    if (canCurriculum || canTeach) {
      tasks.push(academicRequest<Curriculum[]>(`classes/${row.id}/subjects?${query}`, options)
        .then(data => { if (!abort.signal.aborted) setCurriculum(data); }));
    }
    if (canTeach) {
      tasks.push(academicRequest<TeachingRow[]>(`teaching-assignments?${query}&classId=${row.id}`, options)
        .then(data => { if (!abort.signal.aborted) setAssignments(data); }));
      tasks.push(academicRequest<Teacher[]>(`teachers?${query}`, options)
        .then(data => { if (!abort.signal.aborted) setTeachers(data); }));
    }
    Promise.all(tasks).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [schoolId, row.id, semesterId, canCurriculum, canTeach, refresh]);

  async function searchSubjects(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjectId('');
    setError('');
    setBusy(true);
    try {
      const params = new URLSearchParams({ schoolId, search: subjectSearch.trim(), isActive: 'true', pageSize: '100' });
      setSubjectOptions((await academicRequest<{ items: Subject[] }>(`subjects?${params}`)).items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function write(path: string, method: 'POST' | 'PUT', input: object, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await academicRequest<unknown>(`${path}?${scope}`, { method, body: JSON.stringify(input) });
      setMessage(success);
      setRefresh(value => value + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function addSubject() {
    const subject = subjectOptions.find(item => item.id === subjectId);
    if (subject && !curriculum.some(item => item.subjectId === subject.id)) {
      setCurriculum([...curriculum, { subjectId: subject.id, name: subject.name, code: subject.code, weeklyPeriods: 1 }]);
      setSubjectId('');
    }
  }

  function saveAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit || busy) return;
    const { id, ...input } = edit;
    void write(id ? `teaching-assignments/${id}` : 'teaching-assignments', id ? 'PUT' : 'POST',
      { ...input, classId: row.id, semesterId }, 'Đã lưu phân công.');
  }

  return <section aria-label={`Phân công lớp ${row.code}`} className="space-y-5 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Phân công lớp {row.code}</h2>
      <button className="underline" disabled={busy} onClick={onClose}>Đóng phân công</button>
    </div>
    {error && <p role="alert" className="text-red-800">{error}{' '}
      <button className="underline" onClick={() => { setError(''); setRefresh(value => value + 1); }}>Tải lại</button></p>}
    {message && <p role="status">{message}</p>}
    {(canCurriculum || canTeach) && <label className="grid max-w-sm gap-1">Học kỳ
      <select className={field} value={semesterId} disabled={busy} onChange={event => {
        setSemesterId(event.target.value); setMessage(''); setError('');
      }}>
        <option value="">{semesters.length ? 'Chọn học kỳ' : 'Chưa có học kỳ'}</option>
        {semesters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>}
    {loading && <p role="status">Đang tải dữ liệu phân công.</p>}
    {semesterId && !loading && (canCurriculum || canTeach) && <>
      <section className="space-y-2">
        <h3 className="font-semibold">Chương trình lớp</h3>
        {canCurriculum && active && <form className="flex flex-wrap items-end gap-2" onSubmit={searchSubjects}>
          <label className="grid gap-1">Tìm môn đang hoạt động<input className={field} value={subjectSearch} maxLength={200}
            disabled={busy} onChange={event => setSubjectSearch(event.target.value)} /></label>
          <button className={field} disabled={busy}>Tìm môn</button>
          {subjectOptions.length > 0 && <>
            <label className="grid gap-1">Môn để thêm<select className={field} value={subjectId} disabled={busy}
              onChange={event => setSubjectId(event.target.value)}>
              <option value="">Chọn môn</option>
              {subjectOptions.filter(item => !curriculum.some(old => old.subjectId === item.id))
                .map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
            </select></label>
            <button type="button" className={field} disabled={busy || !subjectId} onClick={addSubject}>Thêm vào chương trình</button>
          </>}
        </form>}
        {curriculum.length === 0 && <p>Chưa cấu hình môn cho học kỳ này.</p>}
        <form className="space-y-2" onSubmit={event => {
          event.preventDefault();
          void write(`${classPath}/subjects`, 'PUT', { semesterId, subjects: curriculum }, 'Đã lưu chương trình.');
        }}>
          {curriculum.map(item => <div className="flex flex-wrap items-end gap-2" key={item.subjectId}>
            <label className="grid gap-1">{item.code} · {item.name} (tiết/tuần)
              <input type="number" className={field} min={1} max={32767} required value={item.weeklyPeriods || ''}
                disabled={!canCurriculum || !active || busy} onChange={event => {
                  const weeklyPeriods = event.target.valueAsNumber;
                  setCurriculum(curriculum.map(old => old.subjectId === item.subjectId ? { ...old, weeklyPeriods } : old));
                }} />
            </label>
            {canCurriculum && active && <button type="button" className="underline" disabled={busy}
              onClick={() => setCurriculum(curriculum.filter(old => old.subjectId !== item.subjectId))}>Bỏ môn</button>}
          </div>)}
          {canCurriculum && active && <button className={field} disabled={busy}>Lưu chương trình</button>}
        </form>
      </section>
      {canTeach && <section className="space-y-2">
        <h3 className="font-semibold">Phân công giảng dạy</h3>
        {assignments.length === 0 && <p>Chưa có phân công.</p>}
        <ul className="space-y-2">
          {assignments.map(item => <li key={item.id} className="flex flex-wrap gap-3">
            <span>{item.subjectName} · {item.teacherName} · {item.weeklyPeriods} tiết/tuần · {statusLabels[item.status]}</span>
            {active && <>
              <button type="button" className="underline" disabled={busy} onClick={() => setEdit({
                id: item.id, staffId: item.staffId, subjectId: item.subjectId, weeklyPeriods: item.weeklyPeriods,
                status: item.status === 'inactive' ? 'draft' : item.status, revision: item.revision,
              })}>Sửa</button>
              {item.status !== 'inactive' && <button type="button" className="underline" disabled={busy}
                onClick={() => void write(`teaching-assignments/${item.id}/archive`, 'POST', { revision: item.revision }, 'Đã lưu trữ phân công.')}>Lưu trữ</button>}
            </>}
          </li>)}
        </ul>
        {active && <button type="button" className={field} disabled={busy || !curriculum.length || !teachers.length}
          onClick={() => setEdit(emptyTeaching)}>Thêm phân công</button>}
        {edit && <form className="space-y-3 rounded-lg bg-slate-50 p-3" onSubmit={saveAssignment}>
          <fieldset className="flex flex-wrap items-end gap-2" disabled={busy}>
            <label className="grid gap-1">Môn học<select className={field} required value={edit.subjectId}
              onChange={event => setEdit({ ...edit, subjectId: event.target.value })}>
              <option value="">Chọn môn</option>
              {curriculum.map(item => <option key={item.subjectId} value={item.subjectId}>{item.name}</option>)}
            </select></label>
            <label className="grid gap-1">Giáo viên<select className={field} required value={edit.staffId}
              onChange={event => setEdit({ ...edit, staffId: event.target.value })}>
              <option value="">Chọn giáo viên</option>
              {teachers.map(item => <option key={item.id} value={item.id}>{item.code} · {item.fullName}</option>)}
            </select></label>
            <label className="grid gap-1">Số tiết mỗi tuần<input type="number" className={field} min={1} max={32767} required
              value={edit.weeklyPeriods || ''} onChange={event => setEdit({ ...edit, weeklyPeriods: event.target.valueAsNumber })} /></label>
            <label className="grid gap-1">Trạng thái<select className={field} value={edit.status}
              onChange={event => setEdit({ ...edit, status: event.target.value })}>
              <option value="draft">Nháp</option><option value="active">Hoạt động</option>
            </select></label>
          </fieldset>
          <button className={field} disabled={busy}>Lưu phân công</button>
          <button type="button" disabled={busy} className="ml-3 underline" onClick={() => setEdit(null)}>Hủy</button>
        </form>}
      </section>}
    </>}
    {canHomeroom && homeroom && <section className="space-y-2">
      <h3 className="font-semibold">Giáo viên chủ nhiệm</h3>
      {homeroom.items.length === 0 && <p>Chưa có lịch sử chủ nhiệm.</p>}
      <ul className="space-y-1">
        {homeroom.items.map(item => <li key={item.id}>{item.fullName} · {item.startsOn} → {item.endsBefore ?? 'Hiện tại'}</li>)}
      </ul>
      {active && <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
        event.preventDefault();
        void write(`${classPath}/homeroom-assignments`, 'POST', { staffId: homeroomId || null, revision: homeroom.classRevision }, 'Đã cập nhật chủ nhiệm.');
      }}>
        <label className="grid gap-1">Chủ nhiệm mới
          <select className={field} value={homeroomId} disabled={busy} required onChange={event => setHomeroomId(event.target.value)}>
            <option value="">Chọn giáo viên</option>
            {homeroomTeachers.map(item => <option key={item.id} value={item.id}>{item.code} · {item.fullName}</option>)}
          </select>
        </label>
        <button className={field} disabled={busy || !homeroomId}>Phân công chủ nhiệm</button>
        {homeroom.items.some(item => !item.endsBefore) && <button type="button" className="underline" disabled={busy}
          onClick={() => void write(`${classPath}/homeroom-assignments`, 'POST', {
            staffId: null, revision: homeroom.classRevision,
          }, 'Đã kết thúc phân công chủ nhiệm.')}>Kết thúc chủ nhiệm</button>}
      </form>}
    </section>}
  </section>;
}
