/**
 * Gera ícones PWA PNG a partir de public/favicon.svg
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'favicon.svg');
const iconsDir = join(root, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svg = readFileSync(svgPath);

for (const size of sizes) {
  const out = join(iconsDir, `icon-${size}x${size}.png`);
  await sharp(svg).resize(size, size, { fit: 'contain', background: '#111827' }).png().toFile(out);
  console.log(`✓ ${out}`);
}

// favicon.ico multi-size (16 + 32)
const favicon16 = await sharp(svg).resize(16, 16).png().toBuffer();
const favicon32 = await sharp(svg).resize(32, 32).png().toBuffer();
await sharp(favicon32).toFile(join(root, 'public', 'favicon-32.png'));
await sharp(favicon16).toFile(join(root, 'public', 'favicon-16.png'));
console.log('✓ favicon PNGs');
