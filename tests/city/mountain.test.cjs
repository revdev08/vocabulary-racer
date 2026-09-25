const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { mountainMap } = require('../../.qa/geometry/config/maps.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');
const { backdropPlacement } = require('../../.qa/geometry/geometry/backdrop.js');
const { treePlacement, treeDepth } = require('../../.qa/geometry/geometry/scenery.js');
const { sceneryUniforms, SCENERY_SURFACES_SKSL } = require('../../.qa/geometry/geometry/sceneryShader.js');
const rq = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
const kit = () => rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('mountain assets have transparent irregular crests, solid lower walls and an isolated pine', async () => {
  const CK=await kit();
  for(const name of ['walls','roadside']) {
    const im=CK.MakeImageFromEncoded(fs.readFileSync(path.join(__dirname,'../../',mountainMap.assets[name])));
    try {
      const w=im.width(),h=im.height(); assert.equal(w,1024);assert.equal(h,1536);
      const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
      let clear=0,l=w,r=0,t=h,b=0,lowerClear=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const a=px[(y*w+x)*4+3]; if(!a)clear++;if(a<128&&y>=h/2)lowerClear++;
        if(a>32){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1);}
      }
      if(name==='walls') {
        assert.ok(clear/(w*h)>.06);assert.equal(lowerClear,0,'near ground cannot expose fixed plate through holes');
        for(const side of [0,1]) {
          const crest=[];
          for(let x=side*512+5;x<(side+1)*512;x+=50) {let y=0;while(y<h&&px[(y*w+x)*4+3]<128)y++;crest.push(y);}
          assert.ok(Math.max(...crest)-Math.min(...crest)>100,'each panel has a real irregular upper silhouette');
        }
      } else {
        assert.ok(clear/(w*h)>.4);assert.deepEqual([l,t,r,b],[157,29,870,1492]);
        close(mountainMap.roadside.anchorY,b/h);
      }
    } finally {im.delete();}
  }
});

test('mountain wall proportions, texture wrap and pine ground anchors remain coherent', () => {
  const map=mountainMap,t=map.roadside;
  for(const side of [map.left,map.right]) {close(side.height/side.moduleLength,3);assert.equal(side.sky,true);assert.equal(side.ground.joints,false);}
  for(const [w,h] of [[320,568],[390,844],[430,932]]) {
    const {camera}=createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0});
    for(const side of [-1,1])for(const z of [.3,1,3,8,22]) {
      const p=treePlacement(camera,z,side,2/3,t),foot=projectWorld(camera,{lateral:side*t.lateral,distance:z});
      close(p.y+p.height*t.anchorY,foot.y);close(p.width/p.height,2/3);
      const curb=projectWorld(camera,{lateral:side*1.5,distance:z});
      assert.ok(side>0?p.x>curb.x:p.x+p.width<curb.x);
      close(treeDepth(8,z,side,t),treeDepth(8,z+map.texturePeriod,side,t));
    }
    const plate=backdropPlacement(createSceneLayout(w,h,{top:59,bottom:34,left:0,right:0}),1024,1536,map.background);
    assert.deepEqual(sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],3),
      sceneryUniforms(camera,map,plate,[1024,1536],[1024,1536],3+map.texturePeriod));
  }
});

test('atlas alpha below 0.5 exposes sky or plate; opaque wall texels remain walls', async () => {
  const CK=await kit(),effect=CK.RuntimeEffect.Make(SCENERY_SURFACES_SKSL);
  assert.ok(effect);
  const layout=createSceneLayout(390,844,{top:59,bottom:34,left:0,right:0}),{camera}=layout;
  const info={width:4,height:4,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB};
  const texture=a=>CK.MakeImage(info,new Uint8Array(Array.from({length:16},()=>[31,81,144,a]).flat()),16);
  const backdrop=texture(255),images=[texture(0),texture(120),texture(140),texture(255)];
  const render=(walls,sky)=>{
    const theme={...mountainMap,left:{...mountainMap.left,sky},right:{...mountainMap.right,sky}};
    const plate=backdropPlacement(layout,4,4,theme.background);
    const uniforms=sceneryUniforms(camera,theme,plate,[4,4],[4,4],3), floats=new Float32Array(effect.getUniformFloatCount());
    for(let i=0;i<effect.getUniformCount();i++){const name=effect.getUniformName(i);floats.set([].concat(uniforms[name]),effect.getUniform(i).slot);}
    const tile=im=>im.makeShaderOptions(CK.TileMode.Clamp,CK.TileMode.Clamp,CK.FilterMode.Linear,CK.MipmapMode.None);
    const wallShader=tile(walls),bgShader=tile(backdrop),shader=effect.makeShaderWithChildren(floats,[wallShader,bgShader]);
    const surface=CK.MakeSurface(layout.width,layout.height),paint=new CK.Paint();paint.setShader(shader);
    surface.getCanvas().clear(CK.TRANSPARENT);surface.getCanvas().drawRect(CK.XYWHRect(0,0,layout.width,layout.height),paint);
    const snapshot=surface.makeImageSnapshot();
    const px=snapshot.readPixels(0,0,{...info,width:layout.width,height:layout.height});
    snapshot.delete();surface.delete();paint.delete();shader.delete();wallShader.delete();bgShader.delete();
    return p=>{const i=(Math.round(p.y)*layout.width+Math.round(p.x))*4;return [...px.slice(i,i+4)];};
  };
  try {
    for(const side of [-1,1]) {
      const height=side<0?mountainMap.left.height:mountainMap.right.height;
      const point=projectWorld(camera,{lateral:side*2.75,distance:7,elevation:height*.92});
      for(const image of images.slice(0,2)) {
        assert.equal(render(image,false)(point)[3],0,'alpha cutout reveals the original plate without sky enabled');
        assert.deepEqual(render(image,true)(point),[31,81,144,255],'cutout samples the stationary distant sky');
      }
      for(const image of images.slice(2)) assert.equal(render(image,false)(point)[3],255,'above threshold the wall remains solid');
    }
  } finally {images.forEach(im=>im.delete());backdrop.delete();effect.delete();}
});
