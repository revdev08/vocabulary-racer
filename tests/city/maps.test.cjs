const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { mapThemes, cityMap, coastMap, mountainMap, desertMap, sunsetMap, snowMap, getMapTheme, journeyMapCycle } = require('../../.qa/geometry/config/maps.js');
const { scenery } = require('../../.qa/geometry/config/scenery.js');
const { scene } = require('../../.qa/geometry/config/visual.js');
const { levels } = require('../../.qa/geometry/data/vocabulary.js');
const { journeyUnits } = require('../../.qa/geometry/data/journey.js');
const { resolveMapTheme } = require('../../.qa/geometry/data/mapTheme.js');
const { backdropPlacement } = require('../../.qa/geometry/geometry/backdrop.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');
const { sceneryOpacity, treeDepth, treePlacement } = require('../../.qa/geometry/geometry/scenery.js');
const root = path.join(__dirname, '../..');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-6, `${a} != ${b}`);

test('registered maps reference real PNGs and finite, coherent world geometry', () => {
  for(const theme of Object.values(mapThemes)) {
    for(const file of Object.values(theme.assets)) {
      assert.ok(file.endsWith('.png'));
      assert.equal(fs.readFileSync(path.join(root,file)).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    }
    const b=theme.background;
    assert.ok(b.vanishingPoint.x>0 && b.vanishingPoint.x<1 && b.vanishingPoint.y>0 && b.vanishingPoint.y<1);
    assert.ok(b.curbSlope>0 && Number.isFinite(b.curbSlope) && b.widthScale>=1);
    assert.ok(theme.curb>1.5 && theme.fadeEnd>theme.solidUntil);
    for(const side of [theme.left,theme.right]) {
      assert.ok(side.wall>theme.curb && side.height>=0 && side.moduleLength>0);
      assert.ok([-1,0,1].includes(side.atlasVariant));
      for(const tile of side.ground.tile) { assert.ok(tile>0); close(theme.texturePeriod/tile,Math.round(theme.texturePeriod/tile)); }
      close(theme.texturePeriod/(2*side.moduleLength),Math.round(theme.texturePeriod/(2*side.moduleLength)));
    }
  }
});

test('all catalog levels resolve their unit map; review and unavailable themes use city', () => {
  const ids = new Set(journeyUnits.flatMap(unit=>unit.data.map(level=>level.sourceId)));
  for(const level of levels) assert.ok(ids.has(level.id));
  for(const unit of journeyUnits) for(const level of unit.data) {
    assert.ok(journeyMapCycle.includes(level.theme));
    assert.equal(resolveMapTheme(level.sourceId), getMapTheme(level.theme));
    assert.equal(resolveMapTheme(level.sourceId,true),cityMap);
  }
  assert.equal(resolveMapTheme('unknown'),cityMap);
  assert.equal(getMapTheme('snow'),snowMap);
  for(const level of journeyUnits[5].data) assert.equal(resolveMapTheme(level.id),snowMap);
  assert.equal(getMapTheme('sunset'),sunsetMap);
  for(const level of journeyUnits[4].data) assert.equal(resolveMapTheme(level.id),sunsetMap);
  assert.equal(getMapTheme('desert'),desertMap);
  for(const level of journeyUnits[3].data) assert.equal(resolveMapTheme(level.id),desertMap);
  assert.equal(getMapTheme('mountain'),mountainMap);
  for(const level of journeyUnits[2].data) assert.equal(resolveMapTheme(level.id),mountainMap);
  assert.equal(resolveMapTheme(levels[0].id),coastMap);
});

test('city retains its original plate registration, material colors and scenery dimensions', () => {
  const {atmosphereColor,...registration}=cityMap.background;
  assert.deepEqual(registration,scene.background);
  for(const side of [cityMap.left,cityMap.right]) {
    assert.equal(side.wall,scenery.wall); assert.equal(side.height,scenery.facadeHeight);
    assert.equal(side.moduleLength,scenery.facadeLength); assert.equal(side.heightVariation,2);
  }
  for(const [key,value] of Object.entries(scenery.trees)) assert.equal(cityMap.roadside[key],value);
  assert.deepEqual(cityMap.colors.asphalt,[.223,.267,.316]);
  assert.deepEqual(cityMap.colors.fog,[.55,.64,.73]);
  assert.equal(atmosphereColor,'#BDCCD9');
});

test('background registration covers tall and short screens and aligns vanishing point and curb slope', () => {
  for(const theme of Object.values(mapThemes)) for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const layout=createSceneLayout(w,h,{top:0,bottom:0,left:0,right:0}), b=theme.background;
    const p=backdropPlacement(layout,1024,1536,b),c=layout.camera;
    close(p.x+p.width*b.vanishingPoint.x,c.centerX); close(p.y+p.height*b.vanishingPoint.y,c.horizonY);
    assert.ok(p.x<=0 && p.x+p.width>=w && p.y<=1e-6 && p.y+p.height>=h-1e-6);
    close(b.curbSlope*(p.width/1024)/(p.height/1536),c.nearLaneWidth*b.curbLaneOffset/c.groundHeight);
  }
});

test('coastal props stay grounded and outside every playable lane through the recycling interval', () => {
  for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const {camera}=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0}), t=coastMap.roadside;
    for(const side of [-1,1]) for(const z of [.3,.8,1.5,3,12,26]) {
      const p=treePlacement(camera,z,side,2/3,t),foot=projectWorld(camera,{lateral:side*t.lateral,distance:z});
      close(p.y+p.height*t.anchorY,foot.y); close(p.width/p.height,2/3);
      const curb=projectWorld(camera,{lateral:side*1.5,distance:z});
      assert.ok(side>0 ? p.x>curb.x : p.x+p.width<curb.x);
    }
    for(const side of [-1,1]) for(const phase of [0,t.spacing/2,t.spacing-1e-8]) {
      assert.equal(sceneryOpacity(treeDepth(t.countPerSide-1,phase,side,t)),0);
    }
  }
});

test('coast near scenery moves with the road: sea streams past, sky above the roofline stays still', async () => {
  // Regression: the coast plate's near houses (above the low roofline) and its shoreline (beyond the
  // low parapet) were a fixed image, so they froze while the road moved.
  const { SCENERY_SURFACES_SKSL, sceneryUniforms } = require('../../.qa/geometry/geometry/sceneryShader.js');
  const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  const layout=createSceneLayout(390,844,{top:59,bottom:34,left:0,right:0}), {camera}=layout;
  const load=file=>CK.MakeImageFromEncoded(fs.readFileSync(path.join(root,file)));
  const walls=load(coastMap.assets.walls), plateImage=load(coastMap.assets.backdrop);
  const effect=CK.RuntimeEffect.Make(SCENERY_SURFACES_SKSL);
  assert.ok(effect,'the scenery shader compiles');
  const plate=backdropPlacement(layout,plateImage.width(),plateImage.height(),coastMap.background);
  const render=distance=>{
    const values=sceneryUniforms(camera,coastMap,plate,[walls.width(),walls.height()],[plateImage.width(),plateImage.height()],distance);
    const floats=new Float32Array(effect.getUniformFloatCount());
    for(let i=0;i<effect.getUniformCount();i++) {
      const name=effect.getUniformName(i), info=effect.getUniform(i), v=[].concat(values[name]);
      assert.equal(v.length,info.columns*info.rows,name); floats.set(v,info.slot);
    }
    const tile=image=>image.makeShaderOptions(CK.TileMode.Clamp,CK.TileMode.Clamp,CK.FilterMode.Linear,CK.MipmapMode.None);
    const surface=CK.MakeSurface(layout.width,layout.height), paint=new CK.Paint();
    paint.setShader(effect.makeShaderWithChildren(floats,[tile(walls),tile(plateImage)]));
    surface.getCanvas().clear(CK.TRANSPARENT);
    surface.getCanvas().drawRect(CK.XYWHRect(0,0,layout.width,layout.height),paint);
    const pixels=surface.makeImageSnapshot().readPixels(0,0,{width:layout.width,height:layout.height,
      colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
    surface.delete(); paint.delete();
    return (p)=>{ const i=(Math.round(p.y)*layout.width+Math.round(p.x))*4; return [...pixels.slice(i,i+4)]; };
  };
  const a=render(3), b=render(3.55);
  const sea=coastMap.right.sea, left=coastMap.left;
  let seaChange=0, seaPoints=0;
  for(const z of [2.5,3.5,5,7]) for(const lateral of [3.6,4.4,5.2]) {
    const p=projectWorld(camera,{lateral,distance:z,elevation:-sea.drop});
    if(p.x>=layout.width) continue;
    const pa=a(p), pb=b(p);
    assert.equal(pa[3],255,`opaque water at lateral ${lateral}, depth ${z}`);
    seaChange+=Math.abs(pa[0]-pb[0])+Math.abs(pa[1]-pb[1])+Math.abs(pa[2]-pb[2]); seaPoints++;
  }
  assert.ok(seaPoints>=6 && seaChange/seaPoints>4,`water must move with the road (mean change ${seaChange/seaPoints})`);
  for(const z of [2,4,8,15,30]) {
    const p=projectWorld(camera,{lateral:-left.wall,distance:z,elevation:left.height+1.5});
    if(p.y<0 || p.x<0) continue;
    assert.equal(a(p)[3],255,`sky above the roofline at depth ${z} replaces the plate`);
    assert.deepEqual(a(p),b(p),'distant sky does not move');
  }
  walls.delete(); plateImage.delete();
});

test('every registered map keeps its near scenery moving: nothing next to the road comes from the fixed plate', async () => {
  // Frozen coast (no sky above the roofline, no sea) measured 25% of textured near blocks still; city and fixed coast ≤ 3%.
  const { renderMotion } = require('../../scripts/render-map-motion.cjs');
  for (const id of Object.keys(mapThemes)) for (const [w,h] of [[390,844],[320,568]]) {
    const result = await renderMotion(id, undefined, w, h);
    assert.ok(result.nearBlocks > 100, `${id} ${w}x${h}: near field measured`);
    assert.ok(result.staticShare < .05, `${id} ${w}x${h}: ${result.staticBlocks}/${result.nearBlocks} textured near blocks do not move`);
  }
});

test('atmosphere, wall light, road edges and row crops stay within readable, valid ranges', () => {
  for(const theme of Object.values(mapThemes)) {
    const a=theme.atmosphere;
    assert.ok(a.amount>=0 && a.amount<=.5 && a.start>=0 && a.start<a.end, `${theme.id} atmosphere`);
    for(const channel of [...theme.light.top,...theme.light.base]) assert.ok(channel>=.6 && channel<=1.25, `${theme.id} light`);
    if(theme.roadEdge) {
      assert.ok(theme.roadEdge.amount>0 && theme.roadEdge.amount<=1 && theme.roadEdge.width>0 && theme.roadEdge.width<=.4, `${theme.id} edge`);
    }
    for(const side of [theme.left,theme.right]) if(side.rows) {
      assert.ok(side.rows.top>0 && side.rows.bottom>0 && side.rows.top+side.rows.bottom<=1, `${theme.id} rows`);
      // Undistorted texels: kept rows of a 512×1536 half span ≈ 3 × module in height.
      assert.ok(Math.abs(side.height/(3*side.moduleLength*(side.rows.top+side.rows.bottom))-1)<.05, `${theme.id} row proportions`);
    }
  }
  assert.equal(mapThemes.snow.weather,'snow');
  for(const id of ['city','coast','mountain','desert','sunset']) assert.equal(mapThemes[id].weather,undefined);
});

test('snowfall streams with the car, falls over time and stays on screen', () => {
  const { snowflakes, SNOW_FLAKES } = require('../../.qa/geometry/geometry/weather.js');
  for(const [w,h] of [[320,568],[390,844]]) {
    const {camera}=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0});
    const a=snowflakes(camera,w,h,10,30), b=snowflakes(camera,w,h,10.2,30.6);
    assert.ok(a.length>=SNOW_FLAKES*.6, `${w}x${h}: ${a.length} flakes visible`);
    // The first version put almost every flake at the horizon at 0.7 px: invisible on a phone.
    assert.ok(a.filter(f=>f.near).length>=SNOW_FLAKES*.2,'enough flakes close enough to read');
    assert.ok(a.some(f=>f.y<h*.3) && a.some(f=>f.y>h*.7),'flakes fill the screen from top to bottom');
    for(const f of [...a,...b]) assert.ok(f.x>=-6 && f.x<=w+6 && f.y>=-6 && f.y<=h+6 && f.r>=.9 && f.r<=5);
    assert.ok(a.some(f=>f.near) && a.some(f=>!f.near));
    assert.notDeepEqual(a,b);
    assert.deepEqual(snowflakes(camera,w,h,10,30),a,'deterministic for a given time and distance');
  }
});

test('every sky wall keeps its lowest crest above the camera, so open sky never meets the horizon', async () => {
  // Regression: 3.4-high snow chalets sat below the camera (≈3.8 lane units on tall phones); their
  // roofline and roof gaps fell under the horizon and the fixed plate showed through as a cut.
  const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  let cameraHeight=0;
  for(const [w,h] of [[320,568],[375,667],[390,844],[430,932],[540,911]]) for(const top of [0,59]) {
    const {camera}=createSceneLayout(w,h,{top,bottom:top?34:0,left:0,right:0});
    cameraHeight=Math.max(cameraHeight,camera.groundHeight/camera.nearLaneWidth);
  }
  const gaps=new Map();
  const deepestGap=(file,column)=>{
    const key=`${file}:${column}`;
    if(gaps.has(key)) return gaps.get(key);
    const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(root,file)));
    const w=im.width(),h=im.height();
    const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
    im.delete();
    let deepest=0;
    for(let x=column*w/2;x<(column+1)*w/2;x+=2) { let y=0; while(y<h && px[(y*w+x)*4+3]<128) y++; deepest=Math.max(deepest,y/h); }
    gaps.set(key,deepest); return deepest;
  };
  for(const theme of Object.values(mapThemes)) for(const side of [theme.left,theme.right]) if(side.sky) {
    const gap=Math.max(...(side.atlasVariant<0?[0,1]:[side.atlasVariant]).map(c=>deepestGap(theme.assets.walls,c)));
    const kept=side.rows?side.rows.top+side.rows.bottom:1;
    const lowest=side.height*(1-gap/kept);
    assert.ok(lowest>cameraHeight*1.05, `${theme.id}: lowest crest ${lowest.toFixed(2)} vs camera ${cameraHeight.toFixed(2)}`);
  }
});

test('coast sprite has genuine transparent margins and the measured ground anchor', async () => {
  const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(root,coastMap.assets.roadside)));
  try {
    const w=im.width(),h=im.height(); assert.equal(w,1024); assert.equal(h,1536);
    const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
    let clear=0,l=w,r=0,t=h,b=0,max=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=px[(y*w+x)*4+3];max=Math.max(max,a);if(!a)clear++;if(a>32){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}}
    assert.ok(clear/(w*h)>.4); assert.ok(max>=250); assert.deepEqual([l,t,r,b],[78,20,969,1503]);
    close(coastMap.roadside.anchorY,b/h);
  } finally {im.delete();}
});
