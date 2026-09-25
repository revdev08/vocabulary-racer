const fs=require('node:fs'),path=require('node:path');
const rq=require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
(async()=>{const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
const result=[];
for(const width of [320,390,430])for(const pose of ['traffic','question','right']){
const ims=['before','after'].map(phase=>CK.MakeImageFromEncoded(fs.readFileSync(`docs/city/maps/previews/city-${phase}-${width}-${pose}.png`)));
const w=ims[0].width(),h=ims[0].height();const px=ims.map(im=>im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB}));
let sum=0,max=0,changed=0,significant=0;for(let i=0;i<px[0].length;i+=4){let m=0;for(let c=0;c<3;c++){let d=Math.abs(px[0][i+c]-px[1][i+c]);m=Math.max(m,d);sum+=d;max=Math.max(max,d);}if(m>0)changed++;if(m>2)significant++;}
result.push({width,height:h,pose,meanChannelDifference:sum/(w*h*3),max,changedPixels:changed,significantPixels:significant});ims.forEach(im=>im.delete());}
fs.writeFileSync('docs/city/maps/previews/city-comparison.json',JSON.stringify(result,null,2));console.log(result);
})();
