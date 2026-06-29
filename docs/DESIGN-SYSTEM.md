# Design System — Smart Finances

## Paleta (OKLCH)

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `oklch(0.78 0.17 160)` | Verde claro — marca, sidebar, FAB painel |
| `--action` | `oklch(0.48 0.14 160)` | Verde escuro — Adicionar/Salvar |
| `--action-hover` | `oklch(0.55 0.15 160)` | Hover dos CTAs |
| `--success` | igual primary | Métricas positivas |
| `--destructive` | vermelho | Negativo, cancelar perigoso |
| `--warning` | amarelo | Neutro 0% |

## Classes utilitárias

- `.btn-action` — botão principal (submit, convidar)
- `.btn-cancel` — ação destrutiva secundária
- `.app-fab-invest` — FAB verde escuro em investimentos
- `.input-field` — input com focus verde
- `.surface-card` — card padrão
- `.dialog-panel` — modal

## Hierarquia visual

1. **CTAs de criação** → `.btn-action` (verde escuro)
2. **Identidade / nav** → `bg-primary` (verde claro)
3. **Dados financeiros** → `text-success` / `text-destructive` / `text-warning`

## Regra

Não usar `blue-*` do Tailwind em UI. Gráficos podem usar `--chart-2` (azul) para distinguir séries.
