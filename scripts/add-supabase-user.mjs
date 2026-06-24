/**
 * Cria usuário no Supabase Auth + garante profile e convite.
 *
 * Uso:
 *   node scripts/add-supabase-user.mjs --email=sellegameplay@gmail.com --nome=Giselle --role=leitor --password=SuaSenha123
 *
 * Requer no .env ou variáveis de ambiente:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const envFile = join(root, '.env');

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

function arg(name, fallback = '') {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found?.split('=').slice(1).join('=') ?? fallback;
}

const fileVars = existsSync(envFile) ? parseEnvFile(readFileSync(envFile, 'utf8')) : {};
const env = { ...fileVars, ...process.env };

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const email = arg('email').trim().toLowerCase();
const nome = arg('nome', email.split('@')[0]).trim();
const role = arg('role', 'leitor');
const password = arg('password', 'SmartFinances2026!');
const convidadoPor = arg('convidado_por', 'tiagobarbosa.dev');

if (!url || !serviceKey) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

if (!email.includes('@')) {
  console.error('Informe --email=válido');
  process.exit(1);
}

if (!['admin', 'editor', 'leitor'].includes(role)) {
  console.error('role deve ser admin, editor ou leitor');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(targetEmail) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (user) return user;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  console.log(`\n[add-user] ${email} · ${nome} · ${role}\n`);

  let userId;
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    userId = existing.id;
    console.log(`Usuário Auth já existe: ${userId}`);

    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: nome, role },
    });
    if (updateErr) {
      console.warn('Aviso ao atualizar Auth:', updateErr.message);
    } else {
      console.log('Senha e metadados atualizados.');
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nome, role },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Usuário Auth criado: ${userId}`);
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: nome,
        email,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id, full_name, email, role')
    .single();

  if (profileErr) {
    throw new Error(`Profile: ${profileErr.message}`);
  }

  console.log('Profile:', profile);

  const { data: adminProfile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', `${convidadoPor}%`)
    .maybeSingle();

  const { data: existingConvite } = await admin
    .from('convites')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (existingConvite?.id) {
    await admin
      .from('convites')
      .update({ nome, role, status: 'aceito', convidado_por: convidadoPor })
      .eq('id', existingConvite.id);
    console.log('Convite atualizado como aceito.');
  } else {
    const { error: insertErr } = await admin.from('convites').insert({
      nome,
      email,
      role,
      status: 'aceito',
      convidado_por: convidadoPor,
      invited_by: adminProfile?.id ?? null,
    });
    if (insertErr) {
      console.warn('Convite (opcional):', insertErr.message);
    } else {
      console.log('Convite registrado como aceito.');
    }
  }

  console.log('\n✓ Pronto. Login no app:');
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${password}`);
  console.log('\nPeça para a pessoa trocar a senha em Configurações após entrar.\n');
}

main().catch((err) => {
  console.error('\nErro:', err.message || err);
  process.exit(1);
});
