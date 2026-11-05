import { readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

async function imageData(file) {
  const data = await readFile(file);
  return `data:image/${extname(file).slice(1)};base64,${data.toString('base64')}`;
}

function mirroredHero(hero, image) {
  const [width, height] = hero.size;
  const upright = (hero.upright || []).map(([x, y, w, h], index) => `
    <mask id="upright-${index}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
      <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="white" filter="url(#soft-edge)"/>
    </mask>`).join('');
  const labels = (hero.upright || []).map(([x, y, w, h], index) => `
    <svg x="${width - x - w}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">
      <use href="#hero-source" mask="url(#upright-${index})"/>
    </svg>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <image id="hero-source" href="${image}" width="${width}" height="${height}"/>
      <filter id="soft-edge"><feGaussianBlur stdDeviation="2"/></filter>
      ${upright}
    </defs>
    <use href="#hero-source" transform="translate(${width} 0) scale(-1 1)"/>
    ${labels}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function blinkFrame(asset, image, prefix, mirrored) {
  const [width, height] = asset.size;
  const alignment = prefix === 'companion' ? 'xMidYMax meet' : 'xMidYMid meet';
  const reflection = mirrored ? ' style="transform:scaleX(-1);transform-origin:50% 50%"' : '';
  const eyes = asset.eyes.map(([cx, cy, rx, ry]) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${prefix}-blink-edge)"/>`
  ).join('\n');
  return `<svg class="${prefix}-closed-frame" aria-hidden="true" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${alignment}"${reflection}>
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
      HERO_IMAGE: profile.mirrored ? mirroredHero(profile.hero, hero) : hero,
      HERO_BLINK_FRAME: blinkFrame(profile.hero, heroBlink, 'mascot', profile.mirrored),
      COMPANION_BLINK_FRAME: blinkFrame(profile.companion, companionBlink, 'companion', profile.mirrored),
    },
    runtime: {
      mirrored: profile.mirrored,
      atlas: { src: walk, stand: profile.journey.stand, walk: profile.journey.walk },
      companion,
    },
  };
}
