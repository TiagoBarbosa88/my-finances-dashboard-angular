# Smart Finances — Task Tracker

> Single source of truth para execução do plano de reestruturação.

## Status geral

| ID | Tarefa | Status |
|----|--------|--------|
| T-ORCH | Bootstrap tracking | **done** |
| T0 | Design tokens | **done** |
| T1 | Visual investimentos | **done** |
| T2 | Visual configurações | **done** |
| T3 | Validar design | **done** |
| T4 | Google OAuth código | **done** |
| T5 | Google OAuth docs | **done** |
| T6 | Segurança guards | **done** |
| T7 | Segurança headers | **done** |
| T8 | Arquitetura PR1 layout | **done** |
| T9 | Arquitetura PR2 investments | **done** |
| T10 | Arquitetura PR3 dashboard | **done** |
| T11 | Arquitetura PR4 settings | **done** |
| T12 | Arquitetura PR5 core | **done** |
| T13 | Clean-up final | **done** |

## Log de sessões

| Data | ID | Resumo | Build |
|------|-----|--------|-------|
| 2026-06-21 | T-ORCH–T13 | Plano completo executado | ok |
| 2026-06-21 | Clean-up | Removidas pastas duplicadas `finance/`, `core/services`, stubs legados | ok |

## Estrutura final

```
src/app/
├── core/auth/     guards + auth.service
├── core/api/      supabase, finance, stock, team
├── core/config/   app-routes, app-brand
├── layout/        main-layout, app-sidebar, auth-layout
├── shared/        ui, pipes, directives, models
└── features/      dashboard, investments, settings, auth, …
```

Rotas em português (`/app/painel`, `/app/investimentos`, …). Pastas em inglês.
