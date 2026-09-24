import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Canvas, LinearGradient, Rect, useImage, vec } from '@shopify/react-native-skia';
import { palette } from '../config/visual';
import { gameAssets } from '../config/assets';
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

export const GameWorld = memo(function GameWorld({ layout, simulation }: { layout: SceneLayout; simulation: WorldSimulation }) {
  const [assetError, setAssetError] = useState(false);
  const onAssetError = useCallback(() => setAssetError(true), []);
  const city = useImage(gameAssets.city, onAssetError);
  const player = useImage(gameAssets.player, onAssetError);
  const playerLeft = useImage(gameAssets.playerLeft, onAssetError);
  const playerRight = useImage(gameAssets.playerRight, onAssetError);
  const asphalt = useImage(gameAssets.asphalt, onAssetError);
  const facades = useImage(gameAssets.facades, onAssetError);
  const tree = useImage(gameAssets.tree, onAssetError);
  const traffic = useImage(gameAssets.traffic, onAssetError);
  const trafficBlue = useImage(gameAssets.trafficBlue, onAssetError);
  const trafficWhite = useImage(gameAssets.trafficWhite, onAssetError);
  const trafficGreen = useImage(gameAssets.trafficGreen, onAssetError);
  const trafficImages = useMemo<TrafficImages | null>(() => traffic && trafficBlue && trafficWhite && trafficGreen
    ? { yellow: traffic, blue: trafficBlue, white: trafficWhite, green: trafficGreen } : null,
  [traffic, trafficBlue, trafficWhite, trafficGreen]);
  const barrier = useImage(gameAssets.barrier, onAssetError);
  const { game } = simulation;
  const entities = useDerivedValue(() => projectEntities(layout, game.value), [layout, game]);
  const ready = !assetError && !!city && !!player && !!playerLeft && !!playerRight && !!asphalt && !!facades && !!tree && !!trafficImages && !!barrier;
  const { setReady } = simulation;
  useEffect(() => { setReady(ready); return () => setReady(false); }, [ready, setReady]);

  if (assetError || !city || !player || !playerLeft || !playerRight || !asphalt || !facades || !tree || !trafficImages || !barrier) {
    return <View style={styles.loading}>
      {assetError ? <Text accessibilityRole="alert" style={styles.error}>No se pudo cargar un asset del escenario. Revisa assets/game.</Text> : <ActivityIndicator accessibilityLabel="Cargando escenario" color={palette.navy} />}
    </View>;
  }

  const { width, height } = layout;
  return <Canvas style={styles.canvas} accessible={false}>
    <Rect x={0} y={0} width={width} height={height} color={palette.sky} />
    <CityBackdrop layout={layout} image={city} />
    <ScenerySurfaces layout={layout} image={facades} distance={simulation.distance} />
    <Road layout={layout} asphalt={asphalt} distance={simulation.distance} />
    <RoadsideTrees layout={layout} image={tree} distance={simulation.distance} />
    <TrafficObjects entities={entities} traffic={trafficImages} barrier={barrier} front={false} />
    <PortalFrames layout={layout} simulation={simulation} />
    <NitroEffect layout={layout} simulation={simulation} />
    <PlayerCar layout={layout} image={player} leftImage={playerLeft} rightImage={playerRight}
      lateral={simulation.lateral} turn={simulation.playerTurn} game={simulation.game} reducedMotion={simulation.reducedMotion} />
    <TrafficObjects entities={entities} traffic={trafficImages} barrier={barrier} front />
    <RewardEffects layout={layout} simulation={simulation} />
    <Rect x={0} y={height - 80} width={width} height={80}>
      <LinearGradient start={vec(0, height - 80)} end={vec(0, height)} colors={['#132C4500', '#132C4529']} />
    </Rect>
  </Canvas>;
});

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
  loading: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.sky },
  error: { color: palette.navy, textAlign: 'center', padding: 30, fontSize: 16 },
});
