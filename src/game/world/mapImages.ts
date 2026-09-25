import { gameAssets } from '../config/assets';
import type { MapTheme } from '../config/maps';

// Metro requires literal paths. These are asset references, not decoded images.
const sources: Record<string, number> = {
  'assets/game/backgrounds/background_city_v3.png': gameAssets.city,
  'assets/game/scenery/facades_city.png': gameAssets.facades,
  'assets/game/scenery/tree_planter.png': gameAssets.tree,
  'assets/game/maps/coast/backdrop.png': require('../../../assets/game/maps/coast/backdrop.png'),
  'assets/game/maps/coast/walls.png': require('../../../assets/game/maps/coast/walls.png'),
  'assets/game/maps/coast/roadside.png': require('../../../assets/game/maps/coast/roadside.png'),
  'assets/game/maps/mountain/backdrop.png': require('../../../assets/game/maps/mountain/backdrop.png'),
  'assets/game/maps/mountain/walls.png': require('../../../assets/game/maps/mountain/walls.png'),
  'assets/game/maps/mountain/roadside.png': require('../../../assets/game/maps/mountain/roadside.png'),
  'assets/game/maps/desert/backdrop.png': require('../../../assets/game/maps/desert/backdrop.png'),
  'assets/game/maps/desert/walls.png': require('../../../assets/game/maps/desert/walls.png'),
  'assets/game/maps/desert/roadside.png': require('../../../assets/game/maps/desert/roadside.png'),
  'assets/game/maps/sunset/backdrop.png': require('../../../assets/game/maps/sunset/backdrop.png'),
  'assets/game/maps/sunset/walls.png': require('../../../assets/game/maps/sunset/walls.png'),
};
export function mapImageSources(theme: MapTheme) {
  return { backdrop: sources[theme.assets.backdrop], walls: sources[theme.assets.walls],
    roadside: sources[theme.assets.roadside], asphalt: theme.assets.asphalt ? sources[theme.assets.asphalt] : gameAssets.asphalt };
}
