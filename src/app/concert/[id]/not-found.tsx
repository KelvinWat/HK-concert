import Link from "next/link";

export default function ConcertNotFound() {
  return (
    <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink-100">Concert not found</h1>
      <p className="text-sm text-ink-400">
        This show may have been removed by a data import, or the link is wrong.
      </p>
      <Link href="/concerts" className="btn-primary mt-2">
        Browse concerts
      </Link>
    </div>
  );
}
