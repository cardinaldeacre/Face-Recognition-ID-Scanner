/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import EventList from './EventList';

import type { DashboardOutletContext } from './DashboardLayout';
import {
  getAllPermissionsAdmin,
  updatePermissionStatus,
} from '../services/permission';
import type { Permissions } from '../services/permission';
import { logout } from '../services/auth';

// permission management

export default function AdminDashboard() {
  const { events, setEvents } = useOutletContext<DashboardOutletContext>();

  const [permissions, setPermissions] = useState<Permissions[]>([]);
  const [loading, setLoading] = useState(true);
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
        }}
      >
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
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
