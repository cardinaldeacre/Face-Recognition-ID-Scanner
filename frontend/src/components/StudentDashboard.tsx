import type { Application, EventItem } from '../types/types';
import { useState } from 'react';
import HistoryTable from './HistoryTable';
import EventList from './EventList';

interface Props {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  events: EventItem[];
}

export default function StudentDashboard({ applications, setApplications, events }: Props) {
  const [form, setForm] = useState({
    date: '',
    purpose: '',
    destination: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newApp: Application = {
      id: applications.length + 1,
      student: "Current Student",
      date: form.date,
      purpose: form.purpose,
      destination: form.destination,
      status: 'waiting'
    };

    setApplications(prev => [...prev, newApp]);

    setForm({ date: '', purpose: '', destination: '' });

    alert("License request submitted successfully!");
  };

  return (
    <div className="content-area active">
      <section className="card">
        <h2>📝 New License Request</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Purpose:</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Destination:</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit Request
          </button>
        </form>
      </section>

      <HistoryTable applications={applications} />

      <EventList events={events} />
    </div>
  );
}
