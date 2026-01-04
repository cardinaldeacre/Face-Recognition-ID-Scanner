// import type { Application, EventItem } from '../types/types';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getMyPermissionHistory,
  requestPermission,
  // Asumsi ada service untuk handling scan
  verifyAttendance 
} from '../services/permission';
import type { Permissions } from '../services/permission';
import HistoryTable from './HistoryTable';
import { logout } from '../services/auth';

// --- TAMBAHAN IMPORT ---
import FaceScanner from './FaceScanner'; // Sesuaikan path komponen scanner Anda
// -----------------------

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
  
  // --- TAMBAHAN STATE SCANNER ---
  const [showScanner, setShowScanner] = useState(false);
  // -----------------------------

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

  // --- TAMBAHAN FUNGSI HANDLE SCAN ---
  const handleScanResult = async (nimDetected: string) => {
    // Logika: Ketika wajah terdeteksi, kirim ke backend untuk absen
    try {
        // alert(`Wajah terdeteksi: ${nimDetected}. Memproses absensi...`);
        // Contoh pemanggilan API (sesuaikan dengan service Anda)
        // await verifyAttendance(nimDetected); 
        
        alert(`Berhasil Check-in/out untuk NIM: ${nimDetected}`);
        setShowScanner(false); // Tutup scanner setelah berhasil
        load(); // Refresh history
    } catch (error) {
        console.error(error);
        alert('Gagal memproses absensi.');
    }
  };
  // -----------------------------------

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ... (kode validasi lama tetap sama) ...
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: '10px' }}>
        
        {/* --- TAMBAHAN TOMBOL SCANNER --- */}
        <button 
          onClick={() => setShowScanner(!showScanner)} 
          className="submit-btn" 
          style={{ backgroundColor: '#2196F3' }}
        >
          {showScanner ? 'Tutup Scanner' : '📷 Scan Wajah (Absen Mandiri)'}
        </button>
        {/* ------------------------------- */}

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* --- TAMBAHAN AREA SCANNER --- */}
      {showScanner && (
        <section className="card" style={{ textAlign: 'center' }}>
            <h2>📷 Self-Service Face Scan</h2>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                {/* Pass fungsi handleScanResult ke komponen FaceScanner */}
                <FaceScanner /> 
                {/* Note: Logic pengiriman data biasanya ada di dalam FaceScanner atau dioper via props */}
            </div>
            <p style={{ marginTop: 10, color: '#666' }}>
                Arahkan wajah ke kamera untuk melakukan Check-In atau Check-Out.
            </p>
        </section>
      )}
      {/* ----------------------------- */}

      <section className="card">
        <h2>📝 New License Request</h2>
        {/* ... (form request tetap sama) ... */}
        <form onSubmit={onSubmit}>
             {/* ... isi form tetap sama ... */}
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
              {/* ... input time tetap sama ... */}
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
                <label>Waktu Selesai</label>
                <input type="text" value={duration} readOnly />
              </div>
              <button type="submit" className="submit-btn">
                Submit Request
              </button>
        </form>
      </section>

      <HistoryTable applications={history} loading={loading} />

      <EventList events={events} />
    </div>
  );
}