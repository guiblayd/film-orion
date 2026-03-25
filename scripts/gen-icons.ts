/**
 * Gera ícones PNG para o PWA usando apenas Node.js built-in
 * Cria arquivos SVG renomeados que funcionam como ícones PWA
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

mkdirSync(publicDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.62);
  const textY = Math.round(size * 0.68);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#09090b"/>
  <text x="${size / 2}" y="${textY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#f4f4f5">I</text>
</svg>`;

  writeFileSync(resolve(publicDir, `icon-${size}x${size}.svg`), svg);
  console.log(`✓ icon-${size}x${size}.svg`);
}

// screenshot mockup (usado no manifest)
const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" width="390" height="844">
  <rect width="390" height="844" fill="#09090b"/>
  <text x="195" y="422" font-family="Georgia, serif" font-size="64" font-weight="900" text-anchor="middle" fill="#f4f4f5">Indica</text>
  <text x="195" y="490" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#52525b">Compartilhe o que vale a pena assistir</text>
</svg>`;
writeFileSync(resolve(publicDir, 'screenshot.svg'), screenshotSvg);
console.log('✓ screenshot.svg');

console.log('\nÍcones gerados em /public');
