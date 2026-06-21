/** Equivalente a `src/lib/utils.ts` (React) — utilitário de classes CSS. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
