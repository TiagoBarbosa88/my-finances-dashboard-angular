# Guia Supabase — Smart Finances (Angular)

Este documento descreve **como conectar o projeto ao Supabase**, criar o banco com **RLS**, migrar gradualmente do **JSON Server** (`localhost:3000`) e ativar **Auth + papéis** (Admin / Editor / Leitor) sem quebrar o dashboard.

> **Importante:** o Cursor **não** acessa sua conta Supabase. Você roda o SQL manualmente no **SQL Editor** do painel. Depois disso, o Cursor ajuda a trocar `HttpClient` por `supabase-js`.

---

## O que este guia cobre

| Tópico | Conteúdo |
|--------|----------|
| **Credenciais** | Fluxo `.env` → `environment.ts` (sem commitar secrets) |
| **Painel Supabase** | Projeto, Auth e-mail, usuários de teste |
| **Schema SQL** | Tabelas espelhando os models Angular + RLS |
| **Mapa de migração** | `db.json` → tabelas Supabase |
| **Estado atual do código** | O que já funciona vs. o que falta |
| **Plano em 5 fases** | Migração incremental com prompts prontos para o Cursor |
| **Investimentos** | `score`, metas de alocação, semáforo de sugestão |
| **Brapi** | Permanece no frontend (não passa pelo Supabase) |

---

## 1. Estado atual do projeto

| Área | Status | Arquivo principal |
|------|--------|-------------------|
| SDK Supabase | ✅ Instalado | `@supabase/supabase-js` |
| Cliente + Auth | ✅ Parcial | `src/app/core/services/supabase.service.ts` |
| `.env` + sync | ✅ Pronto | `scripts/sync-environment.mjs` |
| CRUD `transactions` | ✅ Parcial no service | `SupabaseService` |
| `FinanceService` → Supabase | ⚠️ Só update/status | Ainda carrega via JSON Server |
| `AuthService` (papéis) | ⚠️ Mock JSON | `usuarios` em `db.json` |
| `authGuard` | ⚠️ Desativado | Comentado em `app.routes.ts` |
| `bypassAuth` | ✅ `true` no `.env` | Modo dev sem login |
| Carteira / ativos | ❌ JSON Server | `ativos`, `investimentos` |
| Metas de alocação | ⚠️ `localStorage` | `TARGET_METAS_STORAGE_KEY` |
| Score + semáforo | ✅ Frontend | Calculado no `FinanceService` |
| Cotações Brapi | ✅ Externo | `StockService` — token no `.env` |
| Equipe / convites | ❌ JSON Server | `usuarios`, `convites` |

---

## 2. Configurar credenciais (`.env`)

### 2.1 Copiar template

```bash
cp .env.example .env
npm run env:sync
```

### 2.2 Preencher no `.env`

| Variável | Uso | Vai pro Angular? |
|----------|-----|------------------|
| `SUPABASE_URL` | URL do projeto | ✅ |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública (publishable / anon) | ✅ |
| `SUPABASE_JWKS_URL` | JWKS para validação JWT (futuro backend) | ✅ (metadado) |
| `SUPABASE_SECRET_KEY` | Service / secret key | ❌ **nunca** no bundle |
| `BRAPI_TOKEN` | Cotações | ✅ |
| `API_URL` | JSON Server local | ✅ |
| `BYPASS_AUTH` | `true` = sem login | ✅ |

Exemplo:

```env
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_JWKS_URL=https://SEU_PROJECT_ID.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_SECRET_KEY=sb_secret_...   # só servidor / Edge Functions

API_URL=http://localhost:3000
BRAPI_TOKEN=sua_chave_brapi
BYPASS_AUTH=true
```

O script gera `src/environments/environment.ts` (gitignored):

```typescript
supabase: {
  url:            '...',
  publishableKey: '...',
  jwksUrl:        '...',
},
```

**Segurança:** `.env` e `environment.ts` estão no `.gitignore`. Rotacione chaves se já foram expostas no GitHub.

---

## 3. Passo a passo — Painel Supabase

### 3.1 Criar projeto

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Anote **Project URL** e **Publishable key** (Settings → API)

### 3.2 Auth por e-mail

1. **Authentication → Providers → Email** → ativar
2. Para testes: desative **Confirm email** (reativar em produção)
3. **Authentication → Users → Add user** — crie:

| E-mail | Papel no app | Senha |
|--------|--------------|-------|
| tiago@email.com | admin | (você define) |
| giselle@email.com | editor | (você define) |
| marina@email.com | leitor | (você define) |

### 3.2.1 Login com Google (OAuth)

1. **Google Cloud Console** → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web)
2. **Authorized redirect URI:** `https://SEU_PROJECT_ID.supabase.co/auth/v1/callback`
3. **Supabase Dashboard** → Authentication → Providers → **Google** → Enable
4. Cole **Client ID** e **Client Secret** do Google
5. **Authentication → URL Configuration:**
   - **Site URL:** `https://smart-finances-psi.vercel.app` (prod) e `http://localhost:4200` (dev)
   - **Redirect URLs:** `http://localhost:4200/**`, `https://smart-finances-psi.vercel.app/**`
6. No app: botão **Continuar com Google** na login chama `signInWithOAuth({ provider: 'google' })`
7. Após redirect para `/`, o `landingGuard` processa `?code=` ou `#access_token=` (mesmo fluxo de convite)

**Troubleshooting:** redirect errado → confira Site URL e Redirect URLs no Supabase; URI do Google deve ser exatamente `…/auth/v1/callback`.

### 3.2.2 Isolamento de equipe (workspace)

Cada conta Google nova vira **admin do próprio workspace**. Outros usuários só aparecem em **Equipe** se aceitaram **seu convite**.

Rode [`docs/migrations/003-workspace-isolation.sql`](migrations/003-workspace-isolation.sql).

Para corrigir contas que entraram sozinhas e aparecem na equipe de outra pessoa:

```sql
UPDATE public.profiles SET workspace_id = id, role = 'admin'
WHERE email IN ('email@gmail.com');
```

### 3.2.3 Isolamento de dados financeiros (RLS)

Se uma conta nova enxergar lançamentos de outro usuário, rode no SQL Editor:

1. [`docs/migrations/001-fix-rls-user-isolation.sql`](migrations/001-fix-rls-user-isolation.sql) — restringe `SELECT` por `user_id`
2. [`docs/migrations/002-reset-financial-data.sql`](migrations/002-reset-financial-data.sql) — zera transações/carteira (mantém `profiles`)
3. Reimporte seed (abaixo) só na **sua** conta principal

### 3.2.4 Importar planilha 2026

```bash
npm run import:planilha
npm run validate:planilha   # confere 100% com a planilha
npm run seed:sql -- --email=SEU_EMAIL --uuid=SEU_UUID
```

Cole `docs/supabase-seed.sql` no SQL Editor. Novos usuários Google começam com painel vazio (sem seed compartilhado).

### 3.3 Rodar o SQL (seção 4)

1. **SQL Editor → New query**
2. Cole o script completo da **seção 4**
3. **Run**
4. Confira em **Table Editor**

### 3.4 Sincronizar perfis com Auth

Após criar usuários no Auth, insira/atualize `profiles` (ver seção 4.3) ou use o trigger automático do script.

### 3.5 Ativar Auth no Angular (quando pronto)

1. `.env` → `BYPASS_AUTH=false` → `npm run env:sync`
2. `src/app/app.routes.ts` → descomente `canActivate: [authGuard]` na rota pai `''`
3. Teste: `/login` → entrar → redireciona para `/`

---

## 4. Script SQL completo

Reflete os models Angular: `Transaction`, `Ativo`, `Investimento`, equipe, convites, metas e **RLS** por papel.

```sql
-- ============================================================
-- My Finances Dash — Schema inicial + RLS
-- Rode UMA vez no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Papéis ─────────────────────────────────────────────────
CREATE TYPE app_role AS ENUM ('admin', 'editor', 'leitor');

-- ─── Perfis (1:1 com auth.users) ───────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        app_role NOT NULL DEFAULT 'leitor',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: criar profile ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'leitor')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: papel do usuário logado
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() = 'admin';
$$;

-- ─── Lançamentos (despesas/receitas) ───────────────────────
CREATE TABLE public.transactions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  descricao   TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  valor       NUMERIC(14, 2) NOT NULL CHECK (valor >= 0),
  status      TEXT NOT NULL CHECK (status IN ('pago', 'pendente')),
  criado_por  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_data ON public.transactions(user_id, data DESC);

-- ─── Carteira — posições ────────────────────────────────────
CREATE TABLE public.ativos (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker            TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('Ações', 'FIIs', 'ETFs', 'Tesouro Direto')),
  setor             TEXT NOT NULL DEFAULT '',
  qtd               NUMERIC(18, 6) NOT NULL DEFAULT 0,
  preco_medio       NUMERIC(14, 4) NOT NULL DEFAULT 0,
  preco_atual       NUMERIC(14, 4) NOT NULL DEFAULT 0,
  rentabilidade_pct NUMERIC(8, 2),
  score             SMALLINT CHECK (score >= 0 AND score <= 10),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

-- ─── Lançamentos de compra/venda ────────────────────────────
CREATE TABLE public.investimentos (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  operacao      TEXT NOT NULL CHECK (operacao IN ('compra', 'venda')),
  tipo          TEXT NOT NULL,
  ticker        TEXT NOT NULL,
  setor         TEXT NOT NULL DEFAULT '',
  data          DATE NOT NULL,
  quantidade    NUMERIC(18, 6) NOT NULL,
  preco         NUMERIC(14, 4) NOT NULL,
  outros_custos NUMERIC(14, 2) NOT NULL DEFAULT 0,
  valor_total   NUMERIC(14, 2) NOT NULL,
  score         SMALLINT CHECK (score >= 0 AND score <= 10),
  criado_por    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Metas de alocação por classe ───────────────────────────
CREATE TABLE public.target_metas (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  target_percent  NUMERIC(5, 2) NOT NULL CHECK (target_percent >= 0 AND target_percent <= 100),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);

-- ─── Convites de equipe ─────────────────────────────────────
CREATE TABLE public.convites (
  id             BIGSERIAL PRIMARY KEY,
  nome           TEXT,
  email          TEXT NOT NULL,
  role           app_role NOT NULL DEFAULT 'leitor',
  status         TEXT NOT NULL CHECK (status IN ('pendente', 'aceito', 'expirado')),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  convidado_por  TEXT NOT NULL,
  invited_by     UUID REFERENCES public.profiles(id)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_metas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites      ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- transactions
CREATE POLICY "transactions_select_authenticated"
  ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "transactions_insert_editor_admin"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    public.current_role() IN ('admin', 'editor')
    AND user_id = auth.uid()
  );

CREATE POLICY "transactions_update_own_or_admin"
  ON public.transactions FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  );

CREATE POLICY "transactions_delete_own_or_admin"
  ON public.transactions FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  );

-- ativos
CREATE POLICY "ativos_select_authenticated"
  ON public.ativos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ativos_write_editor_admin"
  ON public.ativos FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  );

-- investimentos
CREATE POLICY "investimentos_select_authenticated"
  ON public.investimentos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "investimentos_write_editor_admin"
  ON public.investimentos FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  );

-- target_metas
CREATE POLICY "target_metas_select_authenticated"
  ON public.target_metas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "target_metas_write_editor_admin"
  ON public.target_metas FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR (public.current_role() = 'editor' AND user_id = auth.uid())
  );

-- convites (somente admin)
CREATE POLICY "convites_select_authenticated"
  ON public.convites FOR SELECT TO authenticated USING (true);

CREATE POLICY "convites_admin_write"
  ON public.convites FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Metas padrão (opcional — rode após criar usuários) ─────
-- UPDATE public.profiles SET role = 'admin'  WHERE email = 'tiago@email.com';
-- UPDATE public.profiles SET role = 'editor' WHERE email = 'giselle@email.com';
-- UPDATE public.profiles SET role = 'leitor' WHERE email = 'marina@email.com';
```

### 4.1 Ajustar papéis dos usuários de teste

Depois de criar os usuários no Auth:

```sql
UPDATE public.profiles SET role = 'admin'  WHERE email = 'tiago@email.com';
UPDATE public.profiles SET role = 'editor' WHERE email = 'giselle@email.com';
UPDATE public.profiles SET role = 'leitor' WHERE email = 'marina@email.com';
```

---

## 5. Mapa JSON Server → Supabase

| `db.json` | Tabela Supabase | Model Angular | Serviço hoje |
|-----------|-----------------|---------------|--------------|
| `transactions` | `transactions` | `Transaction` | `FinanceService` + `SupabaseService` (parcial) |
| `ativos` | `ativos` | `Ativo` | `FinanceService` → HTTP |
| `investimentos` | `investimentos` | `Investimento` | `FinanceService` → HTTP |
| `usuarios` | `profiles` | `Usuario` | `AuthService` → HTTP |
| `convites` | `convites` | `Convite` | `TeamService` → HTTP |
| *(localStorage)* | `target_metas` | `TargetMeta` | `FinanceService.targetMetas` |

### Campos que mudam na migração

| Campo JSON | Campo Supabase | Nota |
|------------|----------------|------|
| `user_id: number` | `user_id: uuid` | Usar `auth.uid()` |
| `precoMedio` | `preco_medio` | snake_case no Postgres |
| `precoAtual` | `preco_atual` | idem |
| `rentabilidadePct` | `rentabilidade_pct` | idem |
| `targetPercent` | `target_percent` | hoje em `localStorage` |

---

## 6. Lógica de investimentos (referência)

Estes campos **não precisam de coluna extra** no banco — são calculados no `FinanceService`:

| Conceito | Onde vive hoje | Futuro Supabase |
|----------|----------------|-----------------|
| `score` (0–10) | Coluna `ativos.score` | ✅ Persistir |
| Metas `%` por classe | `localStorage` / signal | → `target_metas` |
| `sugestao` (semáforo) | Computed | Calculado no front |
| Cotações Brapi | `.env` → `StockService` | Sem mudança |

### Semáforo `getSugestao()`

| Status | Condição |
|--------|----------|
| **Comprar** | `% carteira < meta` **E** `% < 15%` **E** `score ≥ 7` |
| **Risco (Concentrado)** | `% carteira ≥ 15%` |
| **Reavaliar (Nota Baixa)** | `score < 7` |
| **Segurar** | Demais casos |

Constantes: `SCORE_MIN_COMPRA = 7`, `LIMITE_CONCENTRACAO_ATIVO = 15`.

---

## 7. Plano de migração em 5 fases

### Fase 1 — Auth + profiles ✅ alvo imediato

**Objetivo:** login Supabase + `AuthService.usuarioLogado` vindo de `profiles`.

**Checklist Supabase:**
- [ ] SQL da seção 4 executado
- [ ] Usuários criados no Auth
- [ ] Papéis atualizados via SQL

**Checklist Angular:**
- [ ] `.env` preenchido + `npm run env:sync`
- [ ] `SupabaseService.isConfigured()` retorna `true`
- [ ] Conectar `AuthService` ao Supabase após login
- [ ] `BYPASS_AUTH=false` + `authGuard` ativo

**Prompt sugerido ao Cursor:**

> Conecte o `AuthService` ao Supabase: após `signInWithEmail`, busque `profiles` pelo `auth.uid()` e preencha `usuarioLogado` com `{ id, nome: full_name, email, role }`. Mantenha fallback JSON Server se `!isConfigured()`.

**Arquivos:** `auth.service.ts`, `supabase.service.ts`, `login-page.component.ts`

---

### Fase 2 — Transactions

**Objetivo:** CRUD de lançamentos 100% Supabase.

**Checklist:**
- [ ] `loadTransactions()` → `supabase.fetchTransactions()`
- [ ] `addTransaction` → `insertTransaction` com `user_id = auth.uid()`
- [ ] `updateTransaction` / `deleteTransaction` / `toggleStatus` → Supabase
- [ ] Mapear snake_case ↔ camelCase
- [ ] Migrar `user_id` de `number` para `string` (UUID) nos models

**Prompt:**

> Faça o `FinanceService` usar Supabase para transactions quando `isConfigured()`. Fallback JSON Server se não configurado. Respeite `AuthService.canModify()` no front e RLS no back.

---

### Fase 3 — Carteira (ativos + investimentos)

**Objetivo:** posições e lançamentos de compra/venda no Postgres.

**Checklist:**
- [ ] `fetchAtivos`, `upsertAtivo`, `updateAtivoScore` no `SupabaseService`
- [ ] `fetchInvestimentos`, `insertInvestimento`
- [ ] `loadCarteiraAtivos()` / `loadInvestimentos()` dual-source
- [ ] Import CSV grava no Supabase

**Prompt:**

> Migre `ativos` e `investimentos` para Supabase com RLS. Persista `score` na tabela `ativos`.

---

### Fase 4 — Metas + equipe

**Objetivo:** substituir `localStorage` e JSON de equipe.

**Checklist:**
- [ ] `target_metas` CRUD no Supabase
- [ ] `FinanceService.targetMetas` carrega/salva no banco
- [ ] `TeamService` → `convites` + `profiles`
- [ ] Remover dependência de `db.json` para essas entidades

---

### Fase 5 — Desligar JSON Server

**Objetivo:** produção só com Supabase + Brapi.

**Checklist:**
- [ ] Seed inicial via script SQL ou import
- [ ] Remover `json-server` do fluxo dev (opcional manter como mock)
- [ ] `BYPASS_AUTH=false` em produção
- [ ] Revisar RLS e rotacionar secrets

---

## 8. Dual-source pattern (recomendado durante a migração)

Use este padrão nos métodos do `FinanceService`:

```typescript
loadTransactions(): void {
  this.loading.set(true);

  if (this.supabase.isConfigured()) {
    this.supabase.fetchTransactions().then((data) => {
      this.transactions.set(data.map((t) => this.enrichTransaction(t)));
      this.loading.set(false);
    });
    return;
  }

  // fallback JSON Server (dev)
  this.http.get<Transaction[]>(this.transactionsUrl).subscribe({ /* ... */ });
}
```

Assim você desenvolve com JSON Server **ou** Supabase, conforme o `.env`.

---

## 9. O que já existe no `SupabaseService`

| Método | Tabela | Status |
|--------|--------|--------|
| `signInWithEmail` | Auth | ✅ |
| `signOut` | Auth | ✅ |
| `getSession` / `getUser` | Auth | ✅ |
| `fetchTransactions` | `transactions` | ✅ |
| `insertTransaction` | `transactions` | ✅ |
| `updateTransaction` | `transactions` | ✅ |
| `updateTransactionStatus` | `transactions` | ✅ |
| `deleteTransaction` | `transactions` | ✅ |
| `isConfigured` | — | ✅ |
| `fetchProfile` | `profiles` | ❌ criar na Fase 1 |
| CRUD ativos / investimentos / metas | — | ❌ Fases 3–4 |

---

## 10. Checklist rápido de desenvolvimento

```bash
# 1. Credenciais
cp .env.example .env
# editar .env
npm run env:sync

# 2. API mock (até Fase 5)
npm run json-server

# 3. App
npm run dev
```

**Modo híbrido (atual):** JSON Server + Supabase parcial + `bypassAuth=true`.

**Modo Supabase:** SQL rodado + `.env` ok + `BYPASS_AUTH=false` + guards ativos.

---

## 12. Deploy na Vercel (integração Supabase)

A integração **Vercel + Supabase** injeta variáveis automaticamente. O quickstart da Vercel é para **Next.js** — este projeto é **Angular**; ignore os passos de `app/notes/page.tsx`.

### 12.1 ⚠️ Projeto Supabase correto (causa #1 de “e-mail ou senha inválidos”)

A integração Vercel pode linkar um projeto **diferente** do que você usou no SQL Editor.

| Projeto | ID | Uso |
|---------|-----|-----|
| **my-finances** (correto) | `sakwtegkqzgpphmcsrac` | Schema SQL, usuário `tiagobarbosa.dev@email.com`, admin |
| Outro (integração Vercel) | `nuxueulwvkhbazzwbsza` | **Não** tem seu usuário → login falha |

**Sintoma:** `Invalid login credentials` na Vercel, mas funciona local.

**Correção na Vercel → Settings → Environment Variables** (Production):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sakwtegkqzgpphmcsrac.supabase.co` |
| `SUPABASE_ANON_KEY` | anon JWT do projeto **sakwtegkqzgpphmcsrac** (Settings → API) |

Opcional: remova ou sobrescreva vars do projeto errado (`nuxueulwvkhbazzwbsza`).

Depois: **Redeploy** (Deployments → ⋯ → Redeploy).

No Supabase **sakwtegkqzgpphmcsrac** → Authentication → URL Configuration:

- Site URL: `https://my-finances-dashboard-angular.vercel.app`
- Redirect URLs: `https://my-finances-dashboard-angular.vercel.app/**` e `http://localhost:4200/**`

### 12.2 O que a Vercel injeta

| Variável Vercel | Usada pelo Angular |
|-----------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ → `environment.supabase.url` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ → `publishableKey` |
| `SUPABASE_ANON_KEY` | ✅ fallback da publishable |
| `SUPABASE_URL` | ✅ fallback da URL |
| `SUPABASE_SECRET_KEY` / `SERVICE_ROLE` | ❌ **não** vai pro bundle |
| `POSTGRES_*` | ❌ ignorar no SPA (uso server-side) |

O script `scripts/sync-environment.mjs` roda no **build** e lê `process.env` da Vercel.

### 12.3 Configuração do repositório

Já incluído no projeto:

```json
// vercel.json
{
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/my-finances-dash/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 12.4 Variáveis extras na Vercel (manual)

Em **Vercel → Project → Settings → Environment Variables**, adicione:

| Variável | Obrigatório | Observação |
|----------|-------------|------------|
| `BRAPI_TOKEN` | Para cotações | Não vem da integração Supabase |
| `BYPASS_AUTH` | Opcional | Use `false` quando Auth estiver pronto |

As variáveis `NEXT_PUBLIC_*` da integração Supabase **já bastam** para conectar o cliente.

### 12.5 Supabase — Auth, SQL e seed

1. **SQL Editor** → rode o script da **seção 4** (não use a tabela demo `notes` do quickstart Vercel)
2. **Authentication → URL Configuration** → adicione:
   - `https://seu-app.vercel.app`
   - `http://localhost:4200` (dev)
3. **Site URL** e **Redirect URLs** com o domínio Vercel

3. **Importar dados do `db.json`:**
   ```bash
   npm run seed:sql
   ```
   Cole `docs/supabase-seed.sql` no SQL Editor (206 lançamentos da planilha 2026 + metas; ativos vazios).

### 12.6 Limitação importante: JSON Server

O deploy Vercel é **estático** — `npm run json-server` **não roda** na nuvem.

| Recurso | Local | Vercel |
|---------|-------|--------|
| Lançamentos / carteira | JSON `:3000` | Precisa **Supabase** (Fases 2–3) |
| Auth | bypass ou Supabase | Supabase |
| Cotações Brapi | `.env` | `BRAPI_TOKEN` na Vercel |

Até migrar, o app na Vercel pode carregar **fallback local** ou falhar chamadas HTTP para `API_URL=localhost:3000`.

### 12.7 Desenvolvimento local com vars da Vercel

```bash
npm i -g vercel
vercel link
vercel env pull .env
npm run env:sync
npm run dev
```

---

## 13. Links úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Brapi Dashboard](https://brapi.dev/dashboard)
- README do projeto: [`../README.md`](../README.md)

---

*Última atualização: alinhado ao fluxo `.env`, semáforo de investimentos e histórico Git limpo (secrets fora do repositório).*
