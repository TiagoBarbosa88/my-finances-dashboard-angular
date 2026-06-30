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
-- ─── Lançamentos (206) ────────────────────────────────────────
INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-01', 'Nubank Giselle', 'Outros', 104, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-01', 'Santander', 'Outros', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-01', 'Yago', 'Dependentes', 50, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-03', 'Riachuelo', 'Outros', 95.39, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Faculdade Giselle', 'Educação', 197.75, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Faculdade Tiago', 'Educação', 208.74, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-05', 'Seguro carro', 'Transporte', 276.34, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-10', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-10', 'Meli Tiago', 'Outros', 210.7, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-10', 'Nubank Tiago', 'Outros', 401.73, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-15', 'Empréstimo', 'Outros', 605, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-27', 'Cartão Itaú', 'Outros', 3654.14, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-30', 'William', 'Dependentes', 350, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Décimo Terceiro', 'Décimo Terceiro', 2005, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Renda Extra', 'Renda Extra', 2005, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salário Giselle', 'Salário', 4800, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-01-31', 'Salário Tiago', 'Salário', 2393, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-01', 'Nubank Giselle', 'Outros', 70, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-01', 'Santander', 'Outros', 299.4, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-01', 'Yago', 'Dependentes', 50, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-03', 'Riachuelo', 'Outros', 95.39, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-05', 'Faculdade Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-05', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-05', 'Seguro carro', 'Transporte', 442, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-10', 'Internet', 'Tecnologia', 99.9, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-10', 'Meli Tiago', 'Outros', 210.7, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-10', 'Nubank Tiago', 'Outros', 377.3, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-10', 'Tio Luiz', 'Dependentes', 230, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-15', 'Empréstimo', 'Outros', 605, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-15', 'Manutenção carro', 'Transporte', 175, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-27', 'Cartão Itaú', 'Outros', 3495, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salário Giselle', 'Salário', 4800, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-28', 'Salário Tiago', 'Salário', 2300, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-02-30', 'William', 'Dependentes', 350, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-01', 'Nubank Giselle', 'Outros', 2533.85, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-01', 'Vovô Marcos', 'Dependentes', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-01', 'Yago', 'Dependentes', 105, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-05', 'Faculdade Giselle', 'Educação', 143.46, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-05', 'Garagem', 'Transporte', 170, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-05', 'Seguro carro', 'Transporte', 171.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-10', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-10', 'Meli Tiago', 'Outros', 233.18, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-10', 'Nubank Tiago', 'Outros', 169.79, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-10', 'Tio Luiz', 'Dependentes', 250, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-15', 'Outros/Lazer', 'Lazer', 3115.61, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-27', 'Cartão Itaú', 'Outros', 4196.34, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-28', 'Aporte investimentos Giselle', 'Investimento', 10350, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-28', 'Aporte investimentos Tiago', 'Investimento', 2000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-30', 'William', 'Dependentes', 350, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'PLR', 'Bônus', 11490.19, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Renda Extra', 'Renda Extra', 11490.19, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salário Giselle', 'Salário', 6579.34, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-03-31', 'Salário Tiago', 'Salário', 4885.17, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-01', 'Nubank Giselle', 'Outros', 333.53, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-01', 'Vovô Marcos', 'Dependentes', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-01', 'Yago', 'Dependentes', 50, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-05', 'Faculdade Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-05', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-05', 'Seguro carro', 'Transporte', 205.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-10', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-10', 'Meli Tiago', 'Outros', 324.17, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-10', 'Nubank Tiago', 'Outros', 119.05, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-10', 'Tio Luiz', 'Dependentes', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-15', 'Manutenção carro', 'Transporte', 1183.07, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-15', 'Outros/Lazer', 'Lazer', 101.38, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-27', 'Cartão Itaú', 'Outros', 3354.69, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-28', 'Aporte investimentos Giselle', 'Investimento', 758, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-28', 'Aporte investimentos Tiago', 'Investimento', 14725, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Décimo Terceiro', 'Décimo Terceiro', 28426.73, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Férias', 'Férias', 6584.33, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Renda Extra', 'Renda Extra', 35011.06, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salário Giselle', 'Salário', 7022.29, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'Salário Tiago', 'Salário', 5057, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-04-30', 'William', 'Dependentes', 20350, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-01', 'Dentista', 'Dependentes', 85, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-01', 'Nubank Giselle', 'Outros', 325.54, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-01', 'Vovô Marcos', 'Dependentes', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-01', 'Yago', 'Dependentes', 50, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-05', 'Faculdade Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-05', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-05', 'Seguro carro', 'Transporte', 166.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-10', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-10', 'Meli Tiago', 'Outros', 133.76, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-10', 'Nubank Tiago', 'Outros', 120, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-10', 'Tio Luiz', 'Dependentes', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-27', 'Cartão Itaú', 'Outros', 4330.07, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-28', 'Aporte investimentos Giselle', 'Investimento', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-28', 'Aporte investimentos Tiago', 'Investimento', 2250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salário Giselle', 'Salário', 4429.77, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-05-31', 'Salário Tiago', 'Salário', 4978.54, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-01', 'Nubank Giselle', 'Outros', 377.62, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-01', 'Vovô Marcos', 'Dependentes', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-01', 'Yago', 'Dependentes', 50, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Faculdade Giselle', 'Educação', 145, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Faculdade Tiago', 'Educação', 318.26, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-05', 'Seguro carro', 'Transporte', 271.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-10', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-10', 'Meli Tiago', 'Outros', 133.76, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-10', 'Nubank Tiago', 'Outros', 146.8, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-10', 'Tio Luiz', 'Dependentes', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-15', 'Outros/Lazer', 'Lazer', 1000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-27', 'Cartão Itaú', 'Outros', 3938.83, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Décimo Terceiro', 'Décimo Terceiro', 3181.35, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Renda Extra', 'Renda Extra', 3181.35, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Salário Giselle', 'Salário', 4997.53, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-06-30', 'Salário Tiago', 'Salário', 5197.75, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-01', 'Água', 'Moradia', 138.93, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-01', 'Luz', 'Moradia', 241.75, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-01', 'Nubank Giselle', 'Outros', 412, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-01', 'Vovô Marcos', 'Dependentes', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-01', 'Yago', 'Dependentes', 94, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-05', 'Faculdade Giselle', 'Educação', 197.75, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-05', 'Faculdade Tiago', 'Educação', 107, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-05', 'Garagem', 'Transporte', 200, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-05', 'Seguro carro', 'Transporte', 214.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-10', 'Internet', 'Tecnologia', 100, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-10', 'Meli Giselle', 'Outros', 63.5, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-10', 'Meli Tiago', 'Outros', 133.76, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-10', 'Nubank Tiago', 'Outros', 235.95, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-10', 'Tio Luiz', 'Dependentes', 250, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-27', 'Cartão Itaú', 'Outros', 3655.53, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-31', 'Renda Extra', 'Renda Extra', 4000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-31', 'Salário Giselle', 'Salário', 4982.73, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-07-31', 'Salário Tiago', 'Salário', 5115, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-01', 'Nubank Giselle', 'Outros', 403.33, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-01', 'Vovô Marcos', 'Dependentes', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-01', 'Yago', 'Dependentes', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-05', 'Faculdade Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-05', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-05', 'Seguro carro', 'Transporte', 241.58, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-10', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-10', 'Meli Giselle', 'Outros', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-10', 'Meli Tiago', 'Outros', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-10', 'Nubank Tiago', 'Outros', 110, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-10', 'Tio Luiz', 'Dependentes', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-27', 'Cartão Itaú', 'Outros', 2500, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-31', 'Salário Giselle', 'Salário', 4898.09, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-08-31', 'Salário Tiago', 'Salário', 5000, 'pago', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-01', 'Nubank Giselle', 'Outros', 290, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-01', 'Vovô Marcos', 'Dependentes', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-01', 'Yago', 'Dependentes', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-05', 'Faculdade Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-05', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-05', 'Seguro carro', 'Transporte', 241.58, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-10', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-10', 'Meli Giselle', 'Outros', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-10', 'Meli Tiago', 'Outros', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-10', 'Nubank Tiago', 'Outros', 110, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-10', 'Tio Luiz', 'Dependentes', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-27', 'Cartão Itaú', 'Outros', 2000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-30', 'Salário Giselle', 'Salário', 4898.09, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-09-30', 'Salário Tiago', 'Salário', 5000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-01', 'Vovô Marcos', 'Dependentes', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-01', 'Yago', 'Dependentes', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-05', 'Faculdade Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-05', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-05', 'Seguro carro', 'Transporte', 241.58, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-10', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-10', 'Meli Giselle', 'Outros', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-10', 'Meli Tiago', 'Outros', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-10', 'Nubank Tiago', 'Outros', 110, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-10', 'Tio Luiz', 'Dependentes', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-27', 'Cartão Itaú', 'Outros', 2000, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-31', 'Renda Extra', 'Renda Extra', 20000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-31', 'Salário Giselle', 'Salário', 4898.09, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-10-31', 'Salário Tiago', 'Salário', 5000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-01', 'Vovô Marcos', 'Dependentes', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-01', 'Yago', 'Dependentes', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-05', 'Faculdade Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-05', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-05', 'Seguro carro', 'Transporte', 241.58, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-10', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-10', 'Meli Giselle', 'Outros', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-10', 'Meli Tiago', 'Outros', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-10', 'Nubank Tiago', 'Outros', 110, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-10', 'Tio Luiz', 'Dependentes', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-27', 'Cartão Itaú', 'Outros', 1500, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-30', 'Salário Giselle', 'Salário', 4898.09, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-11-30', 'Salário Tiago', 'Salário', 5000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-01', 'Vovô Marcos', 'Dependentes', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-01', 'Yago', 'Dependentes', 50, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-05', 'Faculdade Giselle', 'Educação', 190, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-05', 'Garagem', 'Transporte', 200, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-05', 'Seguro carro', 'Transporte', 241.58, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-10', 'Internet', 'Tecnologia', 100, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-10', 'Meli Giselle', 'Outros', 63.5, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-10', 'Meli Tiago', 'Outros', 133.76, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-10', 'Nubank Tiago', 'Outros', 110, 'pendente', 'Importação Excel');

INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)
VALUES
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-10', 'Tio Luiz', 'Dependentes', 250, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-27', 'Cartão Itaú', 'Outros', 1500, 'pendente', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-31', 'Décimo Terceiro', 'Décimo Terceiro', 4000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-31', 'Renda Extra', 'Renda Extra', 4000, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-31', 'Salário Giselle', 'Salário', 4898.09, 'pago', 'Importação Excel'),
  ('50b94089-79f2-4a42-893d-be8fe26c26df'::uuid, '2026-12-31', 'Salário Tiago', 'Salário', 5000, 'pago', 'Importação Excel');

-- ─── Carteira — ativos (0) ───────────────────────────────────
-- (nenhum ativo no db.json — carteira vazia)

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