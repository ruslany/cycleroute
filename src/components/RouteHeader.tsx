"use client";

import Link from "next/link";
import { useState } from "react";

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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      <Link href="/" className="text-blue-600 hover:text-blue-800">
        &larr; Back
      </Link>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-2 py-1 text-lg font-bold"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setName(initialName);
              setEditing(false);
            }}
            className="rounded px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      ) : (
        <h1
          className="cursor-pointer text-2xl font-bold hover:text-blue-600"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {name}
        </h1>
      )}
    </div>
  );
}
