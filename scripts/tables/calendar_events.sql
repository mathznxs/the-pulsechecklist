create table public.calendar_events (
  id uuid not null default gen_random_uuid (),
  titulo text not null,
  tipo text not null default 'evento'::text,
  data_inicio date not null,
  data_fim date null,
  criado_por uuid not null,
  criado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  constraint calendar_events_pkey primary key (id),
  constraint calendar_events_criado_por_fkey foreign KEY (criado_por) references profiles (id),
  constraint calendar_events_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint calendar_events_tipo_check check (
    (
      tipo = any (
        array[
          'evento'::text,
          'visita'::text,
          'lancamento'::text,
          'folga'::text,
          'critico'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;