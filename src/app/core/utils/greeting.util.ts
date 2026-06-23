/** Saudação por horário usando o primeiro nome da pessoa. */
export function buildSaudacao(nomeCompleto?: string | null, emoji = true): string {
  const hour = new Date().getHours();
  const periodo = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = nomeCompleto?.trim().split(/\s+/)[0] || 'você';
  const suffix = emoji ? ' 👋' : '';

  return `${periodo}, ${primeiroNome}${suffix}`;
}
