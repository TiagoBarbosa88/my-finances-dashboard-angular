/**
 * URL pública do app Angular (nunca JSON Server :3000).
 * Usada em redirectTo de convites Supabase Auth.
 */
function resolveSiteUrl() {
  const raw = (process.env.SITE_URL || '').trim().replace(/\/$/, '');

  // localhost:3000 é o JSON Server deste repo — redirect de convite quebra se usar isso.
  if (raw && !raw.includes('localhost:3000')) {
    return raw;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  return 'http://localhost:4200';
}

function inviteRedirectUrl() {
  return `${resolveSiteUrl()}/`;
}

module.exports = { resolveSiteUrl, inviteRedirectUrl };
