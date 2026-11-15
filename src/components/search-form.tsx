import clsx from "clsx";

export function SearchForm({
  className,
  compact = false,
  defaultValue = "",
  inputId = "search",
}: {
  className?: string;
  compact?: boolean;
  defaultValue?: string;
  inputId?: string;
}) {
  return (
    <form
      action="/concerts"
      method="get"
      role="search"
      className={clsx("flex items-center gap-2", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        Search concerts, artists or venues
      </label>
      <div className="relative flex-1">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={inputId}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search artists, venues or tours"
          className={clsx(
            "input pl-9",
            compact ? "h-9 py-1.5 text-xs" : "h-11",
          )}
        />
      </div>
      {compact ? null : (
        <button type="submit" className="btn-primary h-11 px-5">
          Search
        </button>
      )}
    </form>
  );
}
