create table public.profiles (
  id uuid not null default gen_random_uuid (),
  matricula text not null,
  nome text not null,
  cargo text not null default 'assistente'::text,
  setor_base text null,
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  senha_hash text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_matricula_key unique (matricula),
  constraint profiles_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint profiles_cargo_check check (
    (
      cargo = any (
        array[
          'assistente'::text,
          'supervisão'::text,
          'gerente'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;