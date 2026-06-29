# Orquestrador — Prompts por tarefa

Use **apenas** o bloco da tarefa atual + status de `TASKS.md`. Não reenvie o plano completo.

## T0 — Design tokens

**Arquivos:** `src/styles/styles.css`, `docs/DESIGN-SYSTEM.md`, `.cursor/rules/design-system.mdc`

**Objetivo:** Criar `--action`, `--action-hover`, classes `.btn-action`, `.input-field`; documentar paleta.

**Done:** tokens no CSS + docs + rule mdc.

---

## T1 — Visual investimentos

**Arquivos permitidos:**
- `src/styles/styles.css` (`.app-fab-invest` only)
- `src/app/finance/components/new-investment-dialog/*`
- `src/app/features/investimentos/pages/investimentos-page/*`
- `src/app/finance/components/investimentos-metas/*`
- `src/app/finance/components/meus-ativos-table/*`

**Objetivo:** Substituir `blue-*` por `--action` / `.btn-action` / `ring-ring`.

**Done:** `rg 'blue-[0-9]'` zero nesses arquivos + build ok.

---

## T2 — Visual configurações

**Arquivos:** `src/app/features/ajustes/pages/ajustes-page/*`

**Objetivo:** Substituir `blue-*` por `.btn-action` e focus `ring-ring`.

---

## T3 — Validar design

```bash
rg 'blue-[0-9]' src/app --glob '*.{html,ts}'
npm run build
```

---

## T4 — Google OAuth

**Arquivos:** `supabase.service.ts`, `login-page.*`, `auth.guard.ts` (se necessário)

**Objetivo:** `signInWithGoogle()` + botão na login.

---

## T5 — Google OAuth docs

**Arquivo:** `docs/SUPABASE-SETUP.md` — seção Google provider.

---

## T6 — Segurança guards

**Arquivos:** novo `role.guard.ts`, `app.routes.ts`, `sync-environment.mjs`

---

## T7 — Segurança headers

**Arquivos:** `vercel.json`, interceptor HTTP (novo em core)

---

## T8 — PR1 Layout

**Objetivo:** `finance/components/sidebar` → `layout/app-sidebar`; unificar confirm-dialog; remover dead code.

---

## T9–T11 — PR2–PR4 Features

Migrar componentes para `features/investments`, `features/dashboard`, `features/settings`.

---

## T12 — PR5 Core

Reorganizar `core/auth`, `core/api`, `core/config`; aliases tsconfig.

---

## T13 — Clean-up

README, testes, fechar TASKS.md.
