-- Remove Azure/Microsoft SSO leftovers and switch to matrícula + senha auth
-- (admin cadastra o usuário e define a senha inicial pelo painel)

-- 1. Add password hash column (bcrypt hash, never plaintext)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- 2. Drop Azure-specific columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS microsoft_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS onboarding_completo;

-- 3. matricula becomes the login key: enforce uniqueness and NOT NULL
--    (should already be populated for all existing rows)
ALTER TABLE public.profiles ALTER COLUMN matricula SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_matricula_key UNIQUE (matricula);

-- NOTE: existing rows will have senha_hash = NULL after this migration.
-- Any pre-existing users must have a password set by an admin via the
-- admin panel before they can log in again (authorize() rejects NULL
-- senha_hash on purpose).