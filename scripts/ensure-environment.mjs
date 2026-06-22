import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const envPath = join(root, 'src/environments/environment.ts');
const examplePath = join(root, 'src/environments/environment.example.ts');

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log(
    '[setup] Criado src/environments/environment.ts a partir do example — preencha suas chaves.',
  );
}
