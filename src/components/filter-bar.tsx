import Link from "next/link";
import { CONCERT_STATUSES, SORT_OPTIONS } from "@/lib/constants";
import type { FilterOptions } from "@/lib/data/types";

export interface FilterValues {
  q?: string;
  artist?: string;
  venue?: string;
  platform?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
  upcoming?: string;
}

export function FilterBar({
  options,
  values,
  showSort = true,
  showUpcoming = true,
  action = "/concerts",
  resetHref = "/concerts",
}: {
  options: FilterOptions;
  values: FilterValues;
  showSort?: boolean;
  showUpcoming?: boolean;
  action?: string;
  resetHref?: string;
}) {
  return (
    <form
      method="get"
      action={action}
      className="card flex flex-col gap-4 p-4 sm:p-5"
    >
      {values.q ? <input type="hidden" name="q" value={values.q} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="filter-artist">
            Artist
          </label>
          <select
            id="filter-artist"
            name="artist"
            defaultValue={values.artist ?? ""}
            className="select"
          >
            <option value="">All artists</option>
            {options.artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-venue">
            Venue
          </label>
          <select
            id="filter-venue"
            name="venue"
            defaultValue={values.venue ?? ""}
            className="select"
          >
            <option value="">All venues</option>
            {options.venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-platform">
            Platform
          </label>
          <select
            id="filter-platform"
            name="platform"
            defaultValue={values.platform ?? ""}
            className="select"
          >
            <option value="">All platforms</option>
            {options.platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-status">
            Sale status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={values.status ?? ""}
            className="select"
          >
            <option value="">Any status</option>
            {CONCERT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="filter-from">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            name="from"
            defaultValue={values.from ?? ""}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="filter-to">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            name="to"
            defaultValue={values.to ?? ""}
            className="input"
          />
        </div>

        {showSort ? (
          <div>
            <label className="label" htmlFor="filter-sort">
              Sort by
            </label>
            <select
              id="filter-sort"
              name="sort"
              defaultValue={values.sort ?? "date"}
              className="select"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showUpcoming ? (
          <div className="flex items-end pb-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-200">
              <input
                type="checkbox"
                name="upcoming"
                value="1"
                defaultChecked={values.upcoming !== "0"}
                className="size-4 rounded border-ink-600 bg-ink-950 accent-ember-500"
              />
              Upcoming only
            </label>
            <input type="hidden" name="upcoming" value="0" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
        <Link href={resetHref} className="btn-ghost">
          Reset
        </Link>
      </div>
    </form>
  );
}
