import { useState } from 'react';
import Login from './components/Login';
import Portal from './components/Portal';
import { clearSession, hasValidSession } from './lib/auth';

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => hasValidSession());

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <Portal
      onLogout={() => {
        clearSession();
        setAuthed(false);
        window.scrollTo(0, 0);
      }}
    />
  );
}
