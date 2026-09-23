import { useMemo } from 'react';
import { Atlas, FilterMode, MipmapMode, Skia, useColorBuffer, useRSXformBuffer, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { scenery } from '../config/scenery';
import type { SceneLayout } from '../geometry/perspective';
import { treeDepth, treePlacement } from '../geometry/scenery';

/** A fixed sprite pool, batched into one Skia draw, with distant trees first. */
export function RoadsideTrees({ layout, image, distance }: {
  layout: SceneLayout; image: SkImage; distance: SharedValue<number>;
}) {
  const { camera } = layout;
  const imageWidth = image.width(), imageHeight = image.height();
  const sprites = useMemo(() => Array.from({ length: scenery.trees.countPerSide * 2 },
    () => Skia.XYWHRect(0, 0, imageWidth, imageHeight)), [imageWidth, imageHeight]);
  const placements = useDerivedValue(() => {
    const positions = [];
    for (let index = scenery.trees.countPerSide - 1; index >= 0; index--) {
      for (const side of [-1, 1] as const) {
        const depth = treeDepth(index, distance.value, side);
        positions.push(treePlacement(camera, depth, side, imageWidth / imageHeight));
      }
    }
    return positions;
  }, [camera, distance, imageWidth, imageHeight]);
  // Reuse 52 native transforms/colors instead of allocating new objects each frame.
  const transforms = useRSXformBuffer(sprites.length, (transform, index) => {
    'worklet';
    const p = placements.value[index];
    transform.set(p.width / imageWidth, 0, p.x, p.y);
  });
  const colors = useColorBuffer(sprites.length, (color, index) => {
    'worklet';
    color[0] = 1; color[1] = 1; color[2] = 1; color[3] = placements.value[index].opacity;
  });

  return <Atlas image={image} sprites={sprites} transforms={transforms}
    colors={colors} colorBlendMode="modulate"
    sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />;
}
