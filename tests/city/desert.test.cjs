const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { desertMap: map } = require('../../.qa/geometry/config/maps.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');
const { backdropPlacement } = require('../../.qa/geometry/geometry/backdrop.js');
const { treeDepth, treePlacement } = require('../../.qa/geometry/geometry/scenery.js');
const { sceneryUniforms } = require('../../.qa/geometry/geometry/sceneryShader.js');
const measured = require('../../docs/city/maps/desert-measurements.json');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('desert RGBA assets have irregular transparent crests and a cactus anchored at its visible foot', async () => {
  const rq = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK = await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  for(const key of ['walls','roadside']) {
    const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname,'../..',map.assets[key])));
    try {
      const w=im.width(),h=im.height();assert.equal(w,1024);assert.equal(h,1536);
      const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
      let clear=0,lowerClear=0,l=w,r=0,t=h,b=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const a=px[(y*w+x)*4+3];if(a===0)clear++;if(a<128&&y>=h/2)lowerClear++;
        if(a>32){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
      }
      assert.deepEqual([l,t,r,b],measured[key].bounds);
      if(key==='walls') {
        assert.ok(clear/(w*h)>.05);assert.equal(lowerClear,0,'near scenery must not expose the fixed plate');
        for(const half of [0,1]) {
          const crest=[];
          for(let x=half*512+5;x<(half+1)*512;x+=50){let y=0;while(y<h&&px[(y*w+x)*4+3]<128)y++;crest.push(y);}
          assert.ok(Math.max(...crest)-Math.min(...crest)>100);
        }
      } else {assert.ok(clear/(w*h)>.4);close(map.roadside.anchorY,b/h);}
    } finally {im.delete();}
  }
});

test('desert registration, alternating wall periods and cactus anchors share the world projection', () => {
  const r=measured.registration,t=map.roadside;
  close(map.background.vanishingPoint.x,r.normalized.x);close(map.background.vanishingPoint.y,r.normalized.y);
  close(map.background.curbSlope,r.meanCurbSlope);
  for(const side of [map.left,map.right]) {
    assert.equal(side.sky,true);assert.equal(side.atlasVariant,-1);assert.equal(side.ground.joints,false);
    assert.ok(Math.abs(side.height/(side.moduleLength*3)-1)<.01);
    assert.ok((side.height+side.heightVariation)/(side.moduleLength*3)<1.14,'intentional tall variant stays within 14%');
    // A whole number of alternating wall pairs per texture period keeps the travel wrap seamless.
    const pairs=map.texturePeriod/(side.moduleLength*2); close(pairs,Math.round(pairs));
    close(map.texturePeriod/side.ground.tile[1],94);
  }
  for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const layout=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0}),{camera}=layout;
    const plate=backdropPlacement(layout,1024,1536,map.background);
    close(plate.x+plate.width*r.normalized.x,camera.centerX);
    close(plate.y+plate.height*r.normalized.y,camera.horizonY);
    const a=sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],0);
    const b=sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],map.texturePeriod);
    assert.deepEqual(a,b);
    for(const side of [-1,1])for(const z of [.3,1,3,8,22]) {
      const p=treePlacement(camera,z,side,2/3,t),foot=projectWorld(camera,{lateral:side*t.lateral,distance:z});
      close(p.y+p.height*t.anchorY,foot.y);close(p.width/p.height,2/3);
      const curb=projectWorld(camera,{lateral:side*1.5,distance:z});
      // Only the visible cactus bounds count, not the transparent canvas margin.
      const visibleLeft=p.x+p.width*measured.roadside.bounds[0]/1024;
      const visibleRight=p.x+p.width*measured.roadside.bounds[2]/1024;
      assert.ok(side>0?visibleLeft>curb.x:visibleRight<curb.x);
      close(treeDepth(8,z,side,t),treeDepth(8,z+map.texturePeriod,side,t));
    }
  }
});
