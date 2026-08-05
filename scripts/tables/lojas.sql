create table public.lojas (
  id uuid not null default gen_random_uuid (),
  numero_loja text not null,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  constraint lojas_pkey primary key (id),
  constraint lojas_numero_loja_key unique (numero_loja)
) TABLESPACE pg_default;