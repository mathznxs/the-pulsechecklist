create table public.scale_days (
  id uuid not null default gen_random_uuid (),
  profile_id uuid not null,
  dia_semana smallint not null,
  setor text null,
  turno_id uuid null,
  loja_id uuid null,
  constraint scale_days_pkey primary key (id),
  constraint scale_days_profile_id_dia_semana_key unique (profile_id, dia_semana),
  constraint scale_days_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint scale_days_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint scale_days_turno_id_fkey foreign KEY (turno_id) references shifts (id),
  constraint scale_days_dia_semana_check check (
    (
      (dia_semana >= 0)
      and (dia_semana <= 6)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_scale_days_profile on public.scale_days using btree (profile_id) TABLESPACE pg_default;