create table public.temporary_schedule (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  setor text not null,
  data date not null,
  turno_id uuid not null,
  criado_por uuid not null,
  loja_id uuid null,
  constraint temporary_schedule_pkey primary key (id),
  constraint temporary_schedule_criado_por_fkey foreign KEY (criado_por) references profiles (id),
  constraint temporary_schedule_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint temporary_schedule_turno_id_fkey foreign KEY (turno_id) references shifts (id),
  constraint temporary_schedule_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;