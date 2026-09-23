import { scenery } from './scenery';

export const palette = {
  ink: '#152C46',
  navy: '#142D49',
  glass: 'rgba(18, 44, 73, 0.91)',
  white: '#FFFFFF',
  sky: '#80BCF8',
  cyan: '#8CF1F1',
  mint: '#A8F3D5',
  gold: '#FFD470',
  coral: '#FA6577',
  asphalt: '#47545F',
  roadLine: '#F6F1DD',
  portal: '#ECFCFF',
} as const;

export const scene = {
  laneCount: 3,
  laneCenters: [-1, 0, 1],
  laneDividers: [-0.5, 0.5],
  maxViewportWidth: 540,
  background: {
    // Elevated city plate: vanishing point and asphalt/curb slope measured in source pixels.
    vanishingPoint: { x: 0.496, y: 0.441 },
    curbSlope: 0.47,
    widthScale: 1.22,
    // The asphalt ends just outside the three playable lanes (road edge = 1.5).
    curbLaneOffset: scenery.curb,
    atmosphereOpacity: 0.04,
    roadHazeOpacity: 0.12,
  },
  player: {
    sourceSize: 1254,
    // Measured opaque content in the supplied square PNG. The file is not cropped.
    contentTop: 208 / 1254,
    contentBottom: 1032 / 1254,
    contentLeft: 40 / 1254,
    contentRight: 1212 / 1254,
    visibleLaneWidth: 0.90,
    maxWidthFraction: 0.68,
  },
} as const;
