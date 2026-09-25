// Renders a map's real scenery shaders (backdrop + ScenerySurfaces + Road) at two distances with
// CanvasKit and reports how much of the NEAR scenery stays still. Anything close to the road that
// does not move is a bug: it comes from the fixed backdrop plate (see docs/city/maps-agent-prompt.md).
//
//   node node_modules/typescript/bin/tsc -p tsconfig.geometry.json
//   node scripts/render-map-motion.cjs <map> [outDir] [width height]
//
// Writes <map>-<w>x<h>-a.png, -b.png and -static.png (red = textured near blocks that did not change).
const fs = require('node:fs');
const path = require('node:path');
const root = path.dirname(require.resolve('../package.json'));
const qa = p => require(path.join(root, '.qa/geometry', p));
const { mapThemes } = qa('config/maps.js');
const { driving } = qa('config/driving.js');
const { createSceneLayout, GROUND_PROJECTION_SKSL, groundQuad, unproject } = qa('geometry/perspective.js');
const { backdropPlacement } = qa('geometry/backdrop.js');
const { SCENERY_SURFACES_SKSL, sceneryUniforms } = qa('geometry/sceneryShader.js');
const { positiveModulo } = qa('motion/simulation.js');
const skiaRequire = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json', { paths: [root] }));

// The road shader still lives in its component; read it from source.
function roadSksl() {
  const src = fs.readFileSync(path.join(root, 'src/game/world/Road.tsx'), 'utf8');
  const start = src.indexOf('RuntimeEffect.Make(`') + 'RuntimeEffect.Make(`'.length;
  return src.slice(start, src.indexOf('`);', start)).replace('${GROUND_PROJECTION_SKSL}', GROUND_PROJECTION_SKSL);
}

async function renderMotion(mapId, outDir, width = 390, height = 844, distances = [3, 3.55]) {
  const theme = mapThemes[mapId];
  if (!theme) throw new Error(`Unknown or unregistered map: ${mapId}`);
  const CK = await skiaRequire('canvaskit-wasm')({ locateFile: f => path.join(path.dirname(skiaRequire.resolve('canvaskit-wasm')), f) });
  const layout = createSceneLayout(width, height, { top: 59, bottom: 34, left: 0, right: 0 }, 1);
  const { camera } = layout;
  const load = file => CK.MakeImageFromEncoded(fs.readFileSync(path.join(root, file)));
  const plateImage = load(theme.assets.backdrop), walls = load(theme.assets.walls);
  const asphalt = load(theme.assets.asphalt ?? 'assets/game/road/road_asphalt_tile.png');
  const plate = backdropPlacement(layout, plateImage.width(), plateImage.height(), theme.background);
  const pack = (effect, values) => {
    const floats = new Float32Array(effect.getUniformFloatCount());
    for (let i = 0; i < effect.getUniformCount(); i++) {
      const name = effect.getUniformName(i), info = effect.getUniform(i), v = [].concat(values[name]);
      if (v.length !== info.columns * info.rows) throw new Error(`Uniform ${name} has ${v.length} values`);
      floats.set(v, info.slot);
    }
    return floats;
  };
  const tile = (img, mode = CK.TileMode.Clamp) => img.makeShaderOptions(mode, mode, CK.FilterMode.Linear, CK.MipmapMode.None);
  const surfaces = CK.RuntimeEffect.Make(SCENERY_SURFACES_SKSL), road = CK.RuntimeEffect.Make(roadSksl());
  if (!surfaces || !road) throw new Error('A scenery shader failed to compile');
  const frame = distance => {
    const surface = CK.MakeSurface(width, height), canvas = surface.getCanvas();
    canvas.clear(CK.parseColorString(theme.colors.sky));
    canvas.drawImageRectOptions(plateImage, CK.XYWHRect(0, 0, plateImage.width(), plateImage.height()),
      CK.XYWHRect(plate.x, plate.y, plate.width, plate.height), CK.FilterMode.Linear, CK.MipmapMode.None, new CK.Paint());
    const s = new CK.Paint();
    s.setShader(surfaces.makeShaderWithChildren(pack(surfaces, sceneryUniforms(camera, theme, plate,
      [walls.width(), walls.height()], [plateImage.width(), plateImage.height()], distance)), [tile(walls), tile(plateImage)]));
    canvas.drawRect(CK.XYWHRect(0, 0, width, height), s);
    const r = new CK.Paint();
    r.setShader(road.makeShaderWithChildren(pack(road, {
      centerX: camera.centerX, horizon: camera.horizonY, groundHeight: camera.groundHeight, laneWidth: camera.nearLaneWidth,
      tileSize: asphalt.width(), hazeOpacity: theme.background.roadHazeOpacity, roadColor: [...theme.colors.asphalt], fogColor: [...theme.colors.fog],
      textureTravel: positiveModulo(distance, 1 / driving.road.textureRepeatsPerUnit), textureRepeats: driving.road.textureRepeatsPerUnit,
    }), [tile(asphalt, CK.TileMode.Repeat)]));
    const b = new CK.PathBuilder();
    b.addPolygon(groundQuad(camera, -1.5, 1.5, 120, driving.road.nearClip).map(p => [p.x, p.y]), true);
    canvas.drawPath(b.detach(), r);
    const image = surface.makeImageSnapshot();
    const pixels = image.readPixels(0, 0, { width, height, colorType: CK.ColorType.RGBA_8888, alphaType: CK.AlphaType.Unpremul, colorSpace: CK.ColorSpace.SRGB });
    const png = image.encodeToBytes();
    surface.delete();
    return { pixels, png };
  };
  const a = frame(distances[0]), bFrame = frame(distances[1]);
  // Near field: below the horizon, closer than 12 units, outside the three lanes. 12×12 px blocks.
  const block = 12, nearDepth = 12, static_ = new Uint8Array(width * height * 4);
  let near = 0, still = 0;
  for (let by = 0; by < height; by += block) for (let bx = 0; bx < width; bx += block) {
    const cx = bx + block / 2, cy = by + block / 2;
    if (cy <= camera.horizonY + 2) continue;
    const ground = unproject(camera, { x: cx, y: cy });
    if (ground.distance > nearDepth || Math.abs(ground.lateral) < 1.6) continue;
    // A flat block (e.g. inside one paving tile) cannot show motion either way; skip it.
    let sum = 0, sumSq = 0, count = 0;
    for (let y = by; y < Math.min(height, by + block); y++) for (let x = bx; x < Math.min(width, bx + block); x++) {
      const i = (y * width + x) * 4, luma = a.pixels[i] * .299 + a.pixels[i + 1] * .587 + a.pixels[i + 2] * .114;
      sum += luma; sumSq += luma * luma; count++;
    }
    if (Math.sqrt(Math.max(0, sumSq / count - (sum / count) ** 2)) < 6) continue;
    near++;
    let changed = false;
    for (let y = by; y < Math.min(height, by + block) && !changed; y++) for (let x = bx; x < Math.min(width, bx + block); x++) {
      const i = (y * width + x) * 4;
      if (Math.abs(a.pixels[i] - bFrame.pixels[i]) + Math.abs(a.pixels[i + 1] - bFrame.pixels[i + 1]) + Math.abs(a.pixels[i + 2] - bFrame.pixels[i + 2]) > 12) { changed = true; break; }
    }
    if (!changed) {
      still++;
      for (let y = by; y < Math.min(height, by + block); y++) for (let x = bx; x < Math.min(width, bx + block); x++) {
        const i = (y * width + x) * 4; static_[i] = 230; static_[i + 3] = 255;
      }
    }
  }
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${mapId}-${width}x${height}-a.png`), a.png);
    fs.writeFileSync(path.join(outDir, `${mapId}-${width}x${height}-b.png`), bFrame.png);
    const mask = CK.MakeImage({ width, height, alphaType: CK.AlphaType.Unpremul, colorType: CK.ColorType.RGBA_8888, colorSpace: CK.ColorSpace.SRGB }, static_, width * 4);
    fs.writeFileSync(path.join(outDir, `${mapId}-${width}x${height}-static.png`), mask.encodeToBytes());
  }
  return { map: mapId, width, height, nearBlocks: near, staticBlocks: still, staticShare: +(still / Math.max(1, near)).toFixed(3) };
}

module.exports = { renderMotion };
if (require.main === module) {
  const [map, outDir, w, h] = process.argv.slice(2);
  if (!map) { console.error('Usage: node scripts/render-map-motion.cjs <map> [outDir] [width height]'); process.exit(1); }
  renderMotion(map, outDir, w ? Number(w) : undefined, h ? Number(h) : undefined)
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => { console.error(error); process.exit(1); });
}
