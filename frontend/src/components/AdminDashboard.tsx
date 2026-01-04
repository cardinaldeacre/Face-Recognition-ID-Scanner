/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getAllPermissionsAdmin,
  updatePermissionStatus,
  getRecentScanLogs,
} from '../services/permission';
import type { Permissions, ScanLog } from '../services/permission';
import { logout } from '../services/auth';
import FaceScanner from './FaceScanner'; 

export default function AdminDashboard() {
  const { events, setEvents } = useOutletContext<DashboardOutletContext>();
  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const navigate = useNavigate();

  // --- STATE UNTUK SCANNER ---
  const [showGateScanner, setShowGateScanner] = useState(false);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]); 
  const pollingRef = useRef<number | null>(null);

  const [eventForm, setEventForm] = useState({ name: '', details: '' });

  // Fungsi refresh data
  async function load() {
    try {
      const [historyData, logsData] = await Promise.all([
        getAllPermissionsAdmin(),
        getRecentScanLogs()
      ]);
      setPermissions(Array.isArray(historyData) ? historyData : []);
      setScanLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error("Gagal refresh data:", error);
    }
  }

  // Effect Polling
  useEffect(() => {
    if (showGateScanner) {
      load();
      pollingRef.current = window.setInterval(load, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showGateScanner]);

  useEffect(() => {
    load();
  }, []);

  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents((prev) => [...prev, { ...eventForm }]);
    setEventForm({ name: '', details: '' });
    alert('Event published!');
  };

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
      {/* HEADER ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: '10px' }}>
        <button 
          onClick={() => setShowGateScanner(!showGateScanner)} 
          className="submit-btn"
          style={{ 
            backgroundColor: showGateScanner ? '#f44336' : '#ff9800', 
            width: 'auto',
            fontWeight: 'bold'
          }}
        >
          {showGateScanner ? '✖ Tutup Scanner' : '🚧 Buka Gate Scanner'}
        </button>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* --- FITUR SCANNER & LOG REALTIME (LAYOUT TENGAH) --- */}
      {showGateScanner && (
        <section className="card" style={{ 
          border: '2px solid #ff9800', 
          backgroundColor: '#fff',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '25px' 
          }}>
            
            {/* 1. AREA KAMERA (CENTER) */}
            <div style={{ 
              width: '100%', 
              maxWidth: '600px', 
              textAlign: 'center' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>📸 Kamera Pemantau Gerbang</h3>
                <span className="status-badge status-badge--accepted" style={{ animation: 'pulse 1.5s infinite' }}>LIVE</span>
              </div>
              
              <div style={{ 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                border: '1px solid #ddd',
                backgroundColor: '#000'
              }}>
                <FaceScanner />
              </div>
            </div>

            {/* 2. AREA LOG SCAN (DI BAWAH KAMERA) */}
            <div style={{ 
              width: '100%', 
              maxWidth: '600px', 
              background: '#fdfdfd', 
              padding: '20px', 
              borderRadius: '16px',
              border: '1px solid #eee',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '2px solid #ff9800',
                paddingBottom: '10px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#444' }}>📋 Log Aktivitas Terakhir</h3>
                <small style={{ color: '#888' }}>Update otomatis</small>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {scanLogs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                    Menunggu deteksi wajah di gerbang...
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {scanLogs.map((log) => (
                      <li key={log.id} style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>
                                {log.attendance_status === 'check_in' ? '📥' : '📤'}
                            </span>
                            <strong style={{ color: '#2c3e50' }}>{log.student_name}</strong>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginLeft: '32px' }}>
                            {log.student_nim} • {new Date(log.updated_at).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <span className={`status-badge status-badge--${log.attendance_status === 'check_in' ? 'pending' : 'accepted'}`} 
                              style={{ minWidth: '90px', textAlign: 'center', fontWeight: 'bold' }}>
                           {log.attendance_status === 'check_in' ? 'MASUK' : 'KELUAR'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* --- TABEL PENDING --- */}
      <section className="card">
        <h2>📥 Pending Applications</h2>
        <table>
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
                <td colSpan={7} style={{ textAlign: 'center' }}>No pending applications.</td>
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
                      <button className="action-btn" onClick={() => onApprove(app.id)}>Approve</button>
                      <button className="action-btn action-btn--deny" onClick={() => onDeny(app.id)}>Deny</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* --- ADD EVENT --- */}
      <section className="card">
        <h2>🗓️ Add New Event</h2>
        <form onSubmit={submitEvent}>
          <div className="form-group">
            <label>Event Name:</label>
            <input
              type="text"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Details:</label>
            <textarea
              value={eventForm.details}
              onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })}
              required
            />
          </div>
          <button className="submit-btn" type="submit">Publish Event</button>
        </form>
      </section>

      {/* --- HISTORY TABLE --- */}
      <section className="card">
        <h2>📜 Status History Perizinan Mahasiswa</h2>
        <table>
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
                <td colSpan={9} style={{ textAlign: 'center' }}>Belum ada history perizinan.</td>
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
                    <span className={`status-badge status-badge--${perm.attendance_status || perm.status}`}>
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