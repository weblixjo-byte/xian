const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcPath = 'C:/Users/VECTUS-H/.gemini/antigravity/brain/0c3b8303-1aa8-44b3-9dfc-865e8cc56bfb/.user_uploaded/media_1789778847930.png';

async function generate() {
  console.log('Generating icons from:', srcPath);
  
  // 1. Logo (clean transparent high-res)
  await sharp(srcPath)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/logo.png');
  console.log('Saved public/logo.png');

  // 2. Standard PWA Icon 192 (transparent)
  await sharp(srcPath)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/icon-192.png');
  console.log('Saved public/icon-192.png');

  // 3. Standard PWA Icon 512 (transparent)
  await sharp(srcPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/icon-512.png');
  console.log('Saved public/icon-512.png');

  // 4. Apple Touch Icon 180x180 (with #f7f2e4 background)
  const logo156 = await sharp(srcPath)
    .resize(156, 156, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 247, g: 242, b: 228, alpha: 1 } // #f7f2e4
    }
  })
  .composite([{ input: logo156, gravity: 'center' }])
  .png()
  .toFile('public/apple-touch-icon.png');
  console.log('Saved public/apple-touch-icon.png');

  // 5. Favicon PNG (48x48)
  await sharp(srcPath)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/favicon.png');
  console.log('Saved public/favicon.png');

  // Favicon ICO (32x32)
  await sharp(srcPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/favicon.ico');
  console.log('Saved public/favicon.ico');

  // Copy to src/app metadata icons
  fs.copyFileSync('public/icon-192.png', 'src/app/icon.png');
  fs.copyFileSync('public/apple-touch-icon.png', 'src/app/apple-icon.png');
  fs.copyFileSync('public/favicon.ico', 'src/app/favicon.ico');
  console.log('Copied to src/app metadata icons');

  // 6. Cashier Icons with distinct 'POS' badge
  async function makeCashierIcon(size, filename) {
    const pad = Math.round(size * 0.12);
    const innerSize = size - pad * 2;
    const logoResized = await sharp(srcPath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const badgeHeight = Math.round(size * 0.22);
    const badgeWidth = Math.round(size * 0.58);
    const fontSize = Math.round(badgeHeight * 0.65);
    const rx = Math.round(badgeHeight / 2);

    const svgBadge = Buffer.from(`
      <svg width="${badgeWidth}" height="${badgeHeight}" viewBox="0 0 ${badgeWidth} ${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${badgeWidth}" height="${badgeHeight}" rx="${rx}" fill="#cb202d" stroke="#ffffff" stroke-width="${Math.max(2, Math.round(size*0.015))}" />
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}px" font-weight="900" letter-spacing="1.5">POS</text>
      </svg>
    `);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 247, g: 242, b: 228, alpha: 1 } // #f7f2e4
      }
    })
    .composite([
      { input: logoResized, top: Math.round(size * 0.05), left: Math.round((size - innerSize)/2) },
      { input: svgBadge, top: size - badgeHeight - Math.round(size * 0.04), left: Math.round((size - badgeWidth)/2) }
    ])
    .png()
    .toFile(filename);

    console.log('Saved cashier icon:', filename);
  }

  await makeCashierIcon(192, 'public/icon-cashier-192.png');
  await makeCashierIcon(512, 'public/icon-cashier-512.png');
  await makeCashierIcon(180, 'public/apple-touch-icon-cashier.png');
  console.log('ALL ICONS GENERATED SUCCESSFULLY!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
