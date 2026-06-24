-- ============================================================
-- Smart Finances — Adicionar sellegameplay@gmail.com (Giselle)
-- Projeto: my-finances (sakwtegkqzgpphmcsrac)
-- ============================================================
--
-- OPÇÃO A (recomendada): Dashboard Supabase
--   Authentication → Users → Add user → Create new user
--   E-mail: sellegameplay@gmail.com
--   Senha: (defina uma temporária, ex. SmartFinances2026!)
--   Auto Confirm User: ON
--   User Metadata (JSON):
--     { "full_name": "Giselle", "role": "leitor" }
--
-- Depois rode o bloco "2)" abaixo se o profile não aparecer sozinho.
--
-- OPÇÃO B: script local (com .env configurado)
--   node scripts/add-supabase-user.mjs --email=sellegameplay@gmail.com --nome=Giselle --role=leitor --password=SmartFinances2026!
-- ============================================================

-- 1) Ver se já existe no Auth / profiles
SELECT u.id, u.email, u.email_confirmed_at, p.full_name, p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sellegameplay@gmail.com');

-- 2) Se o usuário existe no Auth mas SEM profile — cole o UUID do passo 1:
-- INSERT INTO public.profiles (id, full_name, email, role)
-- VALUES (
--   'COLE_O_UUID_AQUI'::uuid,
--   'Giselle',
--   'sellegameplay@gmail.com',
--   'leitor'
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   full_name = EXCLUDED.full_name,
--   email = EXCLUDED.email,
--   role = EXCLUDED.role,
--   updated_at = now();

-- 3) Registrar convite como aceito (opcional — equipe / histórico)
INSERT INTO public.convites (nome, email, role, status, convidado_por, invited_by)
SELECT
  'Giselle',
  'sellegameplay@gmail.com',
  'leitor'::app_role,
  'aceito',
  'tiagobarbosa.dev',
  p.id
FROM public.profiles p
WHERE lower(p.email) LIKE 'tiagobarbosa.dev%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Se não houver UNIQUE em convites.email, use UPDATE:
UPDATE public.convites
SET nome = 'Giselle', role = 'leitor', status = 'aceito'
WHERE lower(email) = lower('sellegameplay@gmail.com');

-- 4) Conferir resultado
SELECT id, full_name, email, role FROM public.profiles
WHERE lower(email) = lower('sellegameplay@gmail.com');

SELECT id, nome, email, role, status FROM public.convites
WHERE lower(email) = lower('sellegameplay@gmail.com');
