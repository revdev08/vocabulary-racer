import { BlurMask, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { gameplay, rewardVisuals } from '../config/gameplay';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { WorldSimulation } from '../motion/useDrivingSimulation';
import { useMemo } from 'react';

/** Cosmetic only: simulation speed is entirely owned by phaseSpeed(). */
export function NitroEffect({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  const { game, reducedMotion } = simulation;
  const empty = useMemo(() => Skia.Path.Make(), []);
  const opacity = useDerivedValue(() => {
    const remaining = game.value.nitroUntil - game.value.elapsed;
    const elapsed = gameplay.nitroSeconds - remaining;
    if (remaining <= 0 || reducedMotion.value || game.value.phase === 'gameOver') return 0;
    return Math.min(1, elapsed / rewardVisuals.nitroFadeInSeconds, remaining / rewardVisuals.nitroFadeOutSeconds) * 0.62;
  });
  const trail = useDerivedValue(() => {
    if (game.value.nitroUntil <= game.value.elapsed || reducedMotion.value || game.value.phase === 'gameOver') return empty;
    const p = projectWorld(layout.camera, { lateral: game.value.lateral, distance: layout.playerDepth });
    const width = layout.camera.nearLaneWidth / layout.playerDepth;
    const builder = Skia.PathBuilder.Make().setIsVolatile(true);
    for (const side of [-1, 1]) {
      const x = p.x + side * width * 0.24;
      builder.addPoly([{ x: x - width * 0.035, y: p.y - 5 }, { x: x + width * 0.035, y: p.y - 5 },
        { x: x + width * 0.01, y: p.y + width * 0.48 }, { x: x - width * 0.01, y: p.y + width * 0.48 }], true);
    }
    return builder.detach();
  });
  const lines = useDerivedValue(() => {
    if (game.value.nitroUntil <= game.value.elapsed || reducedMotion.value || game.value.phase === 'gameOver') return empty;
    const builder = Skia.PathBuilder.Make().setIsVolatile(true);
    for (let i = 0; i < rewardVisuals.nitroLines; i++) {
      const phase = (game.value.elapsed * 1.8 + i / rewardVisuals.nitroLines) % 1;
      const side = i % 2 ? 1 : -1;
      const near = 1.3 + phase * 1.5;
      const a = projectWorld(layout.camera, { lateral: side * 1.36, distance: near });
      const b = projectWorld(layout.camera, { lateral: side * 1.36, distance: near + 0.12 });
      if (a.y > layout.height * 0.63) { builder.moveTo(a.x, a.y); builder.lineTo(b.x, b.y); }
    }
    return builder.detach();
  });
  return <Group opacity={opacity}>
    <Path path={trail} color="#38BEFF"><BlurMask blur={9} style="normal" /></Path>
    <Path path={trail} color="#AAEEFF" opacity={0.8} />
    <Path path={lines} color="#A0DFFF" style="stroke" strokeWidth={2} opacity={0.6} />
  </Group>;
}
