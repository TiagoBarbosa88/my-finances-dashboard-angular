-- ============================================================
-- Smart Finances — Seed a partir de db.json
-- Dono: tiagobarbosa.dev@gmail.com
-- UUID: 50b94089-79f2-4a42-893d-be8fe26c26df
-- Rode DEPOIS do schema (SUPABASE-SETUP.md seção 4) e com usuário Auth criado.
-- ============================================================
-- 1) Confirme o profile (deve retornar 1 linha):
SELECT id, email, role FROM public.profiles WHERE id = '50b94089-79f2-4a42-893d-be8fe26c26df';
-- 2) Aborta se o dono não existir (evita user_id NULL):
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM public.profiles WHERE id = '50b94089-79f2-4a42-893d-be8fe26c26df'::uuid;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Profile não encontrado para UUID 50b94089-79f2-4a42-893d-be8fe26c26df. Crie o usuário em Authentication primeiro.';
  END IF;
END $$;
-- 3) Limpa tentativa anterior (descomente se reimportar):
-- DELETE FROM public.transactions WHERE user_id = '50b94089-79f2-4a42-893d-be8fe26c26df'::uuid;
-- (ativos/target_metas usam ON CONFLICT abaixo)
-- ─── Lançamentos (190) ────────────────────────────────────────
INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Sabesp', 'Moradia', 250, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Enel', 'Moradia', 100, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Internet', 'Tecnologia', 150, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Vivo Celular', 'Tecnologia', 80, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Faculdade Giselle', 'Educação', 145, 'pago', 'Giselle'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Garagem', 'Transporte', 200, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-10', 'Pensão', 'Dependentes', 400, 'pago', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Sabesp', 'Moradia', 250, 'pendente', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Enel', 'Moradia', 100, 'pendente', 'Tiago'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Faculdade Giselle', 'Educação', 145, 'pendente', 'Giselle'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-01-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-02-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-03-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-04-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-05-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-04-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-03-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2027-05-21', 'Garagem', 'Transporte', 200, 'pendente', 'Você'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Sabesp', 'Moradia', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Enel', 'Moradia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Faculdade Giselle', 'Educação', 145, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Faculdade Tiago', 'Educação', 318.26, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Seguro Carro', 'Transporte', 271.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-09', 'Tio Luiz', 'Familia', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Vovo Marcos', 'Familia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Yago', 'Familia', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Dentista', 'Saúde', 85, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Nubank Gi', 'Cartao', 377.62, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-09', 'Nubank Ti', 'Cartao', 146.8, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Nubank Gi', 'Cartao', 377.62, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-09', 'Meli Gi', 'Cartao', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-09', 'Meli Ti', 'Cartao', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Dentista', 'Saúde', 85, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Yago', 'Familia', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Facul Giselle', 'Educação', 197.75, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Facul Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-04', 'Facul Giselle', 'Educação', 195, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Facul Tiago', 'Educação', 208.74, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-04', 'Facul Tiago', 'Educação', 318.26, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Seguro Carro', 'Transporte', 276.34, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Seguro Carro', 'Transporte', 442, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Seguro Carro', 'Transporte', 171.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Seguro Carro', 'Transporte', 205.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Seguro Carro', 'Transporte', 166.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Seguro Carro', 'Transporte', 271.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Tiago', 'Salário', 2393, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Tiago', 'Salário', 4885.17, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Tiago', 'Salário', 5057, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Tiago', 'Salário', 2300, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Tiago', 'Salário', 4978.54, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Tiago', 'Salário', 5197.75, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Giselle', 'Salário', 6579.34, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Giselle', 'Salário', 7022.29, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Giselle', 'Salário', 4429.77, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Giselle', 'Salário', 4997.53, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Seguro Carro', 'Transporte', 271.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Giselle', 'Salário', 4997.53, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Giselle', 'Salário', 4997.53, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Facul Giselle', 'Educação', 197.75, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Seguro Carro', 'Transporte', 276.34, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Seguro Carro', 'Transporte', 442, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Seguro Carro', 'Transporte', 171.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Seguro Carro', 'Transporte', 205.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Seguro Carro', 'Transporte', 166.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Seguro Carro', 'Transporte', 271.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Tiago', 'Salário', 2393, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Tiago', 'Salário', 2300, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Tiago', 'Salário', 4885.17, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Tiago', 'Salário', 5057, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Tiago', 'Salário', 4978.54, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Tiago', 'Salário', 5197.75, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Giselle', 'Salário', 6579.34, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Facul Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Facul Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-04', 'Facul Giselle', 'Educação', 195, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-04', 'Facul Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Facul Tiago', 'Educação', 208.74, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-04', 'Facul Tiago', 'Educação', 318.26, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-09', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-04', 'Facul Giselle', 'Educação', 143.46, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-09', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Giselle', 'Salário', 7022.29, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Giselle', 'Salário', 4429.77, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-04', 'Facul Tiago', 'Educação', 318.26, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-04', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Giselle', 'Salário', 6579.34, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-04', 'Facul Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Giselle', 'Salário', 4429.77, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Tiago', 'Salário', 2393, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2025-12-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Tiago', 'Salário', 2300, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salario Giselle', 'Salário', 4800, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Tiago', 'Salário', 4885.17, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salario Giselle', 'Salário', 6579.34, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Tiago', 'Salário', 5057, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Giselle', 'Salário', 7022.29, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Tiago', 'Salário', 4978.54, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Giselle', 'Salário', 4429.77, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Tiago', 'Salário', 5197.75, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Salario Giselle', 'Salário', 4982.73, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-31', 'Salario Tiago', 'Salário', 5000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-31', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-31', 'Salario Tiago', 'Salário', 5000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-30', 'Salario Tiago', 'Salário', 5000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-31', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-30', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-31', 'Salario Tiago', 'Salário', 5000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-31', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-30', 'Salario Tiago', 'Salário', 5000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-30', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salario Giselle', 'Salário', 4997.53, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Tiago', 'Salário', 4978.54, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salario Giselle', 'Salário', 4429.77, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Salario Tiago', 'Salário', 5115, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salario Giselle', 'Salário', 7022.29, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-30', 'Salario Giselle', 'Salário', 4898.09, 'pendente', 'Importação Excel');

-- ─── Carteira — ativos (8) ───────────────────────────────────
INSERT INTO public.ativos (user_id, ticker, tipo, setor, qtd, preco_medio, preco_atual, rentabilidade_pct, score)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'ITUB4', 'Ações', 'Financeiro', 15, 41, 39.87, 0.83, 9),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'TAEE11', 'Ações', 'Energia', 11, 41.48, 39.3, -3.87, 9),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'AESB3', 'Ações', 'Energia', 33, 12.15, 8.12, -31.6, 3),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'SAPR4', 'Ações', 'Saneamento', 23, 8.61, 7.27, 73.45, 7),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'BBAS3', 'Ações', 'Financeiro', 6, 23.37, 19.42, 75.93, 7),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'MGLU3', 'Ações', 'Varejo', 1, 65.53, 4.62, -77.29, 1),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'PCIP11', 'FIIs', 'Papel', 1, 118.29, 80.26, -9.35, 7),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'SPXB11', 'ETFs', 'S&P 500', 21, 15.79, 17.05, 113.53, 9)
ON CONFLICT (user_id, ticker) DO UPDATE SET
  qtd = EXCLUDED.qtd,
  preco_medio = EXCLUDED.preco_medio,
  preco_atual = EXCLUDED.preco_atual,
  rentabilidade_pct = EXCLUDED.rentabilidade_pct,
  score = EXCLUDED.score,
  updated_at = now();

-- ─── Metas de alocação ───────────────────────────────────────
INSERT INTO public.target_metas (user_id, tipo, target_percent)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'Ações', 50),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'FIIs', 25),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'ETFs', 25),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, 'Tesouro Direto', 0)
ON CONFLICT (user_id, tipo) DO UPDATE SET
  target_percent = EXCLUDED.target_percent,
  updated_at = now();

-- db.json "investimentos" (20) são snapshots — não importados para public.investimentos.

SELECT
  (SELECT count(*) FROM public.transactions) AS transactions,
  (SELECT count(*) FROM public.ativos) AS ativos,
  (SELECT count(*) FROM public.target_metas) AS target_metas;