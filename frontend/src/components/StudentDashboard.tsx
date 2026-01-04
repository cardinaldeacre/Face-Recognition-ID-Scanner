/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getMyPermissionHistory,
  requestPermission,
} from '../services/permission';
import type { Permissions } from '../services/permission';
import HistoryTable from './HistoryTable';
import { logout } from '../services/auth';

function minutesBetween(startISO: string, endISO: string) {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();

  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
  return Math.round((e - s) / 60000);
}

export default function StudentDashboard() {
  const { events } = useOutletContext<DashboardOutletContext>();

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Permissions[]>([]);

  const [form, setForm] = useState({
    purpose: '',
    start_time: '',
    end_time: '',
  });

  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getMyPermissionHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const duration = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    return minutesBetween(form.start_time, form.end_time);
  }, [form.start_time, form.end_time]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.purpose || !form.start_time || !form.end_time) {
      alert('Lengkapi alasan, waktu mulai, dan waktu selesai');
      return;
    }
    if (duration <= 0) {
      alert('Waktu selesai harus lebih besar dari waktu mulai');
      return;
    }

    await requestPermission({
      reason: form.purpose,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      duration,
    });

    setForm({ purpose: '', start_time: '', end_time: '' });
    alert('Pengajuan perizinan berhasil dikirim');
    load();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="content-area active">
      {/* HEADER ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: '10px' }}>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* --- FORM PENGAJUAN IZIN --- */}
      <section className="card">
        <h2>📝 New License Request</h2>
        <form onSubmit={onSubmit}>
             <div className="form-group">
                <label>Keperluan:</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Contoh : Membeli charger"
                  required
                />
              </div>
              <div className="form-group">
                <label>Waktu Berangkat</label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Waktu Pulang</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Durasi (Menit)</label>
                <input type="text" value={duration} readOnly style={{ backgroundColor: '#f5f5f5' }} />
              </div>
              <button type="submit" className="submit-btn">
                Submit Request
              </button>
        </form>
      </section>

      {/* --- TABEL RIWAYAT & EVENT --- */}
      <HistoryTable applications={history} loading={loading} />
      <EventList events={events} />
    </div>
  );
}