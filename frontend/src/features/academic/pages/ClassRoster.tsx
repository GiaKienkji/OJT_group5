import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, ClassRow } from '../services/classApi';

type Choice = { id: string; code: string; name: string };
type Enrollment = {
  id: string;
  studentCode: string;
  fullName: string;
  enrolledOn: string;
  leftOn: string | null;
  status: string;
};
type Roster = { items: Enrollment[]; activeCount: number };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2';
const statusName: Record<string, string> = { active: 'Đang học', moved: 'Đã chuyển lớp', completed: 'Đã hoàn tất' };

export function ClassRoster({ row, schoolId, onClose }: { row: ClassRow; schoolId: string; onClose: () => void }) {
  const path = `classes/${row.id}`;
  const scope = new URLSearchParams({ schoolId });
  const [roster, setRoster] = useState<Roster | null>(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Choice[] | null>(null);
  const [destinations, setDestinations] = useState<Choice[]>([]);
  const [studentId, setStudentId] = useState('');
  const [destination, setDestination] = useState('');
  const [transfer, setTransfer] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const isActive = row.status === 'active';

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError('');
    academicRequest<Roster>(`${path}/enrollments?${new URLSearchParams({ schoolId })}`, { signal: abort.signal })
      .then(setRoster)
      .catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [path, schoolId, revision]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError('');
    setStudentId('');
    setCandidates(null);
    try {
      setCandidates(await academicRequest<Choice[]>(`${path}/enrollment-candidates?${new URLSearchParams({ schoolId, search: query.trim() })}`));
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseDestination(enrollment: Enrollment) {
    setBusy(true);
    setActionError('');
    setTransfer(null);
    setDestination('');
    try {
      setDestinations(await academicRequest<Choice[]>(`${path}/transfer-destinations?${scope}`));
      setTransfer(enrollment);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(endpoint: string, input: object, success: string) {
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await academicRequest<Enrollment>(`${endpoint}?${scope}`, { method: 'POST', body: JSON.stringify(input) });
      setStudentId('');
      setCandidates(null);
      setTransfer(null);
      setMessage(success);
      setRevision(value => value + 1);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label={`Ghi danh lớp ${row.code}`} className="space-y-4 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Ghi danh lớp {row.code}</h2>
      <button className="underline" disabled={busy} onClick={onClose}>Đóng danh sách</button>
    </div>
    {loading && <p role="status">Đang tải danh sách.</p>}
    {error && <p role="alert">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Thử lại</button></p>}
    {message && <p role="status">{message}</p>}
    {!loading && !error && roster && <>
      <p>Sĩ số {roster.activeCount}{row.capacity == null ? '' : ` / ${row.capacity}`}</p>
      {isActive && <div className="space-y-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
          <label className="grid gap-1">Tìm học sinh chưa có lớp<input className={field} value={query} onChange={event => setQuery(event.target.value)} maxLength={200} disabled={busy} /></label>
          <button className={field} disabled={busy}>Tìm học sinh</button>
        </form>
        {candidates?.length === 0 && <p>Không tìm thấy học sinh phù hợp.</p>}
        {candidates && candidates.length > 0 && <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1">Học sinh
            <select className={field} value={studentId} disabled={busy} onChange={event => setStudentId(event.target.value)}>
              <option value="">Chọn học sinh</option>
              {candidates.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
            </select>
          </label>
          <button className={field} disabled={busy || !studentId} onClick={() => void submit(`${path}/enrollments`, { studentId }, 'Đã ghi danh học sinh.')}>Ghi danh</button>
        </div>}
      </div>}
      {roster.items.length === 0 ? <p>Lớp chưa có ghi danh.</p> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>{['Mã học sinh', 'Họ tên', 'Ngày vào', 'Ngày rời', 'Trạng thái', 'Thao tác'].map(label =>
            <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{roster.items.map(item => <tr key={item.id} className="border-t">
            <th scope="row" className="p-2">{item.studentCode}</th>
            <td className="p-2">{item.fullName}</td><td className="p-2">{item.enrolledOn}</td>
            <td className="p-2">{item.leftOn ?? '—'}</td><td className="p-2">{statusName[item.status] ?? item.status}</td>
            <td className="p-2">{isActive && item.status === 'active' && <button className="underline" disabled={busy}
              onClick={() => void chooseDestination(item)} aria-label={`Chuyển lớp cho ${item.fullName}`}>Chuyển lớp</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </>}
    {transfer && <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
      event.preventDefault();
      if (destination) void submit(`enrollments/${transfer.id}/transfer`, { classId: destination }, 'Đã chuyển lớp.');
    }}>
      <label className="grid gap-1">Lớp đích cho {transfer.fullName}
        <select className={field} value={destination} disabled={busy} onChange={event => setDestination(event.target.value)}>
          <option value="">{destinations.length ? 'Chọn lớp đích' : 'Không có lớp cùng năm học và khối'}</option>
          {destinations.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </label>
      <button className={field} disabled={busy || !destination}>Xác nhận chuyển</button>
      <button type="button" disabled={busy} className="underline" onClick={() => setTransfer(null)}>Hủy</button>
    </form>}
    {actionError && <p role="alert" className="text-red-800">{actionError}</p>}
  </section>;
}
