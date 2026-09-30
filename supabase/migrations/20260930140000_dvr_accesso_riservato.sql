-- Accesso ai dati DVR solo per gli utenti abilitati.
-- Il progetto Supabase è condiviso tra app Monitoraggi e copia Monitoraggi + DVR:
-- un account creato per la sola app Monitoraggi non deve poter leggere o scrivere le tabelle dvr_*.

create table if not exists public.dvr_utenti (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS attiva e nessuna policy: la tabella non è accessibile dalle API, si gestisce solo da SQL/dashboard.
alter table public.dvr_utenti enable row level security;

create or replace function public.ha_accesso_dvr()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.dvr_utenti where user_id = auth.uid());
$$;

revoke all on function public.ha_accesso_dvr() from public, anon;
grant execute on function public.ha_accesso_dvr() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['dvr_anagrafica_cantiere','dvr_ambiti','dvr_mansioni','dvr_mansioni_modifiche','dvr_macchine','dvr_dpi','dvr_tarature','dvr_documenti','dvr_revisioni','dvr_documento_mansioni','dvr_tempi']
  loop
    execute format('drop policy if exists %I on public.%I', 'auth_all_' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.ha_accesso_dvr())) with check ((select public.ha_accesso_dvr()))', 'dvr_abilitati_' || t, t);
  end loop;
end $$;

-- Utenti abilitati al DVR: Davide.
insert into public.dvr_utenti (user_id)
select id from auth.users where email = 'davidebettini98@gmail.com'
on conflict do nothing;
