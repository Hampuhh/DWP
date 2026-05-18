/**
 * Genera iconos PNG en distintos tamaños a partir de public/icon.svg.
 * Lo necesitan iOS (apple-touch-icon) y Android/PWA (manifest icons).
 *
 * Uso: node scripts/gen-icons.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SIZES = [
  // Apple touch icons (iOS pantalla de inicio)
  { name: 'apple-touch-icon-180.png', size: 180 },
  // Android / PWA
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-256.png', size: 256 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
  // Maskable (iOS y Android la usan con relleno)
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

const OUT_DIR = 'public/icons';
if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const svgBuffer = await readFile('public/icon.svg');
// Versión "maskable": el icono ocupa ~70% del lienzo, con padding para safe area
const svgMaskable = (await readFile('public/icon.svg', 'utf8'))
  // Reduce la "e" para dejar safe area; mueve verticalmente para centrar el bloque
  .replace('font-size="380"', 'font-size="300"')
  .replace('y="358"', 'y="338"')
  .replace('cx="382" cy="345" r="11"', 'cx="354" cy="328" r="9"')
  .replace('font-size="20"', 'font-size="16"');

for (const { name, size, maskable } of SIZES) {
  const input = maskable ? Buffer.from(svgMaskable) : svgBuffer;
  await sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 245, g: 241, b: 234 } })
    .png()
    .toFile(`${OUT_DIR}/${name}`);
  console.log(`✓ ${OUT_DIR}/${name} (${size}×${size})`);
}

console.log(`\nGenerados ${SIZES.length} iconos en ${OUT_DIR}/`);
