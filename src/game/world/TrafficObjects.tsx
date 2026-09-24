import { BlurMask, Group, Image, Oval, type SkImage, type SkRect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { gameplay, objectVisuals } from '../config/gameplay';
import { CoinArtwork } from './WorldCoins';
import type { ProjectedEntity } from '../geometry/worldEntities';
import { trafficFrames, type TrafficVariant } from '../config/traffic';

export type TrafficImages = Record<TrafficVariant, SkImage>;
type Props = { traffic: TrafficImages; barrier: SkImage; front: boolean; entities: SharedValue<ProjectedEntity[]> };
const unitRect = { x: 0, y: 0, width: 1, height: 1 };

function VehicleArtwork({ kind, image, rect }: { kind: 'traffic' | 'barrier'; image: SkImage | SharedValue<SkImage>; rect?: SharedValue<SkRect> }) {
  const bounds = objectVisuals[kind];
  const width = bounds.right - bounds.left;
  return <Group>
    <Oval x={(bounds.left + bounds.right) / 2 - width * .46} y={bounds.bottom - width * .06}
      width={width * .92} height={width * .13} color="#071725" opacity={.32}>
      <BlurMask blur={.015} style="normal" />
    </Oval>
    <Image image={image} rect={rect ?? unitRect} fit="contain" />
  </Group>;
}

function ObjectSlot({ traffic, barrier, front, entities, rank }: Props & { rank: number }) {
  const appearance = useDerivedValue(() => {
    const p = entities.value[rank];
    return p?.kind === 'traffic' ? p.appearance : 'yellow';
  });
  // A single image per slot; appearance follows the object's ID through sorting.
  const trafficImage = useDerivedValue(() => traffic[appearance.value], [traffic, appearance]);
  const trafficRect = useDerivedValue(() => trafficFrames[appearance.value]);
  const transform = useDerivedValue(() => {
    const p = entities.value[rank];
    return [{ translateX: p?.x ?? 0 }, { translateY: p?.y ?? 0 }, { scale: p?.size ?? 1 }];
  });
  const trafficAlpha = useDerivedValue(() => {
    const p = entities.value[rank];
    return p?.kind === 'traffic' && p.front === front ? p.opacity : 0;
  });
  const barrierAlpha = useDerivedValue(() => {
    const p = entities.value[rank];
    return p?.kind === 'barrier' && p.front === front ? p.opacity : 0;
  });
  const coinAlpha = useDerivedValue(() => {
    const p = entities.value[rank];
    return p?.kind === 'coin' && p.front === front ? p.opacity : 0;
  });
  return <Group transform={transform}>
    <Group opacity={trafficAlpha}><VehicleArtwork kind="traffic" image={trafficImage} rect={trafficRect} /></Group>
    <Group opacity={barrierAlpha}><VehicleArtwork kind="barrier" image={barrier} /></Group>
    <Group opacity={coinAlpha}>
      <Oval x={0} y={1.115} width={1} height={.13} color="#071725" opacity={.22} />
      <Group transform={[{ translateX: .5 }, { translateY: .5 }, { scale: .5 }]}><CoinArtwork /></Group>
    </Group>
  </Group>;
}

export function TrafficObjects(props: Props) {
  return <Group>{Array.from({ length: gameplay.maxObjects + gameplay.maxCoins }, (_, rank) =>
    <ObjectSlot key={rank} {...props} rank={rank} />)}</Group>;
}
