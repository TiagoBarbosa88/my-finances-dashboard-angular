-- ============================================================
-- Smart Finances — Convites: role ao aceitar + consulta
-- Rode no SQL Editor do projeto my-finances
-- ============================================================

-- Ver convites registrados (NÃO aparecem em Authentication → Users)
SELECT id, email, role, status, criado_em, convidado_por
FROM public.convites
ORDER BY criado_em DESC;

-- Ao criar conta, aplicar role do convite pendente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convite_role app_role;
BEGIN
  SELECT c.role INTO convite_role
  FROM public.convites c
  WHERE lower(c.email) = lower(NEW.email)
    AND c.status = 'pendente'
  ORDER BY c.criado_em DESC
  LIMIT 1;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(convite_role, (NEW.raw_user_meta_data->>'role')::app_role, 'leitor')
  );

  IF convite_role IS NOT NULL THEN
    UPDATE public.convites
    SET status = 'aceito'
    WHERE lower(email) = lower(NEW.email) AND status = 'pendente';
  END IF;

  RETURN NEW;
END;
$$;
