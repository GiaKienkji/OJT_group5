import { FormEvent, useEffect, useState } from 'react';
import { academicRequest, School } from '../services/classApi';

type CalendarSchool = School & { today: string };
export type CalendarRow = {
  kind: 'lesson' | 'exam'; id: string; onDate: string; timezone: string; classCode: string;
  subjectName: string; staffId: string | null; teacherName: string | null; originalStaffId: string | null;
  roomCode: string | null; startsAt: string; endsAt: string;
};

const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50';
function addDays(date: string, days: number) {
  const result = new Date(date + 'T00:00:00Z');
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function schoolTime(timestamp: string, timezone: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(timestamp));
}

export function PublishedSchedulePage({ examsOnly = false }: { examsOnly?: boolean }) {
  const [schools, setSchools] = useState<CalendarSchool[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [loadingScope, setLoadingScope] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const shown = examsOnly ? rows.filter(item => item.kind === 'exam') : rows;

  function pick(school: CalendarSchool | undefined) {
    const start = school?.today ?? '';
    const end = start ? addDays(start, 6) : '';
    setFrom(start); setTo(end); setSchoolId(school?.id ?? '');
    setRows([]); setError('');
    setRange(school ? { from: start, to: end } : null);
  }

  useEffect(() => {
    const abort = new AbortController();
    setLoadingScope(true);
    academicRequest<CalendarSchool[]>('schedule/context', { signal: abort.signal }).then(items => {
      if (abort.signal.aborted) return;
      setSchools(items);
      if (items.length === 1) pick(items[0]);
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoadingScope(false); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!schoolId || !range) return;
    const abort = new AbortController();
    setLoadingData(true);
    setError('');
    academicRequest<CalendarRow[]>(`schedule?${new URLSearchParams({ schoolId, ...range })}`, { signal: abort.signal })
      .then(items => { if (!abort.signal.aborted) setRows(items); })
      .catch(err => { if (!abort.signal.aborted) setError(err.message); })
      .finally(() => { if (!abort.signal.aborted) setLoadingData(false); });
    return () => abort.abort();
  }, [schoolId, range, retry]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRange({ from, to });
  }

  return <section className="space-y-4 rounded-xl bg-white p-5" aria-label="Lịch công bố">
    <h2 className="text-lg font-semibold">{examsOnly ? 'Lịch kiểm tra công bố' : 'Lịch công bố'}</h2>
    {schools.length > 0 && <label className="grid max-w-sm gap-1">Trường
      <select className={field} value={schoolId} disabled={schools.length === 1} onChange={event => {
        pick(schools.find(item => item.id === event.target.value));
      }}>
        <option value="">Chọn trường</option>
        {schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>}
    {schoolId && <form className="flex flex-wrap items-end gap-2" onSubmit={submit}>
      <label className="grid gap-1">Từ ngày<input type="date" required className={field} value={from}
        onChange={event => setFrom(event.target.value)} /></label>
      <label className="grid gap-1">Đến ngày<input type="date" required min={from} className={field} value={to}
        onChange={event => setTo(event.target.value)} /></label>
      <button className={field} disabled={loadingData}>Xem lịch</button>
    </form>}
    {(loadingScope || loadingData) && <p role="status">Đang tải lịch.</p>}
    {error && <p role="alert">{error}{' '}
      {schoolId && <button className="underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>}</p>}
    {schoolId && !loadingScope && !loadingData && !error && (shown.length === 0 ? <p>Không có ca đã công bố trong khoảng ngày này.</p>
      : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>{['Ngày', 'Giờ', 'Lớp', 'Môn học', 'Giáo viên', 'Phòng', 'Loại ca'].map(label =>
            <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{shown.map(item => <tr key={item.kind + item.id + item.onDate} className="border-t">
            <th scope="row" className="p-2">{item.onDate}</th>
            <td className="p-2">{schoolTime(item.startsAt, item.timezone)}–{schoolTime(item.endsAt, item.timezone)}</td>
            <td className="p-2">{item.classCode}</td><td className="p-2">{item.subjectName}</td>
            <td className="p-2">{item.teacherName ?? '—'}</td><td className="p-2">{item.roomCode ?? '—'}</td>
            <td className="p-2">{item.kind === 'exam' ? 'Kiểm tra' : item.staffId !== item.originalStaffId ? 'Dạy thay' : 'Tiết học'}</td>
          </tr>)}</tbody>
        </table>
      </div>)}
  </section>;
}
