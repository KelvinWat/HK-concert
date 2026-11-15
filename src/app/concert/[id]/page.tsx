import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConcertCard } from "@/components/concert-card";
import { DeleteReminderButton } from "@/components/delete-reminder-button";
import { HeatBreakdown } from "@/components/heat-breakdown";
import { HistoryChart } from "@/components/history-chart";
import { ReminderForm } from "@/components/reminder-form";
import { SnapshotTimeline } from "@/components/snapshot-timeline";
import { WatchlistControls } from "@/components/watchlist-controls";
import { HeatBadge } from "@/components/ui/heat-badge";
import { StarRating } from "@/components/ui/star-rating";
import { StatusBadge } from "@/components/ui/status-badge";
import { REMINDER_TYPES } from "@/lib/constants";
import { getRepo } from "@/lib/data";
import {
  formatConcertDate,
  formatDateTime,
  formatPrice,
  formatPriceRange,
  nowMs,
  reminderTriggerTime,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const concert = await getRepo().getConcert(id);

  if (!concert) return { title: "Concert not found" };

  return {
    title: `${concert.artistName} — ${concert.name}`,
    description: `${concert.artistName} at ${concert.venueName} on ${formatConcertDate(concert.concertDate)}. Heat Index ${concert.heat.score}/100.`,
  };
}

export default async function ConcertDetailPage({ params }: PageProps) {
  const { id } = await params;
  const repo = getRepo();
  const [concert, reminders] = await Promise.all([
    repo.getConcert(id),
    repo.listReminders(),
  ]);

  if (!concert) notFound();

  const existingReminders = reminders.filter(
    (reminder) => reminder.concertId === concert.id,
  );
  const existingTypes = new Set(
    existingReminders.map((reminder) => reminder.reminderType),
  );

  const reminderOptions = REMINDER_TYPES.flatMap((definition) => {
    if (existingTypes.has(definition.value)) return [];
    if (definition.group === "SALE" && !concert.saleDate) return [];
    const triggerTime = reminderTriggerTime(definition.value, concert);
    if (!triggerTime) return [];
    if (new Date(triggerTime).getTime() <= nowMs()) return [];
    return [
      {
        value: definition.value,
        label: definition.label,
        triggerTime,
      },
    ];
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/concerts"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition hover:text-ink-100"
      >
        <span aria-hidden="true">←</span> Back to concerts
      </Link>

      <header className="card relative overflow-hidden p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-ember-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-ember-400 uppercase">
              {concert.artistName}
            </p>
            <h1 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-ink-100 sm:text-3xl">
              {concert.name}
            </h1>
            <p className="mt-2 text-sm text-ink-300">
              {concert.venueName} · {formatConcertDate(concert.concertDate)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={concert.status} />
              <span className="chip">{concert.ticketPlatform}</span>
              <span className="chip">{concert.showCount} show{concert.showCount === 1 ? "" : "s"}</span>
              <span className="chip">
                {formatPriceRange(concert.minPrice, concert.maxPrice)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <HeatBadge heat={concert.heat} size="lg" showLabel />
            <div className="lg:text-right">
              <StarRating stars={concert.heat.stars} size="lg" />
              <p className="mt-1 text-xs text-ink-400">
                Heat Index {concert.heat.score}/100 ·{" "}
                {concert.heat.label} demand
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="section-title">Concert information</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Info label="Concert date" value={formatConcertDate(concert.concertDate)} />
              <Info label="Ticket sale" value={formatDateTime(concert.saleDate)} />
              <Info
                label="Venue"
                value={`${concert.venue.name} · ${concert.venue.capacity.toLocaleString("en-HK")} seats`}
              />
              <Info label="Platform" value={concert.ticketPlatform} />
              <Info label="Shows" value={`${concert.showCount}`} />
              <Info label="Status" value={<StatusBadge status={concert.status} />} />
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={concert.officialUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-primary"
              >
                Official ticket page
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Ticket prices</h2>
              <span className="text-xs text-ink-400">
                {formatPriceRange(concert.minPrice, concert.maxPrice)}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-ink-800/80">
              {concert.prices.map((price) => (
                <li
                  key={`${price.ticketType}-${price.price}`}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span className="text-ink-300">{price.ticketType}</span>
                  <span className="font-semibold text-ink-100 tabular-nums">
                    {formatPrice(price.price)}
                  </span>
                </li>
              ))}
              {concert.prices.length === 0 ? (
                <li className="py-3 text-sm text-ink-400">
                  Price tiers have not been announced yet.
                </li>
              ) : null}
            </ul>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="card p-5">
              <h2 className="section-title">Heat history</h2>
              <p className="mt-1 text-xs text-ink-400">
                Monthly snapshots of the demand score.
              </p>
              <div className="mt-4">
                <HistoryChart points={concert.history} />
              </div>
            </section>

            <section className="card p-5">
              <h2 className="section-title">Status history</h2>
              <p className="mt-1 text-xs text-ink-400">
                Recorded by the importer when status, sale date or price changes.
              </p>
              <div className="mt-4">
                <SnapshotTimeline snapshots={concert.snapshots} />
              </div>
            </section>
          </div>

          {concert.related.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="section-title">More from {concert.artistName}</h2>
                <p className="mt-1 text-xs text-ink-400">
                  Other concerts by the same artist.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {concert.related.map((related) => (
                  <ConcertCard key={related.id} concert={related} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <section className="card p-5">
            <h2 className="section-title">Heat Index</h2>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-5xl font-semibold text-ink-100 tabular-nums">
                  {concert.heat.score}
                  <span className="text-lg font-medium text-ink-500">/100</span>
                </p>
                <p className="mt-1 text-sm text-ember-400">
                  {concert.heat.label} demand
                </p>
              </div>
              <StarRating stars={concert.heat.stars} size="lg" />
            </div>
            <div className="mt-5">
              <HeatBreakdown heat={concert.heat} />
            </div>
            <p className="mt-4 border-t border-ink-800 pt-3 text-[0.7rem] leading-relaxed text-ink-500">
              Score = historical × 40% + trends × 25% + Music × 20% +
              scarcity × 10% + shows × 5%. Estimates demand, never a resale
              price.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="section-title">Track this concert</h2>
            <div className="mt-4">
              <WatchlistControls
                concertId={concert.id}
                initialStatus={concert.watchStatus}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="section-title">Reminders</h2>
            <p className="mt-1 text-xs text-ink-400">
              Ticket sale and show-day alerts appear in the reminder centre.
            </p>

            {existingReminders.length > 0 ? (
              <ul className="mt-4 divide-y divide-ink-800/80">
                {existingReminders.map((reminder) => {
                  const definition = REMINDER_TYPES.find(
                    (type) => type.value === reminder.reminderType,
                  );
                  return (
                    <li
                      key={reminder.id}
                      className="flex items-start justify-between gap-3 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-medium text-ink-200">
                          {definition?.label ?? reminder.reminderType}
                        </p>
                        <p className="text-[0.7rem] text-ink-500">
                          {formatDateTime(reminder.triggerTime)}
                        </p>
                      </div>
                      <DeleteReminderButton id={reminder.id} />
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="mt-4">
              <ReminderForm
                concertId={concert.id}
                options={reminderOptions}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink-100">{value}</dd>
    </div>
  );
}
