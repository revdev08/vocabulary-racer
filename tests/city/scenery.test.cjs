const assert = require('node:assert/strict');
const { test } = require('node:test');
const { scenery } = require('../../.qa/geometry/config/scenery.js');
const { sceneryOpacity, treeDepth, treePlacement } = require('../../.qa/geometry/geometry/scenery.js');
const { createSceneLayout, projectWorld, unprojectWall } = require('../../.qa/geometry/geometry/perspective.js');
const { advanceClock } = require('../../.qa/geometry/motion/simulation.js');
const { driving } = require('../../.qa/geometry/config/driving.js');
const close = (a, b, epsilon = 1e-7) => assert.ok(Math.abs(a-b) < epsilon, `${a} != ${b}`);
const layouts = [[320,568,20,16],[390,844,59,34],[540,911,0,0]].map(([w,h,top,bottom]) =>
  createSceneLayout(w,h,{top,bottom,left:0,right:0}));

test('ground, wall bases and elevated scenery share a reversible camera', () => {
  for (const { camera } of layouts) for (const side of [-1,1]) {
    for (const distance of [1,3,10,24]) for (const elevation of [0,1.35,18]) {
      const world = {lateral:side*scenery.wall,distance,elevation};
      const screen = projectWorld(camera,world);
      const recovered = unprojectWall(camera,screen,world.lateral);
      close(recovered.distance,distance);
      close(recovered.elevation,elevation);
      const ground = projectWorld(camera,{...world,elevation:0});
      close(screen.x,ground.x);
      assert.ok(screen.y <= ground.y);
    }
  }
});

test('tree silhouettes stay outside playable lanes and retain sprite proportions', () => {
  for (const {camera} of layouts) for (const side of [-1,1]) for (const distance of [0.8,1.5,3,12,26]) {
    const tree = treePlacement(camera,distance,side,2/3);
    const curb = projectWorld(camera,{lateral:side*1.5,distance});
    const foot = projectWorld(camera,{lateral:side*scenery.trees.lateral,distance});
    close(tree.y+tree.height,foot.y);
    close(tree.width/tree.height,2/3);
    assert.ok(side===1 ? tree.x>curb.x : tree.x+tree.width<curb.x);
  }
});

test('approaching scenery grows, moves down and out, with a fixed horizon', () => {
  for (const {camera} of layouts) for (const side of [-1,1]) {
    const a = treePlacement(camera,4,side,2/3), b=treePlacement(camera,3.9,side,2/3);
    assert.ok(b.height>a.height);
    assert.ok(b.y+b.height>a.y+a.height);
    assert.ok(Math.abs(b.x+b.width/2-camera.centerX)>Math.abs(a.x+a.width/2-camera.centerX));
    const far=projectWorld(camera,{lateral:side*scenery.wall,distance:1e12,elevation:18});
    close(far.x,camera.centerX);
    close(far.y,camera.horizonY);
  }
});

test('tree recycling is continuous and both pool ends are invisible', () => {
  const {spacing, countPerSide, near, rightOffset}=scenery.trees;
  for(const side of [-1,1]) {
    const wrap=spacing*2-(side===1?rightOffset:0);
    for(let i=2;i<countPerSide;i++) {
      close(treeDepth(i,wrap-1e-9,side),treeDepth(i-1,wrap+1e-9,side));
    }
    for(const phase of [0,spacing/2,spacing-1e-8]) {
      assert.equal(sceneryOpacity(treeDepth(countPerSide-1,phase,side)),0);
    }
    for(const {camera,width} of layouts) {
      const tree=treePlacement(camera,near,side,2/3);
      assert.ok(tree.x+tree.width<0 || tree.x>width, 'near recycle must be offscreen');
      assert.equal(treePlacement(camera,near-0.001,side,2/3).opacity,0);
    }
  }
});

test('city shares road time including pause and resume after a long gap', () => {
  let distance=0, previous=null;
  for(const [time,running] of [[0,true],[100,true],[116,false],[90000,true],[90016,true]]) {
    const before=treeDepth(4,distance,-1);
    const clock=advanceClock(previous,time,running);
    previous=clock.timestamp;
    distance+=driving.speed*clock.seconds;
    const after=treeDepth(4,distance,-1);
    close(before-after,driving.speed*clock.seconds);
  }
  close(distance,driving.speed*0.116);
});
