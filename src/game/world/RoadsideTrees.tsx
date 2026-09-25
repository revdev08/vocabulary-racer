import { useMemo } from 'react';
import { Atlas, FilterMode, MipmapMode, Skia, useColorBuffer, useRSXformBuffer, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { MapTheme } from '../config/maps';
import type { SceneLayout } from '../geometry/perspective';
import { treeDepth, treePlacement } from '../geometry/scenery';

/** A fixed sprite pool, batched into one Skia draw, with distant trees first. */
export function RoadsideTrees({ layout, image, distance, theme }: {
  layout: SceneLayout; image: SkImage; distance: SharedValue<number>; theme: MapTheme;
}) {
  const { camera } = layout;
  const trees = theme.roadside;
  const imageWidth = image.width(), imageHeight = image.height();
  const sprites = useMemo(() => Array.from({ length: trees.countPerSide * 2 },
    () => Skia.XYWHRect(0, 0, imageWidth, imageHeight)), [imageWidth, imageHeight, trees.countPerSide]);
  const placements = useDerivedValue(() => {
    const positions = [];
    for (let index = trees.countPerSide - 1; index >= 0; index--) {
      for (const side of [-1, 1] as const) {
        const depth = treeDepth(index, distance.value, side, trees);
        positions.push(treePlacement(camera, depth, side, imageWidth / imageHeight, trees, theme.solidUntil, theme.fadeEnd));
      }
    }
    return positions;
  }, [camera, distance, imageWidth, imageHeight, trees, theme.solidUntil, theme.fadeEnd]);
  // Reuse the active theme's fixed native transform/color pool every frame.
  const transforms = useRSXformBuffer(sprites.length, (transform, index) => {
    'worklet';
    const p = placements.value[index];
    transform.set(p.width / imageWidth, 0, p.x, p.y);
  });
  const colors = useColorBuffer(sprites.length, (color, index) => {
    'worklet';
    color[0] = trees.tint?.[0] ?? 1; color[1] = trees.tint?.[1] ?? 1; color[2] = trees.tint?.[2] ?? 1;
    color[3] = placements.value[index].opacity;
  });

  return <Atlas image={image} sprites={sprites} transforms={transforms}
    colors={colors} colorBlendMode="modulate"
    sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />;
}
