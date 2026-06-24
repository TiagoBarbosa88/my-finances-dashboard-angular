-- ============================================================
-- Smart Finances — Adicionar sellegameplay@gmail.com (Giselle)
-- Projeto: my-finances (sakwtegkqzgpphmcsrac)
-- ============================================================
--
-- ⚠️  IMPORTANTE: SQL sozinho NÃO cria senha de login.
--     O login (e-mail + senha) vem da tabela auth.users, não de public.profiles.
--     Se só rodar os INSERTs abaixo, o app mostrará "E-mail ou senha incorretos".
--
-- ============================================================
-- OPÇÃO A — Dashboard Supabase (criar usuário COM senha)
-- ============================================================
--   1. Authentication → Users → Add user → Create new user
--   2. Preencha:
--        E-mail:     sellegameplay@gmail.com
--        Password:   SmartFinances2026!
--        Confirm:    SmartFinances2026!
--   3. Marque: Auto Confirm User = ON
--   4. User Metadata (JSON):
--        { "full_name": "Giselle", "role": "leitor" }
--   5. Save user
--   6. Rode os blocos "3)" e "4)" deste arquivo (profile + convite)
--   7. Login no app: sellegameplay@gmail.com / SmartFinances2026!
--
-- ============================================================
-- OPÇÃO A2 — Usuário já existe mas senha não funciona
-- ============================================================
--   Authentication → Users → sellegameplay@gmail.com
--   → três pontos (⋯) → Send password recovery
--   OU → Update user → defina nova Password + Auto Confirm User ON
--
-- ============================================================
-- OPÇÃO B — Script local (cria Auth + profile + senha de uma vez)
-- ============================================================
--   node scripts/add-supabase-user.mjs ^
--     --email=sellegameplay@gmail.com ^
--     --nome=Giselle ^
--     --role=leitor ^
--     --password=SmartFinances2026!
--
--   (No PowerShell use `^` ou quebra de linha; no bash use `\`)
--
-- ============================================================

-- 1) Ver Auth + profile
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmado,
  u.encrypted_password IS NOT NULL AS tem_senha,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sellegameplay@gmail.com');

-- Se retornar 0 linhas → usuário NÃO existe no Auth. Use Opção A ou B acima.
-- Se tem_senha = false → defina senha no Dashboard (Opção A2).

-- 2) Profile (se Auth existe mas profile não)
-- Substitua COLE_O_UUID pelo id do passo 1:
/*
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  'COLE_O_UUID_AQUI'::uuid,
  'Giselle',
  'sellegameplay@gmail.com',
  'leitor'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();
*/

-- 3) Convite como aceito (histórico da equipe)
UPDATE public.convites
SET nome = 'Giselle', role = 'leitor', status = 'aceito', convidado_por = 'tiagobarbosa.dev'
WHERE lower(email) = lower('sellegameplay@gmail.com');

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
  AND NOT EXISTS (
    SELECT 1 FROM public.convites c
    WHERE lower(c.email) = lower('sellegameplay@gmail.com')
  )
LIMIT 1;

-- 4) Conferir
SELECT id, full_name, email, role FROM public.profiles
WHERE lower(email) = lower('sellegameplay@gmail.com');

SELECT id, nome, email, role, status FROM public.convites
WHERE lower(email) = lower('sellegameplay@gmail.com');

-- 5) Credenciais para teste no app (após Opção A ou B)
-- E-mail: sellegameplay@gmail.com
-- Senha:  SmartFinances2026!
-- Depois altere em: Configurações → Minha Conta → Alterar senha
