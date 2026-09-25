import { useMemo } from 'react';
import { Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { MapTheme } from '../config/maps';
import type { SceneLayout } from '../geometry/perspective';
import { snowflakes } from '../geometry/weather';
import type { WorldSimulation } from '../motion/useDrivingSimulation';

/** Two plain paths rebuilt per frame (near and far flakes): no blur, no layers. */
function Snowfall({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  const { game, distance, reducedMotion } = simulation;
  const { camera, width, height } = layout;
  const empty = useMemo(() => Skia.Path.Make(), []);
  const flakes = useDerivedValue(() => reducedMotion.value ? []
    : snowflakes(camera, width, height, game.value.elapsed, distance.value), [camera, width, height]);
  const build = (near: boolean) => {
    'worklet';
    if (!flakes.value.length) return empty;
    const builder = Skia.PathBuilder.Make().setIsVolatile(true);
    for (const flake of flakes.value) if (flake.near === near) builder.addCircle(flake.x, flake.y, flake.r);
    return builder.detach();
  };
  const far = useDerivedValue(() => build(false));
  const near = useDerivedValue(() => build(true));
  return <Group>
    <Path path={far} color="#EEF4FF" opacity={0.65} />
    <Path path={near} color="#F7FAFF" opacity={0.9} />
  </Group>;
}

export function Weather({ layout, simulation, theme }: { layout: SceneLayout; simulation: WorldSimulation; theme: MapTheme }) {
  return theme.weather === 'snow' ? <Snowfall layout={layout} simulation={simulation} /> : null;
}
