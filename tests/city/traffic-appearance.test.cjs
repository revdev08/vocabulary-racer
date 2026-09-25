const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { trafficVariants, trafficSpriteBounds, trafficFrames, trafficSourceSize } = require('../../.qa/geometry/config/traffic.js');
const { gameplay, objectVisuals } = require('../../.qa/geometry/config/gameplay.js');
const { createRun, advanceGame } = require('../../.qa/geometry/gameplay/engine.js');
const { makeTrafficPlan, objectsForPlan } = require('../../.qa/geometry/gameplay/patterns.js');
const { trafficAppearanceOrder } = require('../../.qa/geometry/gameplay/trafficAppearance.js');
const { createSceneLayout } = require('../../.qa/geometry/geometry/perspective.js');
const { objectProjection } = require('../../.qa/geometry/geometry/entities.js');
const { projectEntities } = require('../../.qa/geometry/geometry/worldEntities.js');

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const withoutAppearance = state => ({ ...state, objects: state.objects.map(({ appearance, ...object }) => object) });

test('every traffic block mixes all four models without immediate repeats or changing its plan', () => {
  const orders = new Set();
  // The short first block holds fewer cars; each car still gets a different model until all four appear.
  for (let seed = 1; seed <= 80; seed++) for (const plan of [createRun(seed * 94661).plan, makeTrafficPlan(seed * 94661, 0, 3, null)]) {
    const snapshot = structuredClone(plan);
    const objects = objectsForPlan(plan, 13, 7);
    const cars = objects.filter(object => object.kind === 'traffic');
    assert.equal(new Set(cars.map(car => car.appearance)).size, Math.min(cars.length, trafficVariants.length));
    if (plan.encounters.length === gameplay.advancedEncounters)
      assert.deepEqual([...new Set(cars.map(car => car.appearance))].sort(), [...trafficVariants].sort());
    cars.forEach((car, i) => { if (i) assert.notEqual(car.appearance, cars[i - 1].appearance); });
    assert.ok(objects.filter(object => object.kind === 'barrier').every(object => object.appearance === undefined));
    assert.deepEqual(objects, objectsForPlan(plan, 13, 7));
    assert.deepEqual(plan, snapshot);
    orders.add(trafficAppearanceOrder(plan.seed, 7).join(','));
  }
  assert.ok(orders.size > 12, 'the cosmetic order varies between runs');
});

test('appearance stays with a car through movement, contacts and depth sorting; physics stays identical', () => {
  const layout = createSceneLayout(390, 844, { top: 59, bottom: 34, left: 0, right: 0 });
  for (const seed of [81, 612, 9246]) {
    let painted = createRun(seed), plain = withoutAppearance(painted);
    const assigned = new Map(painted.objects.map(object => [object.id, object.appearance]));
    for (let frame = 0; frame < 240; frame++) {
      painted = advanceGame(painted, 1 / 60, 0);
      plain = advanceGame(plain, 1 / 60, 0);
      assert.deepEqual(withoutAppearance(painted), withoutAppearance(plain));
      for (const object of painted.objects) if (assigned.has(object.id)) assert.equal(object.appearance, assigned.get(object.id));
      for (const projected of projectEntities(layout, painted)) {
        if (projected.kind === 'traffic') {
          assert.equal(projected.appearance, painted.objects.find(object => object.id === projected.id).appearance);
        }
      }
    }
  }
});

test('all sprites retain their proportions, visible lane width and wheel baseline at every depth', () => {
  const canonical = objectVisuals.traffic;
  assert.deepEqual(trafficFrames.yellow, { x: 0, y: 0, width: 1, height: 1 });
  for (const [width, height] of [[320, 640], [390, 844], [430, 932]]) {
    const layout = createSceneLayout(width, height, { top: 59, bottom: 34, left: 0, right: 0 });
    for (const appearance of trafficVariants) for (const lane of [-1, 0, 1]) for (const position of [-0.1, 0, 1, 8]) {
      const object = { id: 1, kind: 'traffic', lane, position, speed: .2, contacted: false, appearance };
      const p = objectProjection(layout, object, 0);
      const b = trafficSpriteBounds[appearance], rect = trafficFrames[appearance];
      close(rect.width, rect.height);
      close(p.x + p.size * (rect.x + rect.width * (b.left + b.right) / 2), p.foot.x);
      close(p.y + p.size * (rect.y + rect.height * b.bottom), p.foot.y);
      close(p.size * rect.width * (b.right - b.left), p.visibleWidth);
      close(rect.width * (b.right - b.left), canonical.right - canonical.left);
      const { appearance: _, ...original } = object;
      assert.deepEqual(objectProjection(layout, original, 0), p);
    }
  }
});

test('all four real PNGs are transparent cutouts and match the registered visible bounds', async () => {
  const skiaRequire = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK = await skiaRequire('canvaskit-wasm')({ locateFile: file => path.join(path.dirname(skiaRequire.resolve('canvaskit-wasm')), file) });
  const files = { yellow: 'traffic_car_yellow.png', blue: 'traffic_hatchback_blue.png', white: 'traffic_suv_white.png', green: 'traffic_sedan_green.png' };
  for (const variant of trafficVariants) {
    const image = CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname, '../../assets/game/traffic', files[variant])));
    assert.ok(image, files[variant]);
    try {
      const w = image.width(), h = image.height();
      assert.equal(w, trafficSourceSize); assert.equal(h, trafficSourceSize);
      const pixels = image.readPixels(0, 0, { width: w, height: h, colorType: CK.ColorType.RGBA_8888, alphaType: CK.AlphaType.Unpremul, colorSpace: CK.ColorSpace.SRGB });
      let left = w, right = 0, top = h, bottom = 0, clear = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const alpha = pixels[(y * w + x) * 4 + 3];
        if (alpha === 0) clear++;
        if (alpha > 32) { left = Math.min(left, x); right = Math.max(right, x + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1); }
      }
      assert.ok(clear / (w * h) > .4, 'transparent margins, not an opaque background');
      assert.ok(left > 20 && right < w - 20 && top > 20 && bottom < h - 20, 'the complete visible silhouette has margins');
      const actual = { left, right, top, bottom };
      for (const edge of Object.keys(actual)) assert.ok(Math.abs(trafficSpriteBounds[variant][edge] * w - actual[edge]) <= 2, `${variant}: ${edge}`);
      const center = (Math.floor(h * .65) * w + Math.floor(w / 2)) * 4 + 3;
      assert.ok(pixels[center] >= 250, 'the body remains effectively opaque, including the approved yellow PNG');
    } finally { image.delete(); }
  }
});
