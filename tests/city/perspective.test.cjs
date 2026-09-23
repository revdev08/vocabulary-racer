const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createSceneLayout, project, depthAtY } = require('../../.qa/geometry/geometry/perspective.js');
const { scene } = require('../../.qa/geometry/config/visual.js');
const { gameplay } = require('../../.qa/geometry/config/gameplay.js');
const { portalProjection } = require('../../.qa/geometry/geometry/entities.js');
const question = { phase:'question',phaseTime:0,distance:0,portalPosition:gameplay.decisionSpeed*gameplay.decisionSeconds };

// Check user-visible composition boundaries, including native safe areas.
for (const [width, height, top, bottom, density] of [
  [320, 568, 20, 16, 2],
  [360, 800, 32, 24, 3],
  [390, 844, 59, 34, 3],
  [430, 932, 59, 34, 3],
  [540, 1024, 24, 20, 3],
]) {
  test(`composition fits ${width} × ${height} with safe areas`, () => {
    const layout = createSceneLayout(width, height, { top, bottom, left: 0, right: 0 }, density);
    const portals=scene.laneCenters.map(l=>portalProjection(layout,question,l));
    assert.equal(portals.length, 3);
    assert.equal(scene.laneDividers.length, 2);
    assert.equal(layout.camera.centerX, width / 2);
    assert.ok(layout.hudTop >= top);
    const promptBottom = layout.prompt.y + layout.prompt.height;
    assert.ok(promptBottom < layout.camera.horizonY);
    for (const portal of portals) {
      assert.ok(portal.y > promptBottom + 16, 'card must not cover the choices');
      assert.ok(portal.x >= 0 && portal.x + portal.width <= width, 'all choices stay visible');
    }
    const carTop = layout.player.y + layout.player.height * scene.player.contentTop;
    assert.ok(portals.every(p=>p.y+p.labelHeight<carTop), 'choice labels must not overlap the car');
    assert.ok(layout.playerBaseY < height - bottom);
    assert.equal(layout.player.width, layout.player.height, 'preserve the square source ratio');
    assert.ok(layout.player.width * density <= scene.player.sourceSize, 'do not upscale the bitmap');
  });
}

test('lane boundaries and portal centers use the same central perspective', () => {
  const layout = createSceneLayout(390, 844, { top: 59, bottom: 34, left: 0, right: 0 });
  const {camera}=layout;
  const portals=scene.laneCenters.map(l=>portalProjection(layout,question,l));
  for (const z of [1, 2, 8, 30]) {
    const boundaries = [-1.5, -0.5, 0.5, 1.5].map(x => project(camera, x, z));
    const laneWidths = boundaries.slice(1).map((p, i) => p.x - boundaries[i].x);
    assert.ok(laneWidths.every(w => Math.abs(w - laneWidths[0]) < 1e-8));
    assert.ok(Math.abs(depthAtY(camera, boundaries[0].y) - z) < 1e-8);
  }
  portals.forEach((portal, i) => {
    const center = project(camera, scene.laneCenters[i], depthAtY(camera, portal.foot.y));
    assert.ok(Math.abs(center.x - portal.x - portal.width / 2) < 1e-8);
  });
});
