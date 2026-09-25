const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { snowMap: map } = require('../../.qa/geometry/config/maps.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');
const { backdropPlacement } = require('../../.qa/geometry/geometry/backdrop.js');
const { treePlacement, treeDepth } = require('../../.qa/geometry/geometry/scenery.js');
const { sceneryUniforms } = require('../../.qa/geometry/geometry/sceneryShader.js');
const measured = require('../../docs/city/maps/snow-measurements.json');
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('snow silhouettes expose distant sky while lower scenery remains solid and firs are isolated', async () => {
  const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  for(const key of ['backdrop','walls','roadside']) {
    const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname,'../..',map.assets[key])));
    try {
      const w=im.width(),h=im.height();assert.equal(w,1024);assert.equal(h,1536);
      const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
      let clear=0,lowerClear=0,l=w,r=0,t=h,b=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const a=px[(y*w+x)*4+3];if(!a)clear++;if(a<128&&y>=h/2)lowerClear++;
        if(a>32){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
      }
      if(key==='walls') {
        assert.ok(clear/(w*h)>.06);assert.equal(lowerClear,0);
        for(const side of [0,1]) {
          const crest=[];
          for(let x=side*512+5;x<(side+1)*512;x+=50){let y=0;while(y<h&&px[(y*w+x)*4+3]<128)y++;crest.push(y);}
          assert.ok(Math.max(...crest)-Math.min(...crest)>100);
        }
      } else if(key==='roadside') {
        assert.ok(clear/(w*h)>.4);assert.deepEqual([l,t,r,b],measured.roadside.bounds);close(map.roadside.anchorY,b/h);
      } else assert.equal(clear,0);
    }finally{im.delete();}
  }
});

test('snow registration, undistorted modules, recycling and tree anchors share the world projection', () => {
  for(const side of [map.left,map.right]){close(side.height/side.moduleLength,3);assert.ok(side.sky);assert.equal(side.ground.joints,false);}
  close(map.background.curbSlope,measured.registration.meanCurbSlope);
  assert.ok(measured.registration.left.maxResidual<6.3);assert.ok(measured.registration.right.maxResidual<6.3);
  for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const layout=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0}),{camera}=layout;
    const plate=backdropPlacement(layout,1024,1536,map.background),r=measured.registration;
    close(plate.x+plate.width*r.normalized.x,camera.centerX);close(plate.y+plate.height*r.normalized.y,camera.horizonY);
    for(const side of [-1,1])for(const z of [.3,1,3,8,22]) {
      const t=map.roadside,p=treePlacement(camera,z,side,2/3,t),foot=projectWorld(camera,{lateral:side*t.lateral,distance:z});
      close(p.y+p.height*t.anchorY,foot.y);close(p.width/p.height,2/3);
      const curb=projectWorld(camera,{lateral:side*1.5,distance:z});assert.ok(side>0?p.x>curb.x:p.x+p.width<curb.x);
      close(treeDepth(8,z,side,t),treeDepth(8,z+map.texturePeriod,side,t));
    }
    assert.deepEqual(sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],3),sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],3+map.texturePeriod));
  }
});
