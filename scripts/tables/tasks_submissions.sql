create table public.task_submissions (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  comentario_assistente text null,
  imagem_assistente text null,
  status_validacao text not null default 'pendente'::text,
  feedback_lideranca text null,
  validado_por uuid null,
  validado_em timestamp with time zone null,
  criado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  constraint task_submissions_pkey primary key (id),
  constraint task_submissions_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint task_submissions_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint task_submissions_validado_por_fkey foreign KEY (validado_por) references profiles (id),
  constraint task_submissions_status_validacao_check check (
    (
      status_validacao = any (
        array[
          'pendente'::text,
          'aprovada'::text,
          'devolvida'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;