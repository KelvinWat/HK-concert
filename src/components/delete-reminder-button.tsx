"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteReminderButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this reminder?")) return;
    setPending(true);
    try {
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete the reminder.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="text-xs font-medium text-ink-400 transition hover:text-ember-400 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Delete"}
    </button>
  );
}
