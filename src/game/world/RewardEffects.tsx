import { Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { gameplay, rewardVisuals } from '../config/gameplay';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { WorldSimulation } from '../motion/useDrivingSimulation';
import { useMemo } from 'react';

function Burst({ layout, simulation, index }: { layout: SceneLayout; simulation: WorldSimulation; index: number }) {
  const { game, reducedMotion } = simulation;
  const empty = useMemo(() => Skia.Path.Make(), []);
  const path = useDerivedValue(() => {
    const effect = game.value.effects[index];
    if (!effect || effect.kind === 'wrong') return empty;
    const builder = Skia.PathBuilder.Make().setIsVolatile(true);
    const progress = Math.min(1, (game.value.elapsed - effect.at) / effect.duration);
    const point = projectWorld(layout.camera, { lateral: effect.lateral, distance: layout.playerDepth });
    if (effect.kind === 'coinLoss') {
      // Lost coins pop out of the car and fall behind it.
      const originY = point.y - layout.player.height * 0.5;
      if (reducedMotion.value) return builder.detach();
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI * (0.18 + 0.64 * i / 5);
        const reach = (i % 2 ? 58 : 44) * progress;
        builder.addCircle(point.x + Math.cos(angle) * reach, originY + Math.sin(angle) * reach * 1.3 + progress * progress * 90,
          6 * (1 - progress * .35));
      }
      return builder.detach();
    }
    if (effect.kind === 'crash') {
      // Sparks leave the car's front bumper, where every contact happens.
      const originY = point.y - layout.player.height * 0.62;
      if (reducedMotion.value) return builder.addCircle(point.x, originY, 12).detach();
      const spread = 1 - Math.pow(1 - progress, 2);
      for (let i = 0; i < rewardVisuals.crashParticles; i++) {
        const angle = -Math.PI * (0.08 + 0.84 * i / (rewardVisuals.crashParticles - 1));
        const reach = (i % 3 === 0 ? 70 : i % 3 === 1 ? 52 : 38) * spread;
        const x = point.x + Math.cos(angle) * (10 + reach);
        const y = originY + Math.sin(angle) * (6 + reach * .7) + progress * progress * 34;
        const length = 9 * (1 - progress * .7), width = 2.2 * (1 - progress * .5);
        const dx = Math.cos(angle), dy = Math.sin(angle);
        builder.addPoly([{ x: x + dx * length, y: y + dy * length }, { x: x - dy * width, y: y + dx * width },
          { x: x - dx * length * .4, y: y - dy * length * .4 }, { x: x + dy * width, y: y - dx * width }], true);
      }
      return builder.detach();
    }
    const originY = point.y - layout.player.height * 0.55;
    if (reducedMotion.value) {
      builder.addCircle(point.x, originY, 10);
    } else {
      const count = effect.kind === 'coin' ? rewardVisuals.coinParticles : rewardVisuals.answerParticles;
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI * 2 / count;
        const radius = (effect.kind === 'coin' ? 10 : 20) + (1 - Math.pow(1 - progress, 2)) * (effect.kind === 'coin' ? 16 : 52);
        const x = point.x + Math.cos(angle) * radius;
        const y = originY + Math.sin(angle) * radius * .65 + progress * progress * 18;
        const size = (effect.kind === 'coin' ? 2.6 : 4.5) * (1 - progress * .65);
        if (effect.kind === 'coin') builder.addCircle(x, y, size);
        else builder.addPoly([{ x, y: y - size }, { x: x + size * .6, y }, { x, y: y + size }, { x: x - size * .6, y }], true);
      }
    }
    return builder.detach();
  });
  const ring = useDerivedValue(() => {
    const e = game.value.effects[index];
    if (!e || e.kind === 'coin' || e.kind === 'coinLoss') return empty;
    const p = Math.min(1, (game.value.elapsed - e.at) / e.duration);
    const point = projectWorld(layout.camera, { lateral: e.lateral, distance: layout.playerDepth });
    const originY = point.y - layout.player.height * (e.kind === 'crash' ? .62 : .55);
    const radius = reducedMotion.value ? 23 : e.kind === 'correct' ? 20 + 48 * (1 - Math.pow(1 - p, 3))
      : e.kind === 'crash' ? 14 + 40 * (1 - Math.pow(1 - p, 4))
        : 23 + Math.sin(Math.min(1, p * 3) * Math.PI) * 9;
    return Skia.PathBuilder.Make().setIsVolatile(true).addCircle(point.x, originY, radius).detach();
  });
  const opacity = useDerivedValue(() => {
    const e = game.value.effects[index];
    return e ? Math.max(0, 1 - Math.pow((game.value.elapsed - e.at) / e.duration, 2)) * .9 : 0;
  });
  const color = useDerivedValue(() => {
    const kind = game.value.effects[index]?.kind;
    return kind === 'wrong' ? '#FF8296' : kind === 'crash' ? '#FF7A3D' : '#76FFD0';
  });
  const particleColor = useDerivedValue(() => {
    const kind = game.value.effects[index]?.kind;
    return kind === 'crash' ? '#FFC24D' : kind === 'coinLoss' ? '#FFD04A' : '#FFE391';
  });
  return <Group opacity={opacity}>
    <Path path={path} color={particleColor} />
    <Path path={ring} color={color} style="stroke" strokeWidth={2.5} opacity={.65} />
  </Group>;
}
export function RewardEffects({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  return <Group>{Array.from({ length: gameplay.maxEffects }, (_, index) => <Burst key={index} index={index} layout={layout} simulation={simulation} />)}</Group>;
}
