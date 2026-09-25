// Run from the repository root. Analysis only: source PNGs are never modified.
const fs = require('node:fs');
const path = require('node:path');
const rq = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
const fit = samples => {
  const n=samples.length, sy=samples.reduce((s,p)=>s+p[0],0), sx=samples.reduce((s,p)=>s+p[1],0);
  const syy=samples.reduce((s,p)=>s+p[0]*p[0],0), syx=samples.reduce((s,p)=>s+p[0]*p[1],0);
  const slope=(n*syx-sy*sx)/(n*syy-sy*sy);
  return {slope, intercept:(sx-slope*sy)/n};
};
(async () => {
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  const report={};
  for(const name of ['backdrop','walls','roadside']) {
    const image=CK.MakeImageFromEncoded(fs.readFileSync(`assets/game/maps/coast/${name}.png`));
    const w=image.width(),h=image.height();
    const px=image.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
    let clear=0,maxAlpha=0,left=w,right=0,top=h,bottom=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      const a=px[(y*w+x)*4+3]; if(a===0)clear++; maxAlpha=Math.max(maxAlpha,a);
      if(a>32){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    }
    report[name]={width:w,height:h,transparentFraction:clear/(w*h),maxAlpha,bounds:[left,top,right,bottom]};
    if(name==='backdrop') {
      const samples=[];
      for(let y=800;y<=1450;y+=50) {
        const edges=[];
        for(const side of [-1,1])for(let x=w/2;x>0&&x<w;x+=side) {
          const k=(y*w+x)*4;
          if(px[k]>125 && px[k]>px[k+2]*1.06){edges.push(x);break;}
        }
        samples.push([y,...edges]);
      }
      // Stone/shadow false positives at y900 and y1300 were rejected on inspection.
      const selected=samples.filter(p=>p[0]!==900 && p[0]!==1300);
      const l=fit(selected.map(p=>[p[0],p[1]])),r=fit(selected.map(p=>[p[0],p[2]]));
      const y=(r.intercept-l.intercept)/(l.slope-r.slope),x=l.slope*y+l.intercept;
      report.registration={samples,rejectedRows:[900,1300],left:l,right:r,vanishingPoint:{x,y},
        normalized:{x:x/w,y:y/h},meanCurbSlope:(r.slope-l.slope)/2};
    }
    image.delete();
  }
  fs.writeFileSync('docs/city/maps/coast-measurements.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})();
