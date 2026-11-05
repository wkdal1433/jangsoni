import walkSource from '../../assets/mascot/runtime/walk.webp';

export const mascotAtlas = {
  src: walkSource,
  stand: [0, 0, 384, 512],
  walk: [1, 2, 3, 4, 5, 6, 7].map(cell => [(cell % 4) * 384, Math.floor(cell / 4) * 512, 384, 512])
};
