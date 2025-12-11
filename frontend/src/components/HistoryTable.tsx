import type { Application } from '../types/types';

export default function HistoryTable({ applications }: { applications: Application[] }) {
  return (
    <section className="card">
      <h2>🕒 Licensing History</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Purpose</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {applications.map(app => (
            <tr key={app.id}>
              <td>{app.date}</td>
              <td>{app.purpose}</td>
              <td>
                <span className={`status-pill status-${app.status}`}>
                  {app.status.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
