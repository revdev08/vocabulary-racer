const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { cityMap, sunsetMap: map, mapThemes } = require('../../.qa/geometry/config/maps.js');
const { createSceneLayout } = require('../../.qa/geometry/geometry/perspective.js');
const { backdropPlacement } = require('../../.qa/geometry/geometry/backdrop.js');
const { treePlacement } = require('../../.qa/geometry/geometry/scenery.js');
const measured = require('../../docs/city/maps/sunset-measurements.json');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('sunset preserves city geometry and sprite pool; only its own trees receive a warm tint', () => {
  for(const side of ['left','right'])for(const field of ['wall','height','heightVariation','moduleLength','atlasVariant'])
    assert.equal(map[side][field],cityMap[side][field]);
  for(const field of ['curb','texturePeriod','solidUntil','fadeEnd'])assert.equal(map[field],cityMap[field]);
  const {tint,...roadside}=map.roadside;
  assert.deepEqual(roadside,cityMap.roadside);assert.equal(map.assets.roadside,cityMap.assets.roadside);
  assert.equal(tint.length,3);assert.ok(tint[0]>tint[1]&&tint[1]>tint[2]);
  for(const n of tint)assert.ok(n>=0&&n<=1);
  for(const other of Object.values(mapThemes).filter(m=>m.id!=='sunset'))assert.equal(other.roadside.tint,undefined);
  for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const layout=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0});
    for(const side of [-1,1])for(const z of [.3,1,3,8,20])
      assert.deepEqual(treePlacement(layout.camera,z,side,2/3,map.roadside),treePlacement(layout.camera,z,side,2/3,cityMap.roadside));
    const p=backdropPlacement(layout,1024,1536,map.background),r=measured.registration;
    close(p.x+p.width*r.normalized.x,layout.camera.centerX);close(p.y+p.height*r.normalized.y,layout.camera.horizonY);
  }
  close(map.background.curbSlope,measured.registration.meanCurbSlope);
  assert.ok(measured.registration.left.maxResidual<3.3);assert.ok(measured.registration.right.maxResidual<3.3);
});

test('sunset plates stay opaque and the reused tree keeps genuine transparent margins', async () => {
  const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  for(const key of ['backdrop','walls','roadside']) {
    const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname,'../..',map.assets[key])));
    try {
      const w=im.width(),h=im.height();assert.equal(w,1024);assert.equal(h,1536);
      const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
      let clear=0,nonOpaque=0,l=w,r=0,t=h,b=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const a=px[(y*w+x)*4+3];if(!a)clear++;if(a<255)nonOpaque++;
        if(a>32){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
      }
      if(key==='roadside'){assert.ok(clear/(w*h)>.4);assert.deepEqual([l,t,r,b],[53,12,974,1497]);}
      else assert.equal(nonOpaque,0,'opaque city walls must never expose stationary foreground');
    }finally{im.delete();}
  }
});
