import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getDemoRepo } from "@/lib/data/demo-repo";
import type { DataRepo } from "@/lib/data/repo";
import { SupabaseRepo } from "@/lib/data/supabase-repo";

let supabaseRepo: SupabaseRepo | null = null;

export function getRepo(): DataRepo {
  if (isSupabaseConfigured()) {
    supabaseRepo ??= new SupabaseRepo(getSupabaseAdmin());
    return supabaseRepo;
  }
  return getDemoRepo();
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
