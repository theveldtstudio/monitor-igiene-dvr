-- Modulo DVR (pacchetto Monitoraggi + DVR).
-- Solo tabelle nuove con prefisso dvr_: l'app Monitoraggi non le usa e non cambia.
-- Dati usati solo online (niente sync offline): il DVR si redige in ufficio.
-- RLS come il resto del progetto (single-tenant, utenti autenticati): da rivedere con la Fase K1.

-- 1. Anagrafica del cantiere per il DVR (1:1 con cantieri), compilata al primo DVR.
create table public.dvr_anagrafica_cantiere (
  cantiere_id uuid primary key references public.cantieri(id) on delete cascade,
  comune text,
  provincia text,
  opera text,                         -- es. "Linea ferroviaria AV Salerno-Reggio Calabria, Lotto 1A"
  denominazione text,                 -- es. "TBM1"
  impresa text,                       -- consorzio / impresa esecutrice
  datore_lavoro text,
  rspp text,
  medico_competente text,
  rls text[] not null default '{}',
  gruppo_lavoro text[] not null default '{}',
  redatto text,
  verificato text,
  approvato text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Ambiti di lavoro: scelgono testi, metodi e tabelle del documento.
create table public.dvr_ambiti (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in (
    'galleria_tradizionale', 'galleria_tbm', 'viadotto', 'opere_esterne',
    'piazzale', 'officina', 'campo_base', 'uffici'
  )),
  metodo_scavo text check (metodo_scavo in ('esplosivo', 'martellone', 'tbm')),
  descrizione text,                   -- ciclo di lavoro / note sull'ambito
  ordine integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_ambiti_cantiere_idx on public.dvr_ambiti (cantiere_id);

-- 3. Mansioni / gruppi omogenei del cantiere.
create table public.dvr_mansioni (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  nome text not null,
  attivita text,
  attiva boolean not null default true,
  ordine integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_mansioni_cantiere_idx on public.dvr_mansioni (cantiere_id);
create unique index dvr_mansioni_nome_uniq on public.dvr_mansioni (cantiere_id, lower(nome)) where attiva;

-- Storico delle modifiche confermate alle mansioni: serve per le revisioni del DVR.
create table public.dvr_mansioni_modifiche (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  mansione_id uuid references public.dvr_mansioni(id) on delete set null,
  azione text not null check (azione in ('creata', 'modificata', 'disattivata', 'riattivata')),
  prima jsonb,
  dopo jsonb,
  motivo text,
  confermata_da uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index dvr_mansioni_modifiche_cantiere_idx on public.dvr_mansioni_modifiche (cantiere_id, created_at desc);
create index dvr_mansioni_modifiche_mansione_idx on public.dvr_mansioni_modifiche (mansione_id);

-- 4. Macchine e attrezzature per le tabelle del DVR.
create table public.dvr_macchine (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  tipologia text not null,
  marca_modello text,
  alimentazione text,                 -- gommato, cingolato, elettrico...
  ordine integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_macchine_cantiere_idx on public.dvr_macchine (cantiere_id);

-- 5. DPI del cantiere per rischio (dati tecnici in jsonb: per l'udito H, M, L, SNR, beta, ottave).
create table public.dvr_dpi (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  rischio text not null,
  nome text not null,
  dati jsonb not null default '{}',
  attivo boolean not null default true,
  ordine integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_dpi_cantiere_idx on public.dvr_dpi (cantiere_id, rischio);

-- 6. Tarature degli strumenti (catena di misura) citate nei DVR.
create table public.dvr_tarature (
  id uuid primary key default gen_random_uuid(),
  strumento_id uuid references public.strumenti(id) on delete set null,
  componente text not null,           -- fonometro, microfono, preamplificatore, calibratore...
  costruttore text,
  modello text,
  matricola text,
  data_taratura date,
  certificato text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_tarature_strumento_idx on public.dvr_tarature (strumento_id);

-- 7. Documenti DVR: uno per rischio e revisione.
create table public.dvr_documenti (
  id uuid primary key default gen_random_uuid(),
  cantiere_id uuid not null references public.cantieri(id) on delete cascade,
  rischio text not null check (rischio in (
    'rumore', 'vibrazioni', 'microclima', 'chimico', 'cancerogeno', 'fumi_saldatura',
    'roa', 'cem', 'mmc', 'posture', 'amianto', 'ipa', 'biologico', 'acqua'
  )),
  titolo text,
  periodo_riferimento text,           -- es. "Maggio – Giugno 2026"
  ambiti_ids uuid[] not null default '{}',
  campagne_ids uuid[] not null default '{}',
  revisione integer not null default 0,
  integrazione integer,
  stato text not null default 'bozza' check (stato in ('bozza', 'emesso')),
  data_emissione date,
  parametri jsonb not null default '{}',  -- opzioni di calcolo (incertezza, criterio fasce)
  contenuti jsonb not null default '{}',  -- testi modificabili e dati accessori (segnali, impulsività...)
  documento_precedente_id uuid references public.dvr_documenti(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_documenti_cantiere_idx on public.dvr_documenti (cantiere_id, rischio);
create index dvr_documenti_precedente_idx on public.dvr_documenti (documento_precedente_id);

create table public.dvr_revisioni (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.dvr_documenti(id) on delete cascade,
  revisione integer not null,
  integrazione integer,
  data text not null,                 -- come compare nel documento, es. "Luglio 2026"
  descrizione text not null,
  redatto text,
  verificato text,
  approvato text,
  created_at timestamptz not null default now()
);
create index dvr_revisioni_documento_idx on public.dvr_revisioni (documento_id);

-- 8. Mansioni incluse nel documento, con dati propri del rischio (es. vibrazioni/ototossiche per il rumore).
create table public.dvr_documento_mansioni (
  documento_id uuid not null references public.dvr_documenti(id) on delete cascade,
  mansione_id uuid not null references public.dvr_mansioni(id) on delete restrict,
  ordine integer not null default 0,
  dati jsonb not null default '{}',
  primary key (documento_id, mansione_id)
);
create index dvr_documento_mansioni_mansione_idx on public.dvr_documento_mansioni (mansione_id);

-- 9. Matrice dei tempi: righe della TAV (mansione × fase × postazione × minuti) per documento.
create table public.dvr_tempi (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.dvr_documenti(id) on delete cascade,
  mansione_id uuid not null references public.dvr_mansioni(id) on delete restrict,
  ordine integer not null default 0,
  minuti integer not null check (minuti > 0),
  fase text not null,
  postazione text,
  macchine text,
  origine text not null default 'misura' check (origine in ('misura', 'storico', 'convenzionale')),
  misura_id uuid references public.misure(id) on delete set null,
  valori jsonb not null default '{}', -- livelli per storico/convenzionale, es. {"laeq":65}
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dvr_tempi_documento_idx on public.dvr_tempi (documento_id, mansione_id, ordine);
create index dvr_tempi_mansione_idx on public.dvr_tempi (mansione_id);
create index dvr_tempi_misura_idx on public.dvr_tempi (misura_id);

-- updated_at automatico
do $$
declare t text;
begin
  foreach t in array array['dvr_anagrafica_cantiere','dvr_ambiti','dvr_mansioni','dvr_macchine','dvr_dpi','dvr_tarature','dvr_documenti','dvr_tempi']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- RLS: come le altre tabelle del progetto.
do $$
declare t text;
begin
  foreach t in array array['dvr_anagrafica_cantiere','dvr_ambiti','dvr_mansioni','dvr_mansioni_modifiche','dvr_macchine','dvr_dpi','dvr_tarature','dvr_documenti','dvr_revisioni','dvr_documento_mansioni','dvr_tempi']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', 'auth_all_' || t, t);
  end loop;
end $$;
