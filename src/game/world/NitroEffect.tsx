import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { rewardVisuals } from '../config/gameplay';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { WorldSimulation } from '../motion/useDrivingSimulation';
import { useMemo } from 'react';

/** Cosmetic only: simulation speed is entirely owned by phaseSpeed().
 * The flames are fixed geometry that only translates with the car and use gradients, not
 * BlurMask: a blurred path forces an offscreen GPU mask and blur pass every frame, which
 * became visible once nitro lasted a whole traffic section. */
export function NitroEffect({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  const { game, reducedMotion, lateral } = simulation;
  const { camera, playerDepth } = layout;
  const empty = useMemo(() => Skia.Path.Make(), []);
  const flames = useMemo(() => {
    const p = projectWorld(camera, { lateral: 0, distance: playerDepth });
    const width = camera.nearLaneWidth / playerDepth;
    const top = p.y - 6, bottom = p.y + width * 0.56;
    const glow = Skia.PathBuilder.Make(), core = Skia.PathBuilder.Make();
    for (const side of [-1, 1]) {
      const x = p.x + side * width * 0.24;
      glow.addPoly([{ x: x - width * 0.085, y: top }, { x: x + width * 0.085, y: top },
        { x: x + width * 0.03, y: bottom }, { x: x - width * 0.03, y: bottom }], true);
      core.addPoly([{ x: x - width * 0.035, y: p.y - 5 }, { x: x + width * 0.035, y: p.y - 5 },
        { x: x + width * 0.01, y: p.y + width * 0.48 }, { x: x - width * 0.01, y: p.y + width * 0.48 }], true);
    }
    return { glow: glow.detach(), core: core.detach(), top, bottom };
  }, [camera, playerDepth]);
  const opacity = useDerivedValue(() => {
    const state = game.value;
    const remaining = state.nitroUntil - state.elapsed;
    if (remaining <= 0 || reducedMotion.value || state.phase === 'gameOver') return 0;
    const shown = Math.max(0, state.elapsed - state.nitroStart);
    return Math.max(0, Math.min(1, shown / rewardVisuals.nitroFadeInSeconds, remaining / rewardVisuals.nitroFadeOutSeconds)) * 0.62;
  });
  const transform = useDerivedValue(() => [{
    translateX: projectWorld(camera, { lateral: lateral.value, distance: playerDepth }).x - camera.centerX,
  }], [camera, playerDepth, lateral]);
  const lines = useDerivedValue(() => {
    if (game.value.nitroUntil <= game.value.elapsed || reducedMotion.value || game.value.phase === 'gameOver') return empty;
    const builder = Skia.PathBuilder.Make().setIsVolatile(true);
    for (let i = 0; i < rewardVisuals.nitroLines; i++) {
      const phase = (game.value.elapsed * 1.8 + i / rewardVisuals.nitroLines) % 1;
      const side = i % 2 ? 1 : -1;
      const near = 1.3 + phase * 1.5;
      const a = projectWorld(camera, { lateral: side * 1.36, distance: near });
      const b = projectWorld(camera, { lateral: side * 1.36, distance: near + 0.12 });
      if (a.y > layout.height * 0.63) { builder.moveTo(a.x, a.y); builder.lineTo(b.x, b.y); }
    }
    return builder.detach();
  });
  return <Group opacity={opacity}>
    <Group transform={transform}>
      <Path path={flames.glow}>
        <LinearGradient start={vec(0, flames.top)} end={vec(0, flames.bottom)} colors={['#38BEFFCC', '#38BEFF55', '#38BEFF00']} positions={[0, 0.45, 1]} />
      </Path>
      <Path path={flames.core} opacity={0.85}>
        <LinearGradient start={vec(0, flames.top)} end={vec(0, flames.bottom)} colors={['#F2FCFF', '#AAEEFF', '#AAEEFF00']} positions={[0, 0.5, 1]} />
      </Path>
    </Group>
    <Path path={lines} color="#A0DFFF" style="stroke" strokeWidth={2} opacity={0.6} />
  </Group>;
}
