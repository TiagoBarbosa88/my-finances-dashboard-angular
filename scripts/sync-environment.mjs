/**
 * Lê `.env` na raiz e gera `src/environments/environment.ts`.
 * A SUPABASE_SECRET_KEY fica só no .env — nunca entra no bundle Angular.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envFile = join(root, '.env');
const exampleFile = join(root, '.env.example');
const outFile = join(root, 'src/environments/environment.ts');

function parseEnv(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function loadEnvVars() {
  const source = existsSync(envFile) ? envFile : exampleFile;

  if (!existsSync(source)) {
    console.warn('[env] Nenhum .env encontrado — copie .env.example para .env');
    return parseEnv('');
  }

  if (source === exampleFile) {
    console.warn('[env] Usando .env.example — crie um .env com suas chaves reais.');
  }

  return parseEnv(readFileSync(source, 'utf8'));
}

function esc(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const v = loadEnvVars();

const content = `/** Gerado automaticamente por scripts/sync-environment.mjs — não edite manualmente. */
export const environment = {
  production: false,
  bypassAuth: ${v.BYPASS_AUTH === 'false' ? 'false' : 'true'},
  supabase: {
    url:            '${esc(v.SUPABASE_URL)}',
    publishableKey: '${esc(v.SUPABASE_PUBLISHABLE_KEY)}',
    jwksUrl:        '${esc(v.SUPABASE_JWKS_URL)}',
  },
  apiUrl: '${esc(v.API_URL || 'http://localhost:3000')}',
  brapi: {
    apiRoot: '${esc(v.BRAPI_API_ROOT || 'https://brapi.dev/api')}',
    baseUrl: '${esc(v.BRAPI_BASE_URL || 'https://brapi.dev/api/v2/stocks')}',
    token:   '${esc(v.BRAPI_TOKEN)}',
  },
};
`;

writeFileSync(outFile, content, 'utf8');
console.log('[env] environment.ts sincronizado a partir de', existsSync(envFile) ? '.env' : '.env.example');
