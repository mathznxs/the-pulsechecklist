-- Reintroduz o cargo 'supervisão' como distinto de 'gerente'
-- e ajusta a constraint de cargo em public.profiles

BEGIN;

-- 1. Atualizar CHECK constraint para permitir 'supervisão'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_cargo_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cargo_check
  CHECK (cargo IN ('assistente', 'supervisão', 'gerente'));

COMMIT;

