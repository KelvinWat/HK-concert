"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { SearchForm } from "@/components/search-form";
import { ThemeToggle } from "@/components/theme-toggle";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className={clsx("items-center gap-1 text-sm", className)}
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition",
            isActive(pathname, item.href)
              ? "bg-ember-500/15 text-ember-400"
              : "text-ink-300 hover:bg-ink-800 hover:text-ink-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader({ demoMode }: { demoMode: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ember-500/15 text-ember-400 ring-1 ring-ember-500/30">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3c1.5 3.2 4.5 4.6 4.5 8a4.5 4.5 0 0 1-9 0c0-1.3.4-2.4 1.2-3.5.4 1.2 1.1 1.9 1.8 2.2C10.2 7.4 10.8 5 12 3Z" />
                <path d="M8.5 14.5a3.5 3.5 0 0 0 7 0" />
              </svg>
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-ink-100 sm:block">
              HK Concert
              <span className="ml-1 text-ember-400">Tracker</span>
            </span>
            {demoMode ? (
              <span className="chip border-ink-600 text-[0.65rem] uppercase tracking-wider text-ink-300">
                Demo
              </span>
            ) : null}
          </Link>

          <div className="hidden flex-1 justify-end lg:flex">
            <SearchForm className="w-full max-w-xs" compact inputId="header-search-desktop" />
          </div>

          <NavLinks pathname={pathname} className="hidden lg:flex" />

          <ThemeToggle />
        </div>

        <div className="pb-2 lg:hidden">
          <NavLinks
            pathname={pathname}
            className="-mx-4 flex overflow-x-auto px-4 pb-1"
          />
        </div>

        <div className="pb-3 lg:hidden">
          <SearchForm compact inputId="header-search-mobile" />
        </div>
      </div>

      <span className="sr-only">{APP_NAME}</span>
    </header>
  );
}
