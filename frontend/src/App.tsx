import { useState } from 'react';
import Sidebar from './components/sidebar';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import type { Application, EventItem } from './types/types';

export default function App() {
  const [view, setView] = useState<'student' | 'admin'>('student');

  const [applications, setApplications] = useState<Application[]>([
    { id: 1, student: "John Doe", date: "2025-12-01", purpose: "Book Retrieval", status: "approve" },
    { id: 2, student: "Jane Smith", date: "2025-12-02", purpose: "Lab Access", status: "waiting" }
  ]);

  const [events, setEvents] = useState<EventItem[]>([]);

  const approveApplication = (id: number) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === id ? { ...app, status: "approve" } : app
      )
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar current={view} onChange={setView} />

      <div className="main-content">
        {view === 'student' && (
          <StudentDashboard
            applications={applications}
            setApplications={setApplications}
            events={events}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard
            applications={applications}
            approve={approveApplication}
            events={events}
            setEvents={setEvents}
          />
        )}
      </div>
    </div>
  );
}
