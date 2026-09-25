import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Group, LinearGradient, RadialGradient, Rect, useImage, vec } from '@shopify/react-native-skia';
import type { MapTheme } from '../config/maps';
import { resolveMapTheme } from '../data/mapTheme';
import { mapImageSources } from './mapImages';
import { gameAssets } from '../config/assets';
import { gameplay, rewardVisuals } from '../config/gameplay';
import type { SceneLayout } from '../geometry/perspective';
import { Road } from './Road';
import { PortalFrames } from './PortalFrames';
import { CityBackdrop } from './CityBackdrop';
import { PlayerCar } from './PlayerCar';
import { ScenerySurfaces } from './ScenerySurfaces';
import { RoadsideTrees } from './RoadsideTrees';
import { TrafficObjects, type TrafficImages } from './TrafficObjects';
import { RewardEffects } from './RewardEffects';
import { NitroEffect } from './NitroEffect';
import type { WorldSimulation } from '../motion/useDrivingSimulation';
import { useDerivedValue } from 'react-native-reanimated';
import { projectEntities } from '../geometry/worldEntities';
import { RaceLoading } from '../ui/RaceLoading';

export const GameWorld = memo(function GameWorld({ layout, simulation, eyebrow, title, levelId, review, map }: {
  layout: SceneLayout; simulation: WorldSimulation; eyebrow?: string; title?: string; levelId?: string; review?: boolean; map?: MapTheme;
}) {
  const theme = map ?? resolveMapTheme(levelId, review);
  const images = mapImageSources(theme);
  const [assetError, setAssetError] = useState(false);
  const onAssetError = useCallback(() => setAssetError(true), []);
  const city = useImage(images.backdrop, onAssetError);
  const player = useImage(gameAssets.player, onAssetError);
  const playerLeft = useImage(gameAssets.playerLeft, onAssetError);
  const playerRight = useImage(gameAssets.playerRight, onAssetError);
  const asphalt = useImage(images.asphalt, onAssetError);
  const facades = useImage(images.walls, onAssetError);
  const tree = useImage(images.roadside, onAssetError);
  const traffic = useImage(gameAssets.traffic, onAssetError);
  const trafficBlue = useImage(gameAssets.trafficBlue, onAssetError);
  const trafficWhite = useImage(gameAssets.trafficWhite, onAssetError);
  const trafficGreen = useImage(gameAssets.trafficGreen, onAssetError);
  const trafficImages = useMemo<TrafficImages | null>(() => traffic && trafficBlue && trafficWhite && trafficGreen
    ? { yellow: traffic, blue: trafficBlue, white: trafficWhite, green: trafficGreen } : null,
  [traffic, trafficBlue, trafficWhite, trafficGreen]);
  const barrier = useImage(gameAssets.barrier, onAssetError);
  const { game, reducedMotion } = simulation;
  const entities = useDerivedValue(() => projectEntities(layout, game.value), [layout, game]);
  // Seconds since the last collision that cost a life; invulnerableUntil is only set by those.
  const sinceCrash = useDerivedValue(() => game.value.invulnerableUntil > 0
    ? game.value.elapsed - (game.value.invulnerableUntil - gameplay.collisionProtectionSeconds) : Infinity);
  const camera = useDerivedValue(() => {
    const t = sinceCrash.value;
    if (reducedMotion.value || t < 0 || t > rewardVisuals.crashShakeSeconds) return [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }];
    const k = 1 - t / rewardVisuals.crashShakeSeconds;
    return [{ translateX: Math.sin(t * 72) * rewardVisuals.crashShakePixels * k },
      { translateY: Math.cos(t * 57) * rewardVisuals.crashShakePixels * .55 * k }, { scale: 1 + .03 * k }];
  });
  const flash = useDerivedValue(() => {
    const t = sinceCrash.value;
    return t < 0 || t > rewardVisuals.crashFlashSeconds ? 0
      : rewardVisuals.crashFlashOpacity * (1 - Math.pow(t / rewardVisuals.crashFlashSeconds, 2));
  });
  const ready = !assetError && !!city && !!player && !!playerLeft && !!playerRight && !!asphalt && !!facades && !!tree && !!trafficImages && !!barrier;
  const { setReady } = simulation;
  useEffect(() => { setReady(ready); return () => setReady(false); }, [ready, setReady]);

  if (assetError || !city || !player || !playerLeft || !playerRight || !asphalt || !facades || !tree || !trafficImages || !barrier) {
    return <RaceLoading eyebrow={eyebrow} title={title} error={assetError} />;
  }

  const { width, height } = layout;
  return <Canvas style={styles.canvas} accessible={false}>
    <Rect x={0} y={0} width={width} height={height} color={theme.colors.sky} />
    <Group transform={camera} origin={vec(width / 2, height / 2)}>
      <CityBackdrop theme={theme} layout={layout} image={city} />
      <ScenerySurfaces theme={theme} layout={layout} image={facades} distance={simulation.distance} />
      <Road theme={theme} layout={layout} asphalt={asphalt} distance={simulation.distance} />
      <RoadsideTrees theme={theme} layout={layout} image={tree} distance={simulation.distance} />
      <TrafficObjects entities={entities} traffic={trafficImages} barrier={barrier} front={false} />
      <PortalFrames layout={layout} simulation={simulation} />
      <NitroEffect layout={layout} simulation={simulation} />
      <PlayerCar layout={layout} image={player} leftImage={playerLeft} rightImage={playerRight}
        lateral={simulation.lateral} turn={simulation.playerTurn} game={simulation.game} reducedMotion={simulation.reducedMotion} />
      <TrafficObjects entities={entities} traffic={trafficImages} barrier={barrier} front />
      <RewardEffects layout={layout} simulation={simulation} />
    </Group>
    <Rect x={0} y={height - 80} width={width} height={80}>
      <LinearGradient start={vec(0, height - 80)} end={vec(0, height)} colors={['#132C4500', '#132C4529']} />
    </Rect>
    <Rect x={0} y={0} width={width} height={height} opacity={flash}>
      <RadialGradient c={vec(width / 2, height * .62)} r={Math.max(width, height) * .72} colors={['#E0203800', '#E0203855', '#E02038']} positions={[0.35, 0.7, 1]} />
    </Rect>
  </Canvas>;
});

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
});
