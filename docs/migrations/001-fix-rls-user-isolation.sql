-- Isolamento de dados financeiros por usuário.
-- Rode no SQL Editor do Supabase (substitui políticas SELECT permissivas).

DROP POLICY IF EXISTS "transactions_select_authenticated" ON public.transactions;
CREATE POLICY "transactions_select_authenticated"
  ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "ativos_select_authenticated" ON public.ativos;
CREATE POLICY "ativos_select_authenticated"
  ON public.ativos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "investimentos_select_authenticated" ON public.investimentos;
CREATE POLICY "investimentos_select_authenticated"
  ON public.investimentos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "target_metas_select_authenticated" ON public.target_metas;
CREATE POLICY "target_metas_select_authenticated"
  ON public.target_metas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
