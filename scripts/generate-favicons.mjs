/**
 * Favicon generator script — run with: node scripts/generate-favicons.mjs
 *
 * Input:  logo.png (project root) — 1024×1024, square
 * Output: public/favicon-*.png, public/apple-touch-icon.png, public/favicon.ico
 *
 * Requires: sharp, png-to-ico  (both in devDependencies)
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT   = resolve(__dir, '..');
const SRC    = resolve(ROOT, 'logo.png');
const PUBLIC = resolve(ROOT, 'public');

mkdirSync(PUBLIC, { recursive: true });

// ── All PNG sizes we need ────────────────────────────────────────────────────
const sizes = [
  { size: 16,  name: 'favicon-16x16.png'  },
  { size: 32,  name: 'favicon-32x32.png'  },
  { size: 48,  name: 'favicon-48x48.png'  },
  { size: 96,  name: 'favicon-96x96.png'  },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'favicon-192x192.png' },
  { size: 512, name: 'favicon-512x512.png' },
];

async function generatePng(size, destName) {
  const dest = resolve(PUBLIC, destName);

  // Add 10 % padding on each side so logo never touches the edge
  const padded = Math.round(size * 0.80);   // inner logo = 80 % of canvas
  const offset = Math.round((size - padded) / 2);

  await sharp(SRC)
    .resize(padded, padded, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top:    offset,
      bottom: size - padded - offset,
      left:   offset,
      right:  size - padded - offset,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(dest);

  console.log(`  ✓ ${destName} (${size}×${size})`);
  return dest;
}

async function main() {
  console.log('\nGenerating PNG favicons…');
  const paths = {};
  for (const { size, name } of sizes) {
    paths[name] = await generatePng(size, name);
  }

  // Also write favicon-180x180.png so existing manifest reference still works
  const atDest = resolve(PUBLIC, 'apple-touch-icon.png');
  const f180   = resolve(PUBLIC, 'favicon-180x180.png');
  writeFileSync(f180, readFileSync(atDest));
  console.log('  ✓ favicon-180x180.png (copy of apple-touch-icon)');

  // ── Build multi-size .ico (16 + 32 + 48) ──────────────────────────────────
  console.log('\nBuilding favicon.ico (16 + 32 + 48 px)…');
  const icoInput = [
    resolve(PUBLIC, 'favicon-16x16.png'),
    resolve(PUBLIC, 'favicon-32x32.png'),
    resolve(PUBLIC, 'favicon-48x48.png'),
  ];
  const icoBuffer = await pngToIco(icoInput);
  const icoDest   = resolve(PUBLIC, 'favicon.ico');
  writeFileSync(icoDest, icoBuffer);
  console.log(`  ✓ favicon.ico (${Math.round(icoBuffer.length / 1024)} KB, 3-size multi-icon)`);

  console.log('\nDone. All favicon assets are in /public.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
