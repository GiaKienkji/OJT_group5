import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { academicRequest, School } from '../services/classApi';
import { CalendarRow, schoolTime } from './PublishedSchedulePage';

type SchoolDay = School & { today: string };
type Teacher = { id: string; code: string; fullName: string };
type Substitute = { id: string; slotId: string; teacherName: string; classCode: string; subjectName: string; status: string };
type Option = { id: string; code: string; name: string };
type Semester = { id: string; name: string; startDate: string };
type Resources = { classes: Option[]; subjects: Option[]; rooms: Option[]; timezone: string };
type Exam = { id: string; classId: string; classCode: string; subjectId: string; subjectName: string; startsAt: string;
  endsAt: string; roomId: string | null; roomCode: string | null; status: string; revision: number };
type ExamEdit = { id?: string; classId: string; subjectId: string; roomId: string; startsAt: string; endsAt: string; revision?: number };
const emptyExam: ExamEdit = { classId: '', subjectId: '', roomId: '', startsAt: '', endsAt: '' };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50';
const labels: Record<string, string> = {
  accepted: 'Đã xác nhận', confirmed: 'Đã xác nhận', completed: 'Đã hoàn tất', proposed: 'Đề xuất',
  draft: 'Nháp', published: 'Đã công bố', cancelled: 'Đã hủy',
};

function deviceTime(value: string) {
  const instant = new Date(value);
  return new Date(instant.getTime() - instant.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Substitutions({ school }: { school: SchoolDay }) {
  const [date, setDate] = useState(school.today);
  const [slots, setSlots] = useState<CalendarRow[]>([]);
  const [rows, setRows] = useState<Substitute[]>([]);
  const [slotId, setSlotId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const scope = `schoolId=${school.id}`;
  const query = `${scope}&onDate=${date}`;

  useEffect(() => {
    if (!date) return;
    const abort = new AbortController();
    const params = `schoolId=${school.id}&onDate=${date}`;
    setLoading(true);
    setError('');
    Promise.all([
      academicRequest<CalendarRow[]>(`substitutions/sessions?${params}`, { signal: abort.signal }),
      academicRequest<Substitute[]>(`substitutions?${params}`, { signal: abort.signal }),
    ]).then(([lessons, list]) => {
      if (!abort.signal.aborted) { setSlots(lessons); setRows(list); }
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [school.id, date, refresh]);

  async function findTeachers() {
    setBusy(true); setError(''); setStaffId(''); setTeachers(null);
    try { setTeachers(await academicRequest<Teacher[]>(`sessions/${slotId}/substitute-candidates?${query}`)); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function write(id?: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      await academicRequest<Substitute>(`${id ? `substitutions/${id}/cancel` : 'substitutions'}?${scope}`, {
        method: 'POST', body: id ? undefined : JSON.stringify({ slotId, staffId, onDate: date }),
      });
      setTeachers(null); setStaffId(''); setSlotId('');
      setNotice(id ? 'Đã hủy ca dạy thay.' : 'Đã bố trí ca dạy thay.');
      setRefresh(value => value + 1);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="space-y-3 rounded-xl border p-4" aria-label="Dạy thay">
    <h2 className="text-lg font-semibold">Dạy thay</h2>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Ngày dạy thay<input type="date" className={field} value={date} disabled={busy}
        onChange={event => { setDate(event.target.value); setSlots([]); setRows([]); setSlotId(''); setTeachers(null); setNotice(''); }} /></label>
      <label className="grid gap-1">Ca học<select className={field} value={slotId} disabled={busy || loading}
        onChange={event => { setSlotId(event.target.value); setTeachers(null); }}>
        <option value="">{slots.length ? 'Chọn ca học' : 'Chưa có ca công bố'}</option>
        {slots.map(slot => <option key={slot.id} value={slot.id}>{schoolTime(slot.startsAt, slot.timezone)} · {slot.classCode} · {slot.subjectName} · {slot.teacherName}</option>)}
      </select></label>
      <button className={field} disabled={busy || loading || !slotId} onClick={() => void findTeachers()}>Tìm giáo viên rảnh</button>
    </div>
    {teachers && (teachers.length ? <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Giáo viên dạy thay<select className={field} value={staffId} disabled={busy}
        onChange={event => setStaffId(event.target.value)}>
        <option value="">Chọn giáo viên</option>
        {teachers.map(item => <option key={item.id} value={item.id}>{item.code} · {item.fullName}</option>)}
      </select></label>
      <button className={field} disabled={busy || !staffId} onClick={() => void write()}>Xác nhận dạy thay</button>
    </div> : <p>Không tìm thấy giáo viên rảnh.</p>)}
    {loading && <p role="status">Đang tải ca theo ngày.</p>}
    {error && <p role="alert" className="text-red-800">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Tải lại</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!loading && date && rows.length === 0 && <p>Chưa bố trí dạy thay ngày này.</p>}
    <ul className="space-y-2">
      {rows.map(item => <li key={item.id} className="flex flex-wrap gap-3">
        <span>{item.classCode} · {item.subjectName} · {item.teacherName} · {labels[item.status]}</span>
        {item.status === 'confirmed' && <button className="underline" disabled={busy} onClick={() => {
          if (window.confirm('Hủy ca dạy thay và trả lại cho giáo viên gốc?')) void write(item.id);
        }}>Hủy dạy thay</button>}
      </li>)}
    </ul>
  </section>;
}

function Exams({ school }: { school: SchoolDay }) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [resources, setResources] = useState<Resources | null>(null);
  const [items, setItems] = useState<Exam[]>([]);
  const [edit, setEdit] = useState<ExamEdit | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const scope = `schoolId=${school.id}`;

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    academicRequest<Semester[]>(`exams/semesters?schoolId=${school.id}`, { signal: abort.signal })
      .then(data => {
        if (abort.signal.aborted) return;
        setSemesters(data);
        if (data.length === 1) setSemesterId(data[0].id);
      }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [school.id]);

  useEffect(() => {
    if (!semesterId) return;
    const abort = new AbortController();
    const query = `schoolId=${school.id}&semesterId=${semesterId}`;
    setLoading(true); setError('');
    Promise.all([
      academicRequest<Resources>(`exams/options?${query}`, { signal: abort.signal }),
      academicRequest<Exam[]>(`exams?${query}`, { signal: abort.signal }),
    ]).then(([options, exams]) => {
      if (!abort.signal.aborted) { setResources(options); setItems(exams); }
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [school.id, semesterId, refresh]);

  async function write(path: string, method: 'POST' | 'PUT', body: object, message: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      await academicRequest<Exam>(`${path}?${scope}`, { method, body: JSON.stringify(body) });
      setNotice(message); setEdit(null); setRefresh(value => value + 1);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    const { id, ...input } = edit;
    void write(id ? `exams/${id}` : 'exams', id ? 'PUT' : 'POST', {
      ...input, semesterId, roomId: input.roomId || null,
      startsAt: new Date(input.startsAt).toISOString(), endsAt: new Date(input.endsAt).toISOString(),
    }, 'Đã lưu lịch kiểm tra.');
  }

  return <section className="space-y-3 rounded-xl border p-4" aria-label="Lịch kiểm tra">
    <h2 className="text-lg font-semibold">Lịch kiểm tra</h2>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Học kỳ kiểm tra<select className={field} value={semesterId} disabled={busy} onChange={event => {
        setSemesterId(event.target.value); setResources(null); setItems([]); setEdit(null); setNotice('');
      }}><option value="">{semesters.length ? 'Chọn học kỳ' : 'Chưa có học kỳ'}</option>
        {semesters.map(item => <option key={item.id} value={item.id}>{item.name} · {item.startDate}</option>)}
      </select></label>
      {resources && <button className={field} disabled={busy || !resources.classes.length || !resources.subjects.length}
        onClick={() => setEdit(emptyExam)}>Thêm ca kiểm tra</button>}
    </div>
    {loading && <p role="status">Đang tải lịch kiểm tra.</p>}
    {error && <p role="alert" className="text-red-800">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Tải lại</button></p>}
    {notice && <p role="status">{notice}</p>}
    {edit && resources && <form className="space-y-3 rounded-lg bg-slate-50 p-3" onSubmit={save}>
      <fieldset className="flex flex-wrap items-end gap-2" disabled={busy}>
        <label className="grid gap-1">Lớp kiểm tra<select className={field} required value={edit.classId}
          onChange={event => setEdit({ ...edit, classId: event.target.value })}>
          <option value="">Chọn lớp</option>
          {resources.classes.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select></label>
        <label className="grid gap-1">Môn kiểm tra<select className={field} required value={edit.subjectId}
          onChange={event => setEdit({ ...edit, subjectId: event.target.value })}>
          <option value="">Chọn môn</option>
          {resources.subjects.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select></label>
        <label className="grid gap-1">Phòng kiểm tra<select className={field} value={edit.roomId}
          onChange={event => setEdit({ ...edit, roomId: event.target.value })}>
          <option value="">Chưa chọn phòng</option>
          {resources.rooms.map(item => <option key={item.id} value={item.id}>{item.code}</option>)}
        </select></label>
        <label className="grid gap-1">Bắt đầu theo giờ thiết bị<input type="datetime-local" required className={field}
          value={edit.startsAt} onChange={event => setEdit({ ...edit, startsAt: event.target.value })} /></label>
        <label className="grid gap-1">Kết thúc theo giờ thiết bị<input type="datetime-local" required className={field}
          value={edit.endsAt} onChange={event => setEdit({ ...edit, endsAt: event.target.value })} /></label>
      </fieldset>
      {edit.startsAt && edit.endsAt && <p>Giờ trường ({resources.timezone}){' '}
        {schoolTime(edit.startsAt, resources.timezone)}–{schoolTime(edit.endsAt, resources.timezone)}</p>}
      <button className={field} disabled={busy}>Lưu lịch kiểm tra</button>
      <button type="button" className="ml-3 underline" disabled={busy} onClick={() => setEdit(null)}>Hủy</button>
    </form>}
    {!loading && semesterId && items.length === 0 && <p>Chưa có lịch kiểm tra trong học kỳ này.</p>}
    {resources && <ul className="space-y-2">
      {items.map(item => <li key={item.id} className="flex flex-wrap gap-3">
        <span>{item.classCode} · {item.subjectName} · {new Date(item.startsAt).toLocaleDateString('vi-VN', { timeZone: resources.timezone })}{' '}
          {schoolTime(item.startsAt, resources.timezone)}–{schoolTime(item.endsAt, resources.timezone)} · {item.roomCode ?? 'Chưa chọn phòng'} · {labels[item.status]}</span>
        {item.status === 'draft' && <>
          <button className="underline" disabled={busy} onClick={() => setEdit({ ...item, roomId: item.roomId ?? '',
            startsAt: deviceTime(item.startsAt), endsAt: deviceTime(item.endsAt) })}>Sửa</button>
          <button className="underline" disabled={busy} onClick={() => void write(`exams/${item.id}/publish`, 'POST',
            { revision: item.revision }, 'Đã công bố ca kiểm tra.')}>Công bố</button>
        </>}
        {item.status !== 'cancelled' && <button className="underline" disabled={busy} onClick={() => {
          if (window.confirm('Hủy ca kiểm tra?')) void write(`exams/${item.id}/cancel`, 'POST',
            { revision: item.revision }, 'Đã hủy ca kiểm tra.');
        }}>Hủy ca</button>}
      </li>)}
    </ul>}
  </section>;
}

export function AcademicEventsPage() {
  const { hasPermission } = useAuth();
  const [schools, setSchools] = useState<SchoolDay[]>([]);
  const [school, setSchool] = useState<SchoolDay | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError('');
    academicRequest<SchoolDay[]>('events/context', { signal: abort.signal }).then(items => {
      if (abort.signal.aborted) return;
      setSchools(items);
      setSchool(current => items.find(item => item.id === current?.id) ?? (items.length === 1 ? items[0] : null));
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [refresh]);

  return <section className="space-y-5 rounded-xl bg-white p-5">
    {loading && <p role="status">Đang tải trường.</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Thử lại</button></p>}
    {schools.length > 0 && <label className="grid max-w-sm gap-1">Trường
      <select className={field} value={school?.id ?? ''} disabled={schools.length === 1}
        onChange={event => setSchool(schools.find(item => item.id === event.target.value) ?? null)}>
        <option value="">Chọn trường</option>
        {schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>}
    {school && hasPermission('scheduling.manage') && <Substitutions key={school.id} school={school} />}
    {school && hasPermission('exams.manage') && <Exams key={school.id} school={school} />}
  </section>;
}
