interface Props {
  current: 'student' | 'admin';
  onChange: (v: 'student' | 'admin') => void;
}

export default function Sidebar({ current, onChange }: Props) {
  return (
    <div className="sidebar">
      <h2>📜 Licensing Portal</h2>

      <nav>
        <a
          className={current === 'student' ? 'active' : ''}
          onClick={() => onChange('student')}
        >
          Student Dashboard
        </a>

        <a
          className={current === 'admin' ? 'active' : ''}
          onClick={() => onChange('admin')}
        >
          Admin Dashboard
        </a>
      </nav>
    </div>
  );
}
