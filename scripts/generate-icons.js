// Script pour générer des icônes SVG puis les convertir en PNG
// Pour le moment, on utilise des SVG comme source

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../assets/icons');

const colors = {
  green: '#34c759',
  orange: '#ff9500',
  red: '#ff3b30',
  gray: '#8e8e93',
};

// Créer un SVG simple (cercle)
function createSvgIcon(color, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${color}" />
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" />
</svg>`;
}

// Créer les fichiers SVG
Object.entries(colors).forEach(([name, color]) => {
  const svg16 = createSvgIcon(color, 16);
  const svg32 = createSvgIcon(color, 32);

  fs.writeFileSync(path.join(iconsDir, `tray-${name}.svg`), svg16);
  fs.writeFileSync(path.join(iconsDir, `tray-${name}@2x.svg`), svg32);

  console.log(`Created tray-${name}.svg`);
});

// Créer l'icône principale de l'app
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FC6D26;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E24329;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <g transform="translate(90, 120) scale(0.65)">
    <path fill="#fff" d="M256 9.767l78.688 242.125h157.375L335.375 363.75l78.688 242.125L256 493.992 98.312 605.875 177 363.75 20.313 251.892h157.375L256 9.767z"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), appIconSvg);
console.log('Created icon.svg');

console.log('\\nNote: Pour créer les fichiers PNG et ICNS, vous devez utiliser un outil comme:');
console.log('- electron-icon-builder');
console.log('- ou convertir manuellement avec ImageMagick/sips');
