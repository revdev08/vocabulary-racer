import { useMemo } from 'react';
import { BlurMask, Group, ImageShader, Oval, Rect, Shader, Skia, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { projectWorld, type SceneLayout } from '../geometry/perspective';
import type { RunState } from '../gameplay/types';
import { playerFrameRect, PLAYER_TURN_SKSL } from '../geometry/playerFrames';

const turnEffect = Skia.RuntimeEffect.Make(PLAYER_TURN_SKSL);
if (!turnEffect) throw new Error('No se pudo preparar la transición de giro del carro.');

export function PlayerCar({ layout, image, leftImage, rightImage, lateral, turn, game, reducedMotion }: {
  layout: SceneLayout; image: SkImage; leftImage: SkImage; rightImage: SkImage;
  lateral: SharedValue<number>; turn: SharedValue<number>; game: SharedValue<RunState>; reducedMotion: SharedValue<boolean>;
}) {
  const { player: car, playerBaseY, playerDepth, camera } = layout;
  const leftRect = useMemo(() => playerFrameRect(layout, 'left'), [layout]);
  const rightRect = useMemo(() => playerFrameRect(layout, 'right'), [layout]);
  const uniforms = useDerivedValue(() => ({ turn: reducedMotion.value ? 0 : turn.value }));
  const transform = useDerivedValue(() => [{
    translateX: projectWorld(camera, { lateral: lateral.value, distance: playerDepth }).x - camera.centerX,
  }], [camera, playerDepth, lateral]);
  const opacity = useDerivedValue(() => game.value.elapsed < game.value.invulnerableUntil
    ? reducedMotion.value ? 0.8 : 0.65 + 0.35 * Math.abs(Math.cos(game.value.elapsed * Math.PI * 2)) : 1);

  return <Group transform={transform} opacity={opacity}>
    <Oval x={car.x + car.width * 0.015} y={playerBaseY - car.width * 0.09} width={car.width * 0.97} height={car.width * 0.20} color="#071725" opacity={0.38}>
      <BlurMask blur={car.width * 0.055} style="normal" />
    </Oval>
    <Oval x={car.x + car.width * 0.12} y={playerBaseY - car.width * 0.038} width={car.width * 0.76} height={car.width * 0.075} color="#091420" opacity={0.48}>
      <BlurMask blur={car.width * 0.023} style="normal" />
    </Oval>
    <Rect x={car.x} y={car.y} width={car.width} height={car.height}>
      <Shader source={turnEffect!} uniforms={uniforms}>
        <ImageShader image={image} rect={car} fit="contain" tx="decal" ty="decal" />
        <ImageShader image={leftImage} rect={leftRect} fit="contain" tx="decal" ty="decal" />
        <ImageShader image={rightImage} rect={rightRect} fit="contain" tx="decal" ty="decal" />
      </Shader>
    </Rect>
  </Group>;
}
