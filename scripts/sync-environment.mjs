/**
 * Gera `src/environments/environment.ts` a partir de:
 *   1. process.env (Vercel / CI)
 *   2. `.env` local
 *   3. `.env.example` (fallback)
 *
 * SUPABASE_SECRET_KEY / SERVICE_ROLE nunca entram no bundle Angular.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envFile = join(root, '.env');
const exampleFile = join(root, '.env.example');
const outFile = join(root, 'src/environments/environment.ts');

function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function loadFileVars() {
  const source = existsSync(envFile) ? envFile : exampleFile;
  if (!existsSync(source)) return {};
  if (source === exampleFile && !existsSync(envFile)) {
    console.warn('[env] Usando .env.example — crie um .env para desenvolvimento local.');
  }
  return parseEnvFile(readFileSync(source, 'utf8'));
}

function projectRef(url) {
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
}

/** Mescla arquivo + process.env (Vercel injeta NEXT_PUBLIC_* e SUPABASE_*). */
function loadVars() {
  const file = loadFileVars();
  const env = { ...file, ...process.env };

  const supabaseUrl =
    env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  /**
   * Chave pública do cliente Supabase.
   * Publishable (sb_publishable_*) tem prioridade — evita anon legada errada na Vercel.
   */
  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const jwksUrl =
    env.SUPABASE_JWKS_URL ||
    (supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json` : '');

  const isProduction =
    env.NODE_ENV === 'production' ||
    env.VERCEL_ENV === 'production';

  return {
    production: isProduction,
    bypassAuth: env.BYPASS_AUTH !== 'false' && !isProduction,
    supabaseUrl,
    publishableKey,
    jwksUrl,
    projectRef: projectRef(supabaseUrl),
    apiUrl: env.API_URL || 'http://localhost:3000',
    brapiApiRoot: env.BRAPI_API_ROOT || 'https://brapi.dev/api',
    brapiBaseUrl: env.BRAPI_BASE_URL || 'https://brapi.dev/api/v2/stocks',
    brapiToken: env.BRAPI_TOKEN || '',
  };
}

function esc(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const v = loadVars();

const content = `/** Gerado por scripts/sync-environment.mjs — não edite manualmente. */
export const environment = {
  production: ${v.production},
  bypassAuth: ${v.bypassAuth},
  supabase: {
    url:            '${esc(v.supabaseUrl)}',
    publishableKey: '${esc(v.publishableKey)}',
    jwksUrl:        '${esc(v.jwksUrl)}',
  },
  apiUrl: '${esc(v.apiUrl)}',
  brapi: {
    apiRoot: '${esc(v.brapiApiRoot)}',
    baseUrl: '${esc(v.brapiBaseUrl)}',
    token:   '${esc(v.brapiToken)}',
  },
};
`;

writeFileSync(outFile, content, 'utf8');

const source = existsSync(envFile)
  ? '.env'
  : process.env.VERCEL
    ? 'Vercel env'
    : '.env.example';

console.log(
  `[env] environment.ts sincronizado (${source}) · production=${v.production}` +
    (v.projectRef ? ` · supabase=${v.projectRef}` : ''),
);

if (v.projectRef && v.projectRef !== 'sakwtegkqzgpphmcsrac' && v.production) {
  console.warn(
    `[env] AVISO: projeto Supabase "${v.projectRef}" difere de "sakwtegkqzgpphmcsrac" ` +
      '(onde o schema SQL e o usuário admin foram criados). Login na Vercel falhará até alinhar as vars.',
  );
}
