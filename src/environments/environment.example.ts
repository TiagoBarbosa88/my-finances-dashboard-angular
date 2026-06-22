/**
 * Template de credenciais — copie para `environment.ts` e preencha localmente.
 *
 *   cp src/environments/environment.example.ts src/environments/environment.ts
 *
 * ⚠️  `environment.ts` está no .gitignore e NÃO deve ser commitado.
 */
export const environment = {
  production: false,
  bypassAuth: true,
  supabase: {
    url:     'https://SEU_PROJECT_ID.supabase.co',
    anonKey: 'SUA_ANON_KEY_AQUI',
  },
  apiUrl: 'http://localhost:3000',
  brapi: {
    apiRoot: 'https://brapi.dev/api',
    baseUrl: 'https://brapi.dev/api/v2/stocks',
    token:   'SUA_CHAVE_BRAPI_AQUI',
  },
};
