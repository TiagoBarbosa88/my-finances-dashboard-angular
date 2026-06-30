-- ============================================================
-- Smart Finances — Convites + workspace (substitui handle_new_user antigo)
-- Rode no SQL Editor APÓS migrations/003-workspace-isolation.sql
-- ============================================================

ALTER TABLE public.convites ADD COLUMN IF NOT EXISTS nome TEXT;

-- Ver convites do seu workspace (após migration 003)
-- SELECT * FROM public.convites WHERE invited_by = auth.uid();

-- handle_new_user e accept_my_invite: ver docs/migrations/003-workspace-isolation.sql

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND id != auth.uid()
    AND workspace_id = (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
  );
