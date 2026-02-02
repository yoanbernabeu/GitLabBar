import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'assets', 'icons');

const colors = {
  gray: '#8e8e93',
  green: '#34c759',
  orange: '#ff9500',
  red: '#ff3b30',
};

async function generateIcon(color, colorName, size) {
  const scale = size / 16;

  // Create SVG with merge request icon
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
      <circle cx="4" cy="4" r="2.2" fill="${color}"/>
      <circle cx="12" cy="4" r="2.2" fill="${color}"/>
      <circle cx="8" cy="12.5" r="2.2" fill="${color}"/>
      <line x1="4" y1="6.2" x2="4" y2="8" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="12" y1="6.2" x2="12" y2="8" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="4" y1="8" x2="8" y2="10.3" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="12" y1="8" x2="8" y2="10.3" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;

  const suffix = size === 32 ? '@2x' : '';
  const outputPath = join(iconsDir, `tray-${colorName}${suffix}.png`);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function main() {
  for (const [name, color] of Object.entries(colors)) {
    await generateIcon(color, name, 16);  // 1x
    await generateIcon(color, name, 32);  // 2x
  }
  console.log('All icons generated!');
}

main().catch(console.error);
