create table public.announcements (
  id uuid not null default gen_random_uuid (),
  message text not null,
  ativo boolean not null default true,
  criado_por uuid null,
  criado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  constraint announcements_pkey primary key (id),
  constraint announcements_criado_por_fkey foreign KEY (criado_por) references profiles (id),
  constraint announcements_loja_id_fkey foreign KEY (loja_id) references lojas (id)
) TABLESPACE pg_default;
