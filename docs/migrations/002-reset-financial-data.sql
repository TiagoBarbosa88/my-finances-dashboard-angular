-- Remove todos os lançamentos e carteira (mantém auth.users e profiles).
-- Rode ANTES de importar novo seed na conta principal.

TRUNCATE public.transactions, public.ativos, public.investimentos, public.target_metas RESTART IDENTITY;
