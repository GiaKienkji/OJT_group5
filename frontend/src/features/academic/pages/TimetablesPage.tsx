import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { academicRequest, School } from '../services/classApi';

type Semester = { id: string; name: string; startDate: string; endDate: string };
type Version = {
  id: string; versionNo: number; status: string; revision: number; contentRevision: number;
  approvedRevision: number | null; createdBy: string | null; submittedBy: string | null;
  effectiveFrom: string | null; effectiveUntil: string | null;
};
type EntryInput = { teachingAssignmentId: string; roomId: string; periodId: string; weekday: number };
type Slot = EntryInput & {
  id: string; classId: string; classCode: string; staffId: string; teacherName: string;
  subjectName: string; roomCode: string; startsAt: string; endsAt: string;
};
type Detail = { version: Version; items: Slot[] };
type Options = {
  assignments: { id: string; classCode: string; subjectName: string; teacherName: string }[];
  rooms: { id: string; code: string }[];
  periods: { id: string; number: number; startsAt: string; endsAt: string }[];
};
type Conflict = { resource: string; label: string; weekday: number; startsAt: string; endsAt: string; slotId: string };
type Check = { valid: boolean; conflicts: Conflict[]; errors?: string[] };
type Suggestion = Pick<Slot, 'teachingAssignmentId' | 'teacherName' | 'roomId' | 'roomCode' | 'periodId' | 'startsAt' | 'endsAt'>;

const emptySlot: EntryInput = { teachingAssignmentId: '', roomId: '', periodId: '', weekday: 1 };
const emptyOptions: Options = { assignments: [], rooms: [], periods: [] };
const statuses: Record<string, string> = { draft: 'Nháp', pending_approval: 'Chờ duyệt', published: 'Đã công bố', archived: 'Lưu trữ' };
const kinds: Record<string, string> = { class: 'Lớp', teacher: 'Giáo viên', room: 'Phòng' };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50';
const time = (value: string) => value.slice(0, 5);
const day = (weekday: number) => weekday === 7 ? 'Chủ nhật' : `Thứ ${weekday + 1}`;

export function TimetablesPage() {
  const { user, hasPermission } = useAuth();
  const canDraft = hasPermission('timetables.draft');
  const canApprove = hasPermission('timetables.approve');
  const canPublish = hasPermission('timetables.publish');
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionId, setVersionId] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [entry, setEntry] = useState<(EntryInput & { id?: string }) | null>(null);
  const [checked, setChecked] = useState<Check | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [filter, setFilter] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const scope = `schoolId=${schoolId}`;

  useEffect(() => {
    const abort = new AbortController();
    setPending(value => value + 1);
    academicRequest<School[]>('timetables/context', { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setSchools(data);
      setSchoolId(current => data.some(item => item.id === current) ? current : data.length === 1 ? data[0].id : '');
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => setPending(value => value - 1));
    return () => abort.abort();
  }, [refresh]);

  useEffect(() => {
    if (!schoolId) return;
    const abort = new AbortController();
    setPending(value => value + 1);
    academicRequest<Semester[]>(`timetables/semesters?schoolId=${schoolId}`, { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setSemesters(data);
      setSemesterId(current => data.some(item => item.id === current) ? current : '');
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => setPending(value => value - 1));
    return () => abort.abort();
  }, [schoolId, refresh]);

  useEffect(() => {
    if (!semesterId || !schoolId) return;
    const abort = new AbortController();
    const query = `schoolId=${schoolId}&semesterId=${semesterId}`;
    setPending(value => value + 1);
    const tasks: Promise<unknown>[] = [
      academicRequest<Version[]>(`timetables?${query}`, { signal: abort.signal }).then(data => {
        if (abort.signal.aborted) return;
        setVersions(data);
        setVersionId(current => data.some(item => item.id === current) ? current : '');
      }),
    ];
    if (canDraft) tasks.push(academicRequest<Options>(`timetables/options?${query}`, { signal: abort.signal })
      .then(data => { if (!abort.signal.aborted) setOptions(data); }));
    Promise.allSettled(tasks).then(results => {
      if (!abort.signal.aborted) {
        const failed = results.find(result => result.status === 'rejected');
        if (failed?.status === 'rejected') setError(failed.reason.message);
      }
    }).finally(() => setPending(value => value - 1));
    return () => abort.abort();
  }, [semesterId, schoolId, canDraft, refresh]);

  useEffect(() => {
    if (!versionId || !schoolId) return;
    const abort = new AbortController();
    setPending(value => value + 1);
    academicRequest<Detail>(`timetables/${versionId}?schoolId=${schoolId}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setDetail(data);
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => setPending(value => value - 1));
    return () => abort.abort();
  }, [versionId, schoolId, refresh]);

  function clearVersion(id: string) {
    setVersionId(id); setDetail(null); setEntry(null); setChecked(null); setSuggestions(null); setFilter('');
    setNotice(''); setError(''); setEffectiveFrom('');
  }

  async function action<T>(run: () => Promise<T>, apply: (data: T) => void) {
    setBusy(true);
    setError('');
    try { apply(await run()); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  function requestDetail(path: string, method: 'POST' | 'PUT' | 'DELETE', input?: object) {
    return academicRequest<Detail>(path, { method, body: input == null ? undefined : JSON.stringify(input) });
  }

  function newVersion(cloneId?: string) {
    const path = cloneId ? `timetables/${cloneId}/clone` : 'timetables';
    void action(() => requestDetail(`${path}?${scope}`, 'POST', cloneId ? undefined : { semesterId }), data => {
      setVersions(current => [data.version, ...current]);
      clearVersion(data.version.id);
      setDetail(data);
      setNotice(cloneId ? 'Đã nhân bản lịch.' : 'Đã tạo bản nháp.');
    });
  }

  function replaceDetail(data: Detail) {
    setDetail(data); setEntry(null); setChecked(null); setSuggestions(null);
    setVersions(current => current.map(item => item.id === data.version.id ? data.version : item));
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entry || !detail) return;
    const path = `timetables/${versionId}/entries${entry.id ? '/' + entry.id : ''}?${scope}`;
    const { id, ...input } = entry;
    void action(() => requestDetail(path, id ? 'PUT' : 'POST', { ...input, revision: detail.version.revision }), data => {
      replaceDetail(data);
      setNotice('Đã lưu ô lịch.');
    });
  }

  function removeEntry(slot: Slot) {
    if (!detail || !window.confirm('Xóa ô lịch đã chọn?')) return;
    void action(() => requestDetail(`timetables/${versionId}/entries/${slot.id}?${scope}&revision=${detail.version.revision}`, 'DELETE'), data => {
      replaceDetail(data);
      setNotice('Đã xóa ô lịch.');
    });
  }

  function checkEntry() {
    if (!detail || !entry) return;
    const path = `timetables/${versionId}/check-conflicts?${scope}${entry.id ? '&entryId=' + entry.id : ''}`;
    void action(() => academicRequest<Check>(path, { method: 'POST', body: JSON.stringify({ ...entry, revision: detail.version.revision }) }), setChecked);
  }

  function findSuggestions() {
    if (!entry) return;
    const path = `timetables/${versionId}/suggestions?${scope}&assignmentId=${entry.teachingAssignmentId}&weekday=${entry.weekday}${entry.id ? '&entryId=' + entry.id : ''}`;
    void action(() => academicRequest<Suggestion[]>(path), setSuggestions);
  }

  function changeVersion(operation: 'submit' | 'approve' | 'reject' | 'publish', caption: string) {
    if (!detail) return;
    const input = { revision: detail.version.revision, effectiveFrom: effectiveFrom || undefined };
    void action(() => requestDetail(`timetables/${versionId}/${operation}?${scope}`, 'POST', input), data => {
      replaceDetail(data);
      setRefresh(value => value + 1);
      setNotice(caption);
    });
  }

  const editable = canDraft && detail?.version.status === 'draft';
  const underReview = detail?.version.status === 'pending_approval';
  const author = user?.userId === detail?.version.createdBy || user?.userId === detail?.version.submittedBy;
  const approved = underReview && detail.version.approvedRevision === detail.version.contentRevision;
  const rows = detail?.items.filter(item => !filter || [`class:${item.classId}`, `teacher:${item.staffId}`, `room:${item.roomId}`].includes(filter)) ?? [];
  const filterOptions = new Map<string, string>();
  detail?.items.forEach(item => {
    filterOptions.set(`class:${item.classId}`, `Lớp · ${item.classCode}`);
    filterOptions.set(`teacher:${item.staffId}`, `Giáo viên · ${item.teacherName}`);
    filterOptions.set(`room:${item.roomId}`, `Phòng · ${item.roomCode}`);
  });

  return <section className="space-y-5 rounded-2xl bg-white p-5" aria-label="Quản lý thời khóa biểu">
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Trường
        <select className={field} value={schoolId} disabled={busy || schools.length === 1} onChange={event => {
          setSchoolId(event.target.value); setSemesterId(''); setSemesters([]); setVersions([]); setOptions(emptyOptions); clearVersion('');
        }}><option value="">Chọn trường</option>
          {schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {schoolId && <label className="grid gap-1">Học kỳ
        <select className={field} value={semesterId} disabled={busy} onChange={event => {
          setSemesterId(event.target.value); setVersions([]); setOptions(emptyOptions); clearVersion('');
        }}><option value="">{semesters.length ? 'Chọn học kỳ' : 'Chưa có học kỳ'}</option>
          {semesters.map(item => <option key={item.id} value={item.id}>{item.name} · {item.startDate} → {item.endDate}</option>)}
        </select>
      </label>}
      {semesterId && <>
        <label className="grid gap-1">Phiên bản
          <select className={field} value={versionId} disabled={busy} onChange={event => clearVersion(event.target.value)}>
            <option value="">{versions.length ? 'Chọn phiên bản' : 'Chưa có phiên bản'}</option>
            {versions.map(item => <option key={item.id} value={item.id}>Bản {item.versionNo} · {statuses[item.status]}</option>)}
          </select>
        </label>
        {canDraft && <button className={field} disabled={busy || pending > 0} onClick={() => newVersion()}>Tạo bản nháp</button>}
        {canDraft && versionId && <button className={field} disabled={busy || pending > 0} onClick={() => newVersion(versionId)}>Nhân bản</button>}
      </>}
    </div>
    {pending > 0 && <p role="status">Đang tải thời khóa biểu.</p>}
    {error && <p className="text-red-800" role="alert">{error}{' '}
      <button className="underline" onClick={() => { setError(''); setRefresh(value => value + 1); }}>Tải lại</button></p>}
    {notice && <p role="status">{notice}</p>}
    {detail && <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">Xem theo lớp, giáo viên hoặc phòng
          <select className={field} value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {[...filterOptions.entries()].map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        {editable && <button className={field} disabled={busy || !options.assignments.length || !options.rooms.length || !options.periods.length}
          onClick={() => { setEntry(emptySlot); setChecked(null); setSuggestions(null); }}>Thêm ô lịch</button>}
        <button className={field} disabled={busy} onClick={() => void action(() => academicRequest<Check>(
          `timetables/${versionId}/validate?${scope}`, { method: 'POST' }), setChecked)}>Kiểm tra toàn lịch</button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {editable && <button className={field} disabled={busy} onClick={() => changeVersion('submit', 'Đã gửi duyệt.')}>Gửi duyệt</button>}
        {underReview && canApprove && !author && <>
          {!approved && <button className={field} disabled={busy} onClick={() => changeVersion('approve', 'Đã duyệt phiên bản.')}>Duyệt</button>}
          <button className={field} disabled={busy} onClick={() => changeVersion('reject', 'Đã trả về bản nháp.')}>Trả về bản nháp</button>
        </>}
        {approved && <p className="pb-2">Đã duyệt nội dung phiên bản.</p>}
        {approved && canPublish && <>
          <label className="grid gap-1">Ngày bắt đầu hiệu lực
            <input className={field} type="date" value={effectiveFrom} onChange={event => setEffectiveFrom(event.target.value)} />
          </label>
          <button className={field} disabled={busy} onClick={() => changeVersion('publish', 'Đã công bố lịch.')}>Công bố</button>
        </>}
        {detail.version.effectiveFrom && <p>Hiệu lực từ {detail.version.effectiveFrom}{detail.version.effectiveUntil
          ? ` đến trước ${detail.version.effectiveUntil}` : ''}</p>}
      </div>
      {editable && (!options.assignments.length || !options.rooms.length || !options.periods.length)
        && <p>Cần có phân công hoạt động, phòng khả dụng và khung tiết để thêm ô lịch.</p>}
      {entry && <form className="space-y-3 rounded-xl bg-slate-50 p-4" onSubmit={saveEntry}>
        <h2 className="font-semibold">{entry.id ? 'Sửa ô lịch' : 'Thêm ô lịch'}</h2>
        <fieldset disabled={busy} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1">Phân công<select className={field} required value={entry.teachingAssignmentId}
            onChange={event => { setEntry({ ...entry, teachingAssignmentId: event.target.value }); setSuggestions(null); setChecked(null); }}>
            <option value="">Chọn phân công</option>
            {options.assignments.map(item => <option key={item.id} value={item.id}>{item.classCode} · {item.subjectName} · {item.teacherName}</option>)}
          </select></label>
          <label className="grid gap-1">Ngày trong tuần<select className={field} value={entry.weekday}
            onChange={event => { setEntry({ ...entry, weekday: Number(event.target.value) }); setSuggestions(null); setChecked(null); }}>
            {[1, 2, 3, 4, 5, 6, 7].map(item => <option key={item} value={item}>{day(item)}</option>)}
          </select></label>
          <label className="grid gap-1">Tiết<select className={field} required value={entry.periodId}
            onChange={event => { setEntry({ ...entry, periodId: event.target.value }); setChecked(null); }}>
            <option value="">Chọn tiết</option>
            {options.periods.map(item => <option key={item.id} value={item.id}>Tiết {item.number} · {time(item.startsAt)}–{time(item.endsAt)}</option>)}
          </select></label>
          <label className="grid gap-1">Phòng<select className={field} required value={entry.roomId}
            onChange={event => { setEntry({ ...entry, roomId: event.target.value }); setChecked(null); }}>
            <option value="">Chọn phòng</option>
            {options.rooms.map(item => <option key={item.id} value={item.id}>{item.code}</option>)}
          </select></label>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button className={field} disabled={busy}>Lưu ô lịch</button>
          <button type="button" className={field} disabled={busy || !entry.teachingAssignmentId || !entry.roomId || !entry.periodId}
            onClick={checkEntry}>Kiểm tra ô</button>
          <button type="button" className={field} disabled={busy || !entry.teachingAssignmentId} onClick={findSuggestions}>Gợi ý giờ, giáo viên và phòng</button>
          <button type="button" className="underline" disabled={busy} onClick={() => { setEntry(null); setChecked(null); setSuggestions(null); }}>Hủy</button>
        </div>
        {suggestions && (suggestions.length === 0 ? <p>Không tìm thấy tiết và phòng còn trống.</p> : <ul className="flex flex-wrap gap-2">
          {suggestions.map(item => <li key={item.teachingAssignmentId + item.periodId + item.roomId}>
            <button type="button" className={field} disabled={busy} onClick={() => {
              setEntry({ ...entry, teachingAssignmentId: item.teachingAssignmentId, periodId: item.periodId, roomId: item.roomId }); setSuggestions(null); setChecked(null);
            }}>{item.teacherName} · {item.roomCode} · {time(item.startsAt)}–{time(item.endsAt)}</button>
          </li>)}
        </ul>)}
      </form>}
      {checked && (checked.valid ? <p role="status">Không có xung đột giờ.</p> : <ul className="space-y-1 text-red-800" aria-label="Xung đột">
        {checked.errors?.map(item => <li key={item}>{item}</li>)}
        {checked.conflicts.map((item, index) => <li key={item.slotId + item.resource + index}>
          {kinds[item.resource]} {item.label} · {day(item.weekday)} · {time(item.startsAt)}–{time(item.endsAt)}
        </li>)}
      </ul>)}
      {rows.length === 0 ? <p>Không có ô lịch.</p> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>{['Ngày', 'Giờ', 'Lớp', 'Môn', 'Giáo viên', 'Phòng', ...(editable ? ['Thao tác'] : [])].map(label =>
            <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{rows.map(slot => <tr key={slot.id} className="border-t">
            <th scope="row" className="p-2">{day(slot.weekday)}</th>
            <td className="p-2">{time(slot.startsAt)}–{time(slot.endsAt)}</td>
            <td className="p-2">{slot.classCode}</td><td className="p-2">{slot.subjectName}</td>
            <td className="p-2">{slot.teacherName}</td><td className="p-2">{slot.roomCode}</td>
            {editable && <td className="space-x-3 p-2">
              <button className="underline" disabled={busy} onClick={() => {
                setEntry(slot); setChecked(null); setSuggestions(null);
              }}>Sửa</button>
              <button className="underline" disabled={busy} onClick={() => removeEntry(slot)}>Xóa</button>
            </td>}
          </tr>)}</tbody>
        </table>
      </div>}
    </>}
  </section>;
}
