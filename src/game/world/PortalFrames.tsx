import { BlurMask, Group, Oval, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { palette } from '../config/visual';
import type { SceneLayout } from '../geometry/perspective';
import { portalProjection, portalTone } from '../geometry/entities';
import type { WorldSimulation } from '../motion/useDrivingSimulation';
import { useMemo } from 'react';

function Frame({ layout, simulation, lane }: { layout: SceneLayout; simulation: WorldSimulation; lane: number }) {
  const { game } = simulation;
  const empty = useMemo(() => Skia.Path.Make(), []);
  const geometry = useDerivedValue(() => portalProjection(layout, game.value, lane), [layout, game, lane]);
  const path = useDerivedValue(() => {
    if (geometry.value.opacity <= 0) return empty;
    const p = geometry.value, builder = Skia.PathBuilder.Make().setIsVolatile(true);
    for (const x of [p.x + 3, p.x + p.width - 3]) {
      const y = p.y + p.labelHeight - 3;
      builder.addPoly([{ x: x - 1.5, y }, { x: x + 1.5, y },
        { x: x + 1.5, y: p.foot.y }, { x: x - 1.5, y: p.foot.y }], true);
    }
    return builder.detach();
  });
  const color = useDerivedValue(() => {
    const tone = portalTone(game.value, lane);
    return tone === 'correct' ? '#50E3AD' : tone === 'wrong' ? '#FF7A87' : palette.cyan;
  });
  const opacity = useDerivedValue(() => geometry.value.opacity);
  const x = useDerivedValue(() => geometry.value.x), y = useDerivedValue(() => geometry.value.foot.y - 5);
  const width = useDerivedValue(() => geometry.value.width);
  return <Group opacity={opacity}>
    <Oval x={x} y={y} width={width} height={10} color={color} opacity={0.3}><BlurMask blur={7} style="normal" /></Oval>
    <Path path={path} color={color}><BlurMask blur={4} style="normal" /></Path>
    <Path path={path} color={color} />
  </Group>;
}

export function PortalFrames({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  return <Group>{[-1, 0, 1].map(lane => <Frame key={lane} layout={layout} simulation={simulation} lane={lane} />)}</Group>;
}
