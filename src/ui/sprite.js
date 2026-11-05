export function mountAtlas(parent, source, crop, className, mirrored = false) {
  const namespace = 'http://www.w3.org/2000/svg';
  const sprite = document.createElementNS(namespace, 'svg');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.setAttribute('class', className);
  sprite.setAttribute('width', crop[2]);
  sprite.setAttribute('height', crop[3]);
  sprite.setAttribute('viewBox', crop.join(' '));
  sprite.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  if (mirrored) {
    sprite.style.transform = 'scaleX(-1)';
    sprite.style.transformOrigin = '50% 50%';
  }

  const image = document.createElementNS(namespace, 'image');
  image.setAttribute('href', source.src);
  image.setAttribute('width', source.naturalWidth);
  image.setAttribute('height', source.naturalHeight);
  sprite.append(image);
  parent.append(sprite);
  return sprite;
}
