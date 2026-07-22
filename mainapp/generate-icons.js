import sharp from 'sharp';
import path from 'path';

const svgPath = path.resolve('public/loopers.svg');

// Helper to generate standard PNG from SVG
async function generatePng(width, height, outputPath) {
  await sharp(svgPath)
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`Generated ${outputPath} (${width}x${height})`);
}

// Helper to generate maskable PNG
async function generateMaskable(outputPath) {
  // Create a solid blue background of 512x512 matching loopers.svg background color
  const background = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 93, g: 167, b: 231, alpha: 1 }
    }
  });

  // Resize the logo to 320x320 to fit within the 60% safe area circle (308px diameter)
  const logoResized = await sharp(svgPath)
    .resize(320, 320, { fit: 'contain' })
    .toBuffer();

  // Composite the logo exactly in the center (512 - 320) / 2 = 96px padding
  await background
    .composite([{
      input: logoResized,
      top: 96,
      left: 96
    }])
    .png()
    .toFile(outputPath);
  
  console.log(`Generated maskable icon: ${outputPath}`);
}

async function run() {
  try {
    await generatePng(192, 192, 'public/pwa-192x192.png');
    await generatePng(512, 512, 'public/pwa-512x512.png');
    await generatePng(180, 180, 'public/apple-touch-icon.png');
    await generateMaskable('public/maskable-icon.png');
    console.log('All icons generated successfully.');
  } catch (err) {
    console.error('Error generating PWA icons:', err);
    process.exit(1);
  }
}

run();
