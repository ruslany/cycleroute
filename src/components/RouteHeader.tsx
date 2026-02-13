'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RouteHeaderProps {
  routeId: string;
  initialName: string;
}

export default function RouteHeader({ routeId, initialName }: RouteHeaderProps) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/" className="text-primary hover:text-primary/80">
        &larr; Back
      </Link>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-input bg-background px-2 py-1 text-lg font-bold"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setName(initialName);
              setEditing(false);
            }}
            className="rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <h1
          className="cursor-pointer text-2xl font-bold hover:text-primary"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {name}
        </h1>
      )}
    </div>
  );
}
