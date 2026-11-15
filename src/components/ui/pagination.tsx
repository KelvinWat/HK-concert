import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      {page > 1 ? (
        <Link className="btn-secondary px-3 py-1.5 text-xs" href={buildHref(page - 1)}>
          Previous
        </Link>
      ) : null}

      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const showGap = previous !== undefined && candidate - previous > 1;

        return (
          <span key={candidate} className="flex items-center gap-2">
            {showGap ? <span className="text-ink-500">…</span> : null}
            <Link
              href={buildHref(candidate)}
              aria-current={candidate === page ? "page" : undefined}
              className={
                candidate === page
                  ? "btn-primary size-8 px-0 text-xs"
                  : "btn-secondary size-8 px-0 text-xs"
              }
            >
              {candidate}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link className="btn-secondary px-3 py-1.5 text-xs" href={buildHref(page + 1)}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
