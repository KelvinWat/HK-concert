import Link from "next/link";
import type { Metadata } from "next";
import { DeleteReminderButton } from "@/components/delete-reminder-button";
import { EmptyState } from "@/components/ui/empty-state";
import { REMINDER_TYPES } from "@/lib/constants";
import { getRepo } from "@/lib/data";
import type { ReminderWithConcert } from "@/lib/data/types";
import {
  daysUntilTime,
  formatConcertDate,
  formatDateTime,
  formatRelativeDays,
  nowMs,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reminder centre",
  description: "Ticket sale and concert-day reminders for your watchlist.",
};

export default async function RemindersPage() {
  const reminders = await getRepo().listReminders();
  const now = nowMs();

  const due = reminders.filter(
    (reminder) => !reminder.sent && new Date(reminder.triggerTime).getTime() <= now,
  );
  const upcoming = reminders.filter(
    (reminder) => !reminder.sent && new Date(reminder.triggerTime).getTime() > now,
  );
  const sent = reminders.filter((reminder) => reminder.sent);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
            Reminder centre
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Sale and show-day alerts. Reminders are shown here — email and
            Telegram delivery arrive in a later phase.
          </p>
        </div>
        <Link href="/concerts" className="btn-secondary">
          Add a reminder
        </Link>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <Summary label="Due now" value={due.length} tone="ember" />
        <Summary label="Upcoming" value={upcoming.length} tone="mint" />
        <Summary label="Total" value={reminders.length} tone="ink" />
      </dl>

      {reminders.length === 0 ? (
        <EmptyState
          title="No reminders yet"
          description="Open a concert and choose a ticket-sale or show-day reminder."
          action={{ href: "/concerts", label: "Browse concerts" }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Group
            title="Due now"
            description="These reminders have reached their trigger time."
            reminders={due}
          />
          <Group
            title="Upcoming"
            description="Scheduled alerts for ticket sales and concerts."
            reminders={upcoming}
          />
          {sent.length > 0 ? (
            <Group
              title="Sent"
              description="Already delivered reminders."
              reminders={sent}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  description,
  reminders,
}: {
  title: string;
  description: string;
  reminders: ReminderWithConcert[];
}) {
  return (
    <section className="card p-5">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-xs text-ink-400">{description}</p>
      </div>

      {reminders.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-ink-700 px-4 py-5 text-center text-sm text-ink-400">
          Nothing in this group.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-800/80">
          {reminders.map((reminder) => {
            const definition = REMINDER_TYPES.find(
              (type) => type.value === reminder.reminderType,
            );
            const days = daysUntilTime(reminder.triggerTime);

            return (
              <li
                key={reminder.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-100">
                    {reminder.artistName}
                    <span className="ml-2 text-xs font-normal text-ink-400">
                      {reminder.concertName}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {definition?.label ?? reminder.reminderType} ·{" "}
                    {formatDateTime(reminder.triggerTime)}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-ink-500">
                    Concert on {formatConcertDate(reminder.concertDate)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="chip">
                    {reminder.sent
                      ? "Sent"
                      : formatRelativeDays(days)}
                  </span>
                  <Link
                    href={`/concert/${reminder.concertId}`}
                    className="text-xs font-medium text-ink-300 transition hover:text-ember-400"
                  >
                    View
                  </Link>
                  <DeleteReminderButton id={reminder.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ember" | "mint" | "ink";
}) {
  return (
    <div className="card px-4 py-3">
      <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {label}
      </dt>
      <dd
        className={
          tone === "ember"
            ? "mt-1 text-2xl font-semibold text-ember-400 tabular-nums"
            : tone === "mint"
              ? "mt-1 text-2xl font-semibold text-mint-400 tabular-nums"
              : "mt-1 text-2xl font-semibold text-ink-100 tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
