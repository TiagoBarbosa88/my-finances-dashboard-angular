# Guia de commits por atividade

Execute na ordem abaixo (copie e cole cada bloco). Confira com `git status` entre um commit e outro.

---

## 1. Design system — tokens e verde escuro (CTAs)

```bash
git add src/styles/styles.css \
  docs/DESIGN-SYSTEM.md \
  .cursor/rules/design-system.mdc \
  src/app/features/investments/components/new-investment-dialog/new-investment-dialog.component.html \
  src/app/features/investments/components/meus-ativos-table/ \
  src/app/features/investments/components/investimentos-metas/ \
  src/app/features/settings/pages/settings-page/ \
  src/app/features/investments/pages/investimentos-page/investimentos-page.component.ts

git commit -m "$(cat <<'EOF'
feat(design): tokens action verde e remoção de blue-* na UI

Adiciona --action, .btn-action e .input-field; FAB/modal/configurações
usam verde escuro alinhado à identidade do app.
EOF
)"
```

---

## 2. Google OAuth — login normal + Google

```bash
git add src/app/features/auth/pages/login-page/ \
  src/app/core/api/supabase.service.ts \
  docs/SUPABASE-SETUP.md

git commit -m "$(cat <<'EOF'
feat(auth): login com Google OAuth via Supabase

Adiciona signInWithGoogle e botão Continuar com Google na login,
mantendo e-mail/senha. Documenta configuração no SUPABASE-SETUP.
EOF
)"
```

---

## 3. Segurança

```bash
git add src/app/core/auth/guards/role.guard.ts \
  vercel.json \
  scripts/sync-environment.mjs

git commit -m "$(cat <<'EOF'
chore(security): role guard, headers HTTP e BYPASS_AUTH em produção

Força bypassAuth=false em build de produção e adiciona headers
de segurança na Vercel.
EOF
)"
```

---

## 4. Reestruturação de pastas (feature-based)

```bash
git add src/app/core/api/ \
  src/app/core/auth/ \
  src/app/core/config/ \
  src/app/layout/app-sidebar/ \
  src/app/features/dashboard/components/ \
  src/app/features/dashboard/data/ \
  src/app/features/investments/ \
  src/app/features/settings/ \
  src/app/features/categories/ \
  src/app/features/transactions/ \
  src/app/features/goals/ \
  src/app/features/reports/ \
  src/app/app.routes.ts \
  src/app/app.routes.spec.ts \
  src/app/app.config.ts \
  src/app/app.component.ts \
  src/app/layout/ \
  src/app/features/dashboard/pages/ \
  src/app/features/auth/pages/welcome-page/ \
  src/app/shared/ \
  src/app/core/utils/ \
  tsconfig.json

git add -u src/app/core/constants/ \
  src/app/core/guards/auth.guard.ts \
  src/app/core/services/ \
  src/app/finance/ \
  src/app/features/ajustes/ \
  src/app/features/investimentos/ \
  src/app/features/categorias/ \
  src/app/features/lancamentos/ \
  src/app/features/metas/ \
  src/app/features/relatorios/

git commit -m "$(cat <<'EOF'
refactor: arquitetura feature-based com aliases @core/@features

Move componentes para features/dashboard e features/investments,
sidebar para layout/app-sidebar, core em auth/api/config.
Rotas em português inalteradas.
EOF
)"
```

---

## 5. Documentação e regras Cursor

```bash
git add README.md TASKS.md docs/ORCHESTRATOR.md .cursor/rules/architecture.mdc

git commit -m "$(cat <<'EOF'
docs: README, TASKS e guia de orquestração do plano

Documenta estrutura final, tracking de tarefas e regra de arquitetura.
EOF
)"
```

---

## 6. Restante (se houver)

```bash
git status
# Se restar algo legítimo:
git add -A
git commit -m "chore: ajustes residuais do plano de reestruturação"
```

---

## Google OAuth — configurar no Supabase (manual)

O código já está pronto. Para funcionar em produção:

1. Google Cloud → OAuth Client → redirect `https://SEU_PROJECT.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **Google** → Enable
3. Supabase → URL Configuration → Site URL + Redirect URLs (`localhost:4200/**` e domínio Vercel)

Ver `docs/SUPABASE-SETUP.md` §3.2.1.
