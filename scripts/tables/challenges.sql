create table public.challenges (
  id uuid not null default gen_random_uuid (),
  nome text not null,
  ativa boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  data_inicio date null,
  data_fim date null,
  descricao text null,
  loja_id uuid null,
  constraint challenges_pkey primary key (id),
  constraint challenges_loja_id_fkey foreign KEY (loja_id) references lojas (id)
) TABLESPACE pg_default;