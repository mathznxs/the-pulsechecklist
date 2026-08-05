create table public.fixed_schedule (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  setor text not null,
  turno_id uuid not null,
  dias_semana integer[] not null default '{}'::integer[],
  loja_id uuid null,
  constraint fixed_schedule_pkey primary key (id),
  constraint fixed_schedule_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint fixed_schedule_turno_id_fkey foreign KEY (turno_id) references shifts (id),
  constraint fixed_schedule_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;