"use client";

import { useEffect } from "react";

export function SearchLogger({ keyword }: { keyword: string }) {
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const key = `hkct:search:${trimmed.toLowerCase()}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be unavailable in private modes.
    }

    void fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: trimmed }),
      keepalive: true,
    }).catch(() => undefined);
  }, [keyword]);

  return null;
}
