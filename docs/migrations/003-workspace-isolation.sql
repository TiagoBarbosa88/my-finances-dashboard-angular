-- Isolamento de equipe por workspace (cada conta Google = admin do próprio espaço).
-- Membros só aparecem se aceitaram convite do admin do workspace.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.profiles(id);

-- Donos de workspace existentes
UPDATE public.profiles SET workspace_id = id WHERE workspace_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN workspace_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON public.profiles(workspace_id);

-- Novo usuário: admin do próprio workspace OU membro via convite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convite_role app_role;
  convite_nome TEXT;
  convite_inviter UUID;
  inviter_workspace UUID;
BEGIN
  SELECT c.role, c.nome, c.invited_by
  INTO convite_role, convite_nome, convite_inviter
  FROM public.convites c
  WHERE lower(c.email) = lower(NEW.email)
    AND c.status = 'pendente'
  ORDER BY c.criado_em DESC
  LIMIT 1;

  IF convite_role IS NOT NULL AND convite_inviter IS NOT NULL THEN
    SELECT COALESCE(p.workspace_id, p.id) INTO inviter_workspace
    FROM public.profiles p
    WHERE p.id = convite_inviter;

    INSERT INTO public.profiles (id, full_name, email, role, workspace_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', convite_nome, split_part(NEW.email, '@', 1)),
      NEW.email,
      convite_role,
      COALESCE(inviter_workspace, convite_inviter)
    );

    UPDATE public.convites
    SET status = 'aceito'
    WHERE lower(email) = lower(NEW.email) AND status = 'pendente';
  ELSE
    INSERT INTO public.profiles (id, full_name, email, role, workspace_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'admin',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Ao aceitar convite (fallback), vincula ao workspace do convidador
CREATE OR REPLACE FUNCTION public.accept_my_invite()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convite_rec RECORD;
  inviter_workspace UUID;
BEGIN
  SELECT c.role, c.invited_by INTO convite_rec
  FROM public.convites c
  WHERE lower(c.email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND c.status = 'pendente'
  ORDER BY c.criado_em DESC
  LIMIT 1;

  IF convite_rec IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(p.workspace_id, p.id) INTO inviter_workspace
  FROM public.profiles p
  WHERE p.id = convite_rec.invited_by;

  UPDATE public.profiles
  SET
    role = convite_rec.role,
    workspace_id = COALESCE(inviter_workspace, convite_rec.invited_by),
    updated_at = now()
  WHERE id = auth.uid();

  UPDATE public.convites
  SET status = 'aceito'
  WHERE lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pendente';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_my_invite() TO authenticated;

-- RLS: perfis — só o próprio workspace
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    workspace_id = (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- RLS: convites — só os enviados pelo seu workspace (via invited_by)
DROP POLICY IF EXISTS "convites_select_authenticated" ON public.convites;
CREATE POLICY "convites_select_authenticated"
  ON public.convites FOR SELECT TO authenticated
  USING (
    invited_by IN (
      SELECT id FROM public.profiles
      WHERE workspace_id = (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Corrigir contas Google que entraram sem convite (devem ser admin do próprio workspace):
-- UPDATE public.profiles SET workspace_id = id, role = 'admin'
-- WHERE email IN ('sellegameplay@gmail.com', 'gisellebarbosadevops@gmail.com');
