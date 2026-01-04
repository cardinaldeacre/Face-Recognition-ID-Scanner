/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react'; // 1. Tambah useRef
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getAllPermissionsAdmin,
  updatePermissionStatus,
  getRecentScanLogs, // 2. Import fungsi baru
} from '../services/permission';
import type { Permissions, ScanLog } from '../services/permission'; // 3. Import tipe ScanLog
import { logout } from '../services/auth';

import FaceScanner from './FaceScanner'; 

export default function AdminDashboard() {
  const { events, setEvents } = useOutletContext<DashboardOutletContext>();

  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE SCANNER & LOG ---
  const [showGateScanner, setShowGateScanner] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]); // State untuk menampung log
  const pollingRef = useRef<number | null>(null); // Ref untuk menyimpan timer
  // ---------------------------

  const navigate = useNavigate();

  const [eventForm, setEventForm] = useState({ name: '', details: '' });
  const [permissionForm, setPermissionForm] = useState({
    nama: '',
    nim: '',
    alasan: '',
    prodi: '',
    semester: '',
    tanggal_keluar: '',
  });

  // --- LOGIC FETCH DATA ---
  // Fungsi ini mengambil data Log Scanner DAN History Utama sekaligus
  const refreshAllData = async () => {
    try {
      const [logsData, historyData] = await Promise.all([
        getRecentScanLogs(),      // Ambil 10 log terakhir
        getAllPermissionsAdmin()  // Ambil data tabel history utama
      ]);

      // Update state
      if (Array.isArray(logsData)) setScanLogs(logsData);
      if (Array.isArray(historyData)) setPermissions(historyData);
      
    } catch (error) {
      console.error("Gagal refresh data realtime:", error);
    }
  };
  // ------------------------

  // --- EFFECT KHUSUS SCANNER ---
  // Dijalankan setiap kali tombol "Buka Gate Scanner" ditekan
  useEffect(() => {
    if (showGateScanner) {
      // 1. Panggil data langsung saat dibuka
      refreshAllData();

      // 2. Set interval untuk panggil data setiap 3 detik (Polling)
      pollingRef.current = window.setInterval(() => {
        refreshAllData();
      }, 3000);

    } else {
      // 3. Jika ditutup, matikan interval agar tidak membebani server
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    // Cleanup saat pindah halaman
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showGateScanner]);
  // -----------------------------


  // ... (Sisa fungsi submitEvent, submitPermission, dll TETAP SAMA) ...

  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents((prev) => [...prev, { ...eventForm }]);
    setEventForm({ name: '', details: '' });
    alert('Event published!');
  };

  const submitPermission = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Perizinan mahasiswa berhasil dibuat!');
    setPermissionForm({
      nama: '',
      nim: '',
      alasan: '',
      prodi: '',
      semester: '',
      tanggal_keluar: '',
    });
  };

  async function load() {
    setLoading(true);
    try {
      const data = await getAllPermissionsAdmin();
      setPermissions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  // Load awal halaman biasa
  useEffect(() => {
    load();
  }, []);

  async function onApprove(id: number) {
    await updatePermissionStatus(id, 'accepted');
    await load();
  }

  async function onDeny(id: number) {
    await updatePermissionStatus(id, 'denied');
    await load();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const waiting = permissions.filter((p) => p.status === 'waiting');

  return (
    <div className="content-area active">
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
          gap: '10px'
        }}
      >
        <button 
            onClick={() => setShowGateScanner(!showGateScanner)} 
            className="submit-btn"
            style={{ backgroundColor: '#ff9800' }}
        >
          {showGateScanner ? 'Tutup Gate Mode' : '🚧 Buka Gate Scanner'}
        </button>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {showGateScanner && (
        <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>🚧 Gate Security Mode</h2>
                <span className="status-badge status-badge--accepted">Live Monitoring</span>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '600px', border: '2px dashed #ccc', padding: '10px' }}>
                     {/* FaceScanner tetap berjalan independen. 
                         Dia kirim data ke backend -> backend update DB -> interval kita di sini baca DB baru */}
                    <FaceScanner />
                </div>
                
                <div style={{ width: '100%', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h3>Log Aktivitas Terakhir:</h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                        {/* --- RENDER DATA DARI DATABASE --- */}
                        {scanLogs.length === 0 ? (
                             <li style={{ padding: '8px', color: '#666', textAlign: 'center' }}>
                                Belum ada aktivitas scan terbaru...
                             </li>
                        ) : (
                            scanLogs.map((log) => (
                                <li key={log.id} style={{ padding: '8px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {/* Ikon berdasarkan status */}
                                        <span style={{ marginRight: 8 }}>
                                            {log.attendance_status === 'check_in' ? '📥' : '📤'}
                                        </span>
                                        <strong>{log.student_name}</strong> 
                                        <span style={{ fontSize: '0.9em', color: '#555' }}> ({log.student_nim})</span>
                                    </div>
                                    
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={`status-badge status-badge--${log.attendance_status === 'check_in' ? 'pending' : 'accepted'}`}>
                                            {log.attendance_status === 'check_in' ? 'MASUK' : 'KELUAR'}
                                        </span>
                                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: 2 }}>
                                            {new Date(log.updated_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                        {/* -------------------------------- */}
                    </ul>
                </div>
            </div>
        </section>
      )}

      {/* ... SISA KODE (Pending Applications, Add Event, History Table) BIARKAN TETAP SAMA ... */}
      <section className="card">
        <h2>📥 Pending Applications</h2>
        <table>
            {/* ... isi tabel ... */}
            <thead>
            <tr>
              <th>Nama</th>
              <th>NIM</th>
              <th>Prodi</th>
              <th>Semester</th>
              <th>Tanggal</th>
              <th>Keperluan</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {waiting.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  No pending applications.
                </td>
              </tr>
            ) : (
              waiting.map((app) => (
                <tr key={app.id}>
                  <td>{app.student_name}</td>
                  <td>{app.student_nim}</td>
                  <td>{app.student_prodi || '-'}</td>
                  <td>{app.student_semester || '-'}</td>
                  <td>{new Date(app.start_time).toLocaleString()}</td>
                  <td>{app.reason}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => onApprove(app.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="action-btn action-btn--deny"
                        onClick={() => onDeny(app.id)}
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>🗓️ Add New Event</h2>
        <form onSubmit={submitEvent}>
            {/* ... form content ... */}
             <div className="form-group">
            <label>Event Name:</label>
            <input
              type="text"
              value={eventForm.name}
              onChange={(e) =>
                setEventForm({ ...eventForm, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Details:</label>
            <textarea
              value={eventForm.details}
              onChange={(e) =>
                setEventForm({ ...eventForm, details: e.target.value })
              }
              required
            />
          </div>
          <button className="submit-btn" type="submit">
            Publish Event
          </button>
        </form>
      </section>

      <section className="card">
        <h2>📜 Status History Perizinan Mahasiswa</h2>
        <table>
            {/* ... isi tabel history ... */}
            <thead>
            <tr>
              <th>Nama</th>
              <th>NIM</th>
              <th>Alasan</th>
              <th>Prodi</th>
              <th>Semester</th>
              <th>Jadwal Keluar</th>
              <th>Waktu IN</th>
              <th>Waktu OUT</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {permissions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  Belum ada history perizinan.
                </td>
              </tr>
            ) : (
              permissions.map((perm) => (
                <tr key={perm.id}>
                  <td>{perm.student_name || '-'}</td>
                  <td>{perm.student_nim || '-'}</td>
                  <td>{perm.reason}</td>
                  <td>{perm.student_prodi || '-'}</td>
                  <td>{perm.student_semester || '-'}</td>
                  <td>{new Date(perm.start_time).toLocaleString()}</td>
                  <td>{perm.check_in ? new Date(perm.check_in).toLocaleString() : '-'}</td>
                  <td>{perm.check_out ? new Date(perm.check_out).toLocaleString() : '-'}</td>
                  <td>
                    <span
                      className={`status-badge status-badge--${perm.attendance_status || perm.status}`}
                    >
                      {perm.attendance_status || perm.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <EventList events={events} />
    </div>
  );
}