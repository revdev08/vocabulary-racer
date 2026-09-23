const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { advancePlayerTurn } = require('../../.qa/geometry/motion/playerTurn.js');
const { advanceLateral, advanceClock, changeLane } = require('../../.qa/geometry/motion/simulation.js');
const { playerAnimation } = require('../../.qa/geometry/config/playerAnimation.js');
const { scene } = require('../../.qa/geometry/config/visual.js');
const { playerFrameRect, PLAYER_TURN_SKSL } = require('../../.qa/geometry/geometry/playerFrames.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');

function step(state, target, dt) {
  const x = advanceLateral(state.x, target, dt);
  return { x, turn: advancePlayerTurn(state.turn, state.x, x, dt) };
}

test('turn sprites follow real travel in either direction, then settle back to the original', () => {
  for (const target of [-1, 1]) {
    let state = { x: 0, turn: 0 };
    let peak = 0;
    for (let i = 0; i < 72; i++) {
      state = step(state, target, 1 / 120);
      assert.ok(state.turn * target >= 0 && Math.abs(state.turn) <= 1);
      peak = Math.max(peak, Math.abs(state.turn));
      if (i === 11) assert.ok(Math.abs(state.turn) > 0.95, 'turn is clearly visible within 100ms');
    }
    assert.ok(peak > 0.99);
    assert.equal(state.turn, 0);
    assert.equal(state.x, target);
  }
});

test('reversing during a maneuver changes pose promptly and consecutive swipes remain bounded', () => {
  let state = { x: 0, turn: 0 };
  for (let i = 0; i < 12; i++) state = step(state, -1, 1 / 120);
  assert.ok(state.turn < -0.95);
  for (let i = 0; i < 6; i++) state = step(state, 0, 1 / 120);
  assert.ok(state.turn > 0.8, 'new direction visible within 50ms');
  for (let i = 0; i < 12; i++) state = step(state, 1, 1 / 120);
  assert.ok(state.turn > 0.98);
  for (let i = 0; i < 90; i++) state = step(state, 1, 1 / 120);
  for (let i = 0; i < 5; i++) state = step(state, changeLane(1, 1), 1 / 60);
  assert.deepEqual(state, { x: 1, turn: 0 }, 'a rejected swipe at the edge cannot fake another turn');
});

test('turn timing stays close at 30, 60 and 120Hz without a per-frame increment', () => {
  const traces = [30, 60, 120].map(hz => {
    let state = { x: 0, turn: 0 };
    const trace = [];
    for (let i = 0; i < hz; i++) {
      state = step(state, 1, 1 / hz);
      if ((i + 1) % (hz / 10) === 0) trace.push(state.turn);
    }
    return trace;
  });
  for (let i = 0; i < 10; i++) assert.ok(Math.max(...traces.map(t => t[i])) - Math.min(...traces.map(t => t[i])) < 0.04);
});

test('pause and background gaps freeze the pose, while reduced motion uses the straight sprite', () => {
  let state = step({ x: 0, turn: 0 }, -1, 0.05);
  const saved = state;
  const paused = advanceClock(100, 120, false);
  state = step(state, 1, paused.seconds);
  assert.deepEqual(state, saved);
  const resumed = advanceClock(paused.timestamp, 90000, true);
  assert.deepEqual(step(state, -1, resumed.seconds), saved);
  const stalled = advanceClock(100, 90000, true);
  assert.deepEqual(step(state, -1, stalled.seconds), saved);
  assert.equal(advancePlayerTurn(-1, -0.5, -0.8, 0.016, true), 0);
});

test('frame registration keeps scale, ground contact and lane alignment at narrow and tall sizes', () => {
  for (const [width, height, top, bottom] of [[320, 568, 20, 16], [390, 844, 59, 34], [430, 932, 59, 34], [540, 1024, 24, 20]]) {
    const layout = createSceneLayout(width, height, { top, bottom, left: 0, right: 0 }, 3);
    for (const pose of ['straight', 'left', 'right']) {
      const rect = playerFrameRect(layout, pose);
      const anchor = playerAnimation.frames[pose];
      const scale = rect.width / scene.player.sourceSize;
      assert.equal(rect.width, layout.player.width);
      assert.equal(rect.height, rect.width);
      assert.ok(Math.abs(rect.y + anchor.baseY * scale - layout.playerBaseY) < 1e-8);
      for (const lane of [-1, 0, 1]) {
        const foot = projectWorld(layout.camera, { lateral: lane, distance: layout.playerDepth });
        const x = rect.x + foot.x - layout.camera.centerX;
        assert.ok(Math.abs(x + anchor.centerX * scale - foot.x) < 1e-8);
        assert.ok(x >= 0 && x + rect.width <= width, 'the entire PNG fits even at the outer lanes');
      }
    }
  }
});

test('the real Skia shader preserves endpoint sprites and opacity through both transitions', async () => {
  // CanvasKit is supplied by the installed Skia package; no browser or new dependency.
  const skiaRequire = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const init = skiaRequire('canvaskit-wasm');
  const CK = await init({ locateFile: file => path.join(path.dirname(skiaRequire.resolve('canvaskit-wasm')), file) });
  const effect = CK.RuntimeEffect.Make(PLAYER_TURN_SKSL);
  assert.ok(effect, 'the shader compiles');
  const layout = createSceneLayout(390, 844, { top: 59, bottom: 34, left: 0, right: 0 }, 3);
  const files = ['car_player_red.png', 'car_player_red_left.png', 'car_player_red_right.png'];
  const poses = ['straight', 'left', 'right'];
  const images = files.map(file => CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname, '../../assets/game/player', file))));
  const children = images.map((image, i) => {
    assert.ok(image, files[i]);
    assert.equal(image.width(), scene.player.sourceSize);
    assert.equal(image.height(), scene.player.sourceSize);
    const rect = playerFrameRect(layout, poses[i]);
    const scale = rect.width / image.width();
    const matrix = CK.Matrix.multiply(CK.Matrix.translated(rect.x, rect.y), CK.Matrix.scaled(scale, scale));
    return image.makeShaderOptions(CK.TileMode.Decal, CK.TileMode.Decal, CK.FilterMode.Linear, CK.MipmapMode.None, matrix);
  });
  const surface = CK.MakeSurface(layout.width, layout.height);
  assert.ok(surface);
  const paint = new CK.Paint();
  const render = shader => {
    const canvas = surface.getCanvas();
    canvas.clear(CK.TRANSPARENT);
    paint.setShader(shader);
    canvas.drawRect(CK.XYWHRect(layout.player.x, layout.player.y, layout.player.width, layout.player.height), paint);
    const image = surface.makeImageSnapshot();
    const pixels = image.readPixels(0, 0, { width: layout.width, height: layout.height,
      colorType: CK.ColorType.RGBA_8888, alphaType: CK.AlphaType.Premul, colorSpace: CK.ColorSpace.SRGB });
    image.delete();
    assert.ok(pixels);
    return pixels;
  };
  try {
    const originals = children.map(render);
    for (const [turn, index] of [[0, 0], [-1, 1], [1, 2]]) {
      const shader = effect.makeShaderWithChildren([turn], children);
      try { assert.deepEqual(render(shader), originals[index], `endpoint ${turn} is the approved sprite`); }
      finally { shader.delete(); }
    }
    for (const turn of [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75]) {
      const shader = effect.makeShaderWithChildren([turn], children);
      try {
        const pixels = render(shader);
        const x = Math.round(layout.width / 2);
        const y = Math.round(layout.player.y + layout.player.height * 0.58);
        const alpha = (y * layout.width + x) * 4 + 3;
        const sourceAlpha = Math.min(originals[0][alpha], originals[turn < 0 ? 1 : 2][alpha]);
        assert.ok(pixels[alpha] >= 250 && pixels[alpha] >= sourceAlpha - 1,
          'the blend must not reduce the body opacity below the original PNGs');
        assert.equal(pixels[3], 0, 'the PNG background stays transparent');
      } finally { shader.delete(); }
    }
  } finally {
    paint.delete(); surface.delete(); children.forEach(shader => shader.delete());
    images.forEach(image => image.delete()); effect.delete();
  }
});
