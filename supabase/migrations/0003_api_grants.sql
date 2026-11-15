-- HK Concert Tracker — API role grants
--
-- Supabase grants API roles access to new `public` tables through default
-- privileges owned by `postgres`. Migrations applied through the Management API
-- can create tables without those grants, which makes every PostgREST request
-- fail with `permission denied for table <name>` even when the server uses the
-- service role key. Keep this file idempotent so it can be re-run safely.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

alter default privileges in schema public
  grant all privileges on tables to service_role;

alter default privileges in schema public
  grant all privileges on sequences to service_role;
