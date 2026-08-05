create table public.shifts (
  id uuid not null default gen_random_uuid (),
  nome text not null,
  hora_inicio time without time zone not null,
  hora_fim time without time zone not null,
  loja_id uuid null,
  constraint shifts_pkey primary key (id),
  constraint shifts_loja_id_fkey foreign KEY (loja_id) references lojas (id)
) TABLESPACE pg_default;