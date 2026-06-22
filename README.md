# My Finances Dash

Dashboard financeiro pessoal em **Angular 19** — controle de lançamentos, carteira de investimentos, metas de alocação e sugestões inteligentes de compra com foco em **risco** e **qualidade**.

> Projeto privado · Tiago & Giselle · tema **Dark Financeiro**

---

## O que a aplicação faz

| Módulo | Rota | Descrição |
|--------|------|-----------|
| **Painel** | `/` | KPIs do mês, gráficos de categorias, saldo e últimos lançamentos |
| **Investimentos** | `/investimentos` | Carteira, cotações Brapi, metas por classe, semáforo de sugestão |
| **Lançamentos** | `/lancamentos` | CRUD de receitas e despesas |
| **Ajustes** | `/ajustes` | Conta, equipe e convites (Admin / Editor / Leitor) |

### Destaques de investimentos

- **Metas de alocação** — Ações, FIIs, ETFs, Tesouro (total limitado a 100%)
- **Semáforo por ativo** — `Comprar` · `Risco (Concentrado)` · `Reavaliar (Nota Baixa)` · `Segurar`
- **Critérios de compra** — abaixo da meta da categoria + nota ≥ 7 + concentração &lt; 15%
- **Cotações** — integração [Brapi](https://brapi.dev) (atualização manual)
- **Import CSV/Excel** — lançamentos e posições em lote

---

## Stack

- **Angular 19** · standalone components · signals
- **Tailwind CSS v4** · tema dark
- **JSON Server** — API local de desenvolvimento (`db.json`)
- **Supabase** — auth + Postgres (migração em andamento)
- **Brapi** — cotações de ativos B3

---

## Pré-requisitos

- Node.js 20+
- npm 10+

---

## Configuração rápida

### 1. Clone e instale

```bash
git clone https://github.com/TiagoBarbosa88/my-finances-dashboard-angular.git
cd my-finances-dashboard-angular
npm install
```

O `postinstall` gera `src/environments/environment.ts` a partir do `.env`.

### 2. Credenciais (`.env`)

```bash
cp .env.example .env
```

Edite `.env` na raiz:

```env
# Supabase — Dashboard → Settings → API
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_JWKS_URL=https://seu-projeto.supabase.co/auth/v1/.well-known/jwks.json

# ⚠️ Secret key: NUNCA use no frontend Angular
SUPABASE_SECRET_KEY=sb_secret_...

# Brapi — https://brapi.dev/dashboard
BRAPI_TOKEN=sua_chave_aqui

# API local
API_URL=http://localhost:3000
BYPASS_AUTH=true
```

| Variável | Onde usa | Commitar? |
|----------|----------|-----------|
| `SUPABASE_URL` | Frontend | ❌ só no `.env` |
| `SUPABASE_PUBLISHABLE_KEY` | Frontend (`SupabaseService`) | ❌ |
| `SUPABASE_SECRET_KEY` | Backend / Edge Functions apenas | ❌ |
| `SUPABASE_JWKS_URL` | Validação JWT (futuro backend) | ❌ |
| `BRAPI_TOKEN` | Frontend (`StockService`) | ❌ |

Sincronizar manualmente após editar `.env`:

```bash
npm run env:sync
```

> **Segurança:** `.env` e `environment.ts` estão no `.gitignore`. Nunca commite chaves reais.

### 3. Suba os serviços

Terminal 1 — API mock:

```bash
npm run json-server
```

Terminal 2 — Angular:

```bash
npm run dev
```

Abra [http://localhost:4200](http://localhost:4200)

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run json-server` | JSON Server na porta 3000 |
| `npm run env:sync` | `.env` → `environment.ts` |
| `npm run build` | Build de produção |
| `npm run format` | Prettier em todo o projeto |

---

## Arquitetura

```
src/app/
├── core/           # FinanceService, AuthService, SupabaseService, guards
├── features/       # Páginas por domínio (dashboard, investimentos, ajustes…)
├── finance/        # Componentes reutilizáveis (tabelas, gráficos, modais)
├── layout/         # Shell, sidebar, rotas
└── shared/         # Models, pipes, directives (ex.: *appHasRole)
```

**Fluxo de dados hoje**

1. `FinanceService` — estado global com signals (transações, carteira, metas)
2. JSON Server — persistência local via `db.json`
3. Supabase — parcial (`transactions` + auth); ver [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md)

---

## Permissões

| Papel | Criar | Editar | Excluir | Investimentos |
|-------|-------|--------|---------|---------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ | ✅ |
| Leitor | ❌ | ❌ | ❌ | ❌ |

Controlado por `AuthService` + diretiva `*appHasRole`.

---

## Migração Supabase

Guia completo de SQL, RLS e plano em 5 fases:

📄 [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md)

---

## Licença

Uso privado — todos os direitos reservados.
