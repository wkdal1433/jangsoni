import { readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

async function imageData(file) {
  const data = await readFile(file);
  return `data:image/${extname(file).slice(1)};base64,${data.toString('base64')}`;
}

function blinkFrame(asset, image, prefix) {
  const [width, height] = asset.size;
  const alignment = prefix === 'companion' ? 'xMidYMax meet' : 'xMidYMid meet';
  const eyes = asset.eyes.map(([cx, cy, rx, ry]) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${prefix}-blink-edge)"/>`
  ).join('\n');
  return `<svg class="${prefix}-closed-frame" aria-hidden="true" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${alignment}">
    <defs>
      <radialGradient id="${prefix}-blink-edge">
        <stop offset="${asset.edge}" stop-color="white"/>
        <stop offset="1" stop-color="white" stop-opacity="0"/>
      </radialGradient>
      <mask id="${prefix}-blink-eyes" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
        ${eyes}
      </mask>
    </defs>
    <image href="${image}" width="${width}" height="${height}" preserveAspectRatio="none" mask="url(#${prefix}-blink-eyes)"/>
  </svg>`;
}

export async function loadMascotAssets(root) {
  const selection = JSON.parse(await readFile(join(root, 'src/mascot-assets.json'), 'utf8'));
  const file = join(root, selection.pack);
  const profile = JSON.parse(await readFile(file, 'utf8'));
  const loadImage = image => imageData(join(dirname(file), image));
  const [hero, heroBlink, walk, companion, companionBlink] = await Promise.all([
    loadImage(profile.hero.image),
    loadImage(profile.hero.blinkImage),
    loadImage(profile.journey.image),
    loadImage(profile.companion.image),
    loadImage(profile.companion.blinkImage),
  ]);

  return {
    html: {
      HERO_IMAGE: hero,
      HERO_BLINK_FRAME: blinkFrame(profile.hero, heroBlink, 'mascot'),
      COMPANION_BLINK_FRAME: blinkFrame(profile.companion, companionBlink, 'companion'),
    },
    runtime: {
      atlas: { src: walk, stand: profile.journey.stand, walk: profile.journey.walk },
      companion,
    },
  };
}
