create table public.tasks (
  id uuid not null default gen_random_uuid (),
  titulo text not null,
  descricao text null,
  imagem_padrao text null,
  prazo timestamp with time zone not null,
  status text not null default 'pendente'::text,
  setor text null,
  criado_por uuid not null,
  atribuido_para uuid not null,
  criado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  constraint tasks_pkey primary key (id),
  constraint tasks_atribuido_para_fkey foreign KEY (atribuido_para) references profiles (id),
  constraint tasks_criado_por_fkey foreign KEY (criado_por) references profiles (id),
  constraint tasks_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint tasks_status_check check (
    (
      status = any (
        array[
          'pendente'::text,
          'aguardando'::text,
          'concluida'::text,
          'expirada'::text,
          'ressalva'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;