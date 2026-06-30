-- WhatsApp: vínculo de telefone, sessões conversacionais e log de mensagens.
-- Rode após 003-workspace-isolation.sql

-- ─── Vínculo telefone ↔ usuário ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_e164            TEXT UNIQUE,
  link_code             TEXT,
  link_code_expires_at  TIMESTAMPTZ,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_links_phone ON public.whatsapp_links(phone_e164);
CREATE INDEX IF NOT EXISTS idx_whatsapp_links_workspace ON public.whatsapp_links(workspace_id);

-- ─── Sessão do orquestrador (state machine) ─────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  phone_e164  TEXT PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  state       TEXT NOT NULL DEFAULT 'idle'
              CHECK (state IN ('idle', 'awaiting_confirm', 'awaiting_link_code', 'linking')),
  draft       JSONB,
  expires_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON public.whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_expires ON public.whatsapp_sessions(expires_at);

-- ─── Log de mensagens (auditoria) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id          BIGSERIAL PRIMARY KEY,
  phone_e164  TEXT NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_log_phone ON public.whatsapp_message_log(phone_e164, created_at DESC);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.whatsapp_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_links_select_own ON public.whatsapp_links;
CREATE POLICY whatsapp_links_select_own ON public.whatsapp_links
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS whatsapp_links_update_own ON public.whatsapp_links;
CREATE POLICY whatsapp_links_update_own ON public.whatsapp_links
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS whatsapp_links_insert_own ON public.whatsapp_links;
CREATE POLICY whatsapp_links_insert_own ON public.whatsapp_links
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS whatsapp_links_delete_own ON public.whatsapp_links;
CREATE POLICY whatsapp_links_delete_own ON public.whatsapp_links
  FOR DELETE USING (user_id = auth.uid());

-- Sessões e log: somente service role (webhook) — sem policy para authenticated

COMMENT ON TABLE public.whatsapp_links IS 'Vínculo WhatsApp E.164 ↔ perfil do workspace';
COMMENT ON TABLE public.whatsapp_sessions IS 'Estado conversacional do orquestrador WhatsApp';
COMMENT ON TABLE public.whatsapp_message_log IS 'Auditoria inbound/outbound WhatsApp';
