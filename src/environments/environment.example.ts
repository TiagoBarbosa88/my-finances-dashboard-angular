/**
 * Fallback estático — o fluxo recomendado é `.env` → `npm run env:sync`.
 * Veja `.env.example` na raiz do projeto.
 */
export const environment = {
  production: false,
  bypassAuth: true,
  supabase: {
    url:            'https://SEU_PROJECT_ID.supabase.co',
    publishableKey: 'sb_publishable_SUA_CHAVE_AQUI',
    jwksUrl:        'https://SEU_PROJECT_ID.supabase.co/auth/v1/.well-known/jwks.json',
  },
  apiUrl: 'http://localhost:3000',
  brapi: {
    apiRoot: 'https://brapi.dev/api',
    baseUrl: 'https://brapi.dev/api/v2/stocks',
    token:   'SUA_CHAVE_BRAPI_AQUI',
  },
};
