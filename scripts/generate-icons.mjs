import sharp from 'sharp';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
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

// Build the macOS app icon (icon.icns) from icon.png. Without it, the build
// falls back to the default electron.icns. iconutil is macOS-only, so this is
// skipped elsewhere.
async function generateAppIcns() {
  if (process.platform !== 'darwin') {
    console.log('Skipping icon.icns (iconutil is macOS-only)');
    return;
  }

  const sizes = [
    ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
  ];

  const tmpRoot = mkdtempSync(join(tmpdir(), 'gitlabbar-'));
  const iconset = join(tmpRoot, 'icon.iconset');
  mkdirSync(iconset, { recursive: true });

  try {
    for (const [name, size] of sizes) {
      await sharp(join(iconsDir, 'icon.png'))
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(join(iconset, name));
    }
    execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(iconsDir, 'icon.icns')]);
    console.log('Generated: icon.icns');
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function main() {
  for (const [name, color] of Object.entries(colors)) {
    await generateIcon(color, name, 16);  // 1x
    await generateIcon(color, name, 32);  // 2x
  }
  await generateAppIcns();
  console.log('All icons generated!');
}

main().catch(console.error);
