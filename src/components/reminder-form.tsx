"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReminderType } from "@/lib/data/types";

export interface ReminderOption {
  value: ReminderType;
  label: string;
  triggerTime: string;
}

export function ReminderForm({
  concertId,
  options,
}: {
  concertId: string;
  options: ReminderOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReminderType | "">(
    options[0]?.value ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeValue = options.some((option) => option.value === selected)
    ? selected
    : (options[0]?.value ?? "");
  const selectedOption = options.find(
    (option) => option.value === activeValue,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeValue) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concertId, reminderType: activeValue }),
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : "Could not create the reminder.",
          );
        }

        setMessage("Reminder created.");
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Something went wrong.",
        );
      }
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        Every available reminder for this concert already exists, or the sale
        date has not been announced yet.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="label" htmlFor="reminder-type">
          Reminder type
        </label>
        <select
          id="reminder-type"
          className="select"
          value={activeValue}
          onChange={(event) =>
            setSelected(event.target.value as ReminderType | "")
          }
          disabled={pending}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {selectedOption ? (
        <p className="text-xs text-ink-400">
          Scheduled for{" "}
          <span className="text-ink-200">
            {new Intl.DateTimeFormat("en-HK", {
              timeZone: "Asia/Hong_Kong",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(new Date(selectedOption.triggerTime))}
          </span>{" "}
          HKT
        </p>
      ) : null}

      <button
        type="submit"
        className="btn-primary"
        disabled={pending || !activeValue}
      >
        {pending ? "Adding…" : "Add reminder"}
      </button>

      {message ? <p className="text-xs text-mint-400">{message}</p> : null}
      {error ? <p className="text-xs text-ember-400">{error}</p> : null}
    </form>
  );
}
