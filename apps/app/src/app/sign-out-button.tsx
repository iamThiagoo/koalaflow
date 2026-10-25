'use client';

import { useState } from 'react';

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.assign('/login');
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="rounded-lg border border-border px-4 py-2 text-text-primary hover:bg-surface-muted disabled:opacity-60"
    >
      Sair
    </button>
  );
}
