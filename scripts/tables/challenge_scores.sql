create table public.challenge_scores (
  id uuid not null default gen_random_uuid (),
  challenge_id uuid not null,
  user_id uuid not null,
  pontos integer not null default 0,
  atualizado_em timestamp with time zone not null default now(),
  loja_id uuid null,
  constraint challenge_scores_pkey primary key (id),
  constraint challenge_scores_challenge_id_user_id_key unique (challenge_id, user_id),
  constraint challenge_scores_challenge_id_fkey foreign KEY (challenge_id) references challenges (id) on delete CASCADE,
  constraint challenge_scores_loja_id_fkey foreign KEY (loja_id) references lojas (id),
  constraint challenge_scores_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;