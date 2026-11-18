import { FormEvent, useState } from 'react';
import { academicRequest } from '../services/classApi';

type Profile = { id: string; fullName: string };
type LinkableStudent = { id: string; userId: string | null; revision?: number };
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2';

export function StudentProfileLink<T extends LinkableStudent>({ student, schoolId, onSaved }: {
  student: T;
  schoolId: string;
  onSaved: (student: T) => void;
}) {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [profileId, setProfileId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setProfileId('');
    setProfiles(null);
    try {
      const params = new URLSearchParams({ schoolId, search: query.trim() });
      setProfiles(await academicRequest<Profile[]>(`students/profile-options?${params}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(userId: string | null) {
    setBusy(true);
    setError('');
    try {
      const updated = await academicRequest<T>(`students/${student.id}/profile?schoolId=${schoolId}`, {
        method: 'PUT', body: JSON.stringify({ userId, revision: student.revision }),
      });
      setProfiles(null);
      setProfileId('');
      onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-2">
    <p>{student.userId ? 'Đã liên kết tài khoản học sinh.' : 'Chưa liên kết tài khoản học sinh.'}</p>
    <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
      <label className="grid gap-1">Tìm tài khoản theo họ tên
        <input className={field} required minLength={2} maxLength={200} disabled={busy}
          value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      <button className={field} disabled={busy}>Tìm tài khoản</button>
    </form>
    {profiles && (profiles.length ? <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1">Tài khoản
        <select className={field} value={profileId} disabled={busy} onChange={event => setProfileId(event.target.value)}>
          <option value="">Chọn tài khoản</option>
          {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.fullName} · {profile.id.slice(0, 8)}</option>)}
        </select>
      </label>
      <button className={field} disabled={busy || !profileId} onClick={() => void save(profileId)}>Liên kết</button>
    </div> : <p>Không tìm thấy tài khoản phù hợp.</p>)}
    {student.userId && <button className="underline" disabled={busy} onClick={() => void save(null)}>Gỡ liên kết</button>}
    {error && <p role="alert" className="text-red-800">{error}</p>}
  </div>;
}
