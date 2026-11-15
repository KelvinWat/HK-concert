import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { isDemoMode } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Hong Kong concert demand tracker`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const demoMode = isDemoMode();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('hk-concert-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}",
          }}
        />
        <div className="flex min-h-screen flex-col">
          <SiteHeader demoMode={demoMode} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-ink-800/80">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>
                {APP_NAME} · Heat Index is an estimate of secondary-market
                demand, not a price prediction.
              </p>
              <p className="flex items-center gap-3">
                <Link className="hover:text-ink-200" href="/ranking">
                  Hot ranking
                </Link>
                <span aria-hidden="true">·</span>
                <span>{demoMode ? "Demo data" : "Supabase"}</span>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
