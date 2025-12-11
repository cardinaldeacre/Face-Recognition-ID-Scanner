import type { EventItem } from '../types/types';

export default function EventList({ events }: { events: EventItem[] }) {
  return (
    <section className="card event-section">
      <h2>📣 Upcoming Events</h2>

      <ul id="event-list">
        {events.length === 0 ? (
          <li>No events currently scheduled.</li>
        ) : (
          events.map((ev, index) => (
            <li key={index}>
              <strong>{ev.name}</strong>: {ev.details}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
