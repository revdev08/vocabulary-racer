// Read-only asset analysis. Run from the repository root; source PNGs are preserved.
const fs = require('node:fs');
const path = require('node:path');
const rq = require('node:module').createRequire(require.resolve('@shopify/react-native-skia/package.json'));
function fit(samples) {
  const n=samples.length, sy=samples.reduce((s,p)=>s+p[0],0), sx=samples.reduce((s,p)=>s+p[1],0);
  const syy=samples.reduce((s,p)=>s+p[0]*p[0],0), syx=samples.reduce((s,p)=>s+p[0]*p[1],0);
  const slope=(n*syx-sy*sx)/(n*syy-sy*sy), intercept=(sx-slope*sy)/n;
  return { slope, intercept, maxResidual: Math.max(...samples.map(([y,x])=>Math.abs(x-slope*y-intercept))) };
}
(async()=>{
  const CK=await rq('canvaskit-wasm')({locateFile:f=>path.join(path.dirname(rq.resolve('canvaskit-wasm')),f)});
  const report={};
  for(const name of ['backdrop','walls','roadside']) {
    const im=CK.MakeImageFromEncoded(fs.readFileSync(`assets/game/maps/mountain/${name}.png`)),w=im.width(),h=im.height();
    const px=im.readPixels(0,0,{width:w,height:h,colorType:CK.ColorType.RGBA_8888,alphaType:CK.AlphaType.Unpremul,colorSpace:CK.ColorSpace.SRGB});
    let clear=0,maxAlpha=0,left=w,right=0,top=h,bottom=0,lowerHalfTransparent=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      const a=px[(y*w+x)*4+3]; if(!a)clear++; if(a<128&&y>=h/2)lowerHalfTransparent++;
      maxAlpha=Math.max(maxAlpha,a);
      if(a>32){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    }
    report[name]={width:w,height:h,transparentFraction:clear/(w*h),maxAlpha,bounds:[left,top,right,bottom],lowerHalfTransparent};
    if(name==='walls') {
      report.walls.crest=[];
      for(const side of [0,1]) {
        const samples=[];
        for(let x=side*w/2+5;x<(side+1)*w/2;x+=50) {
          let y=0;while(y<h&&px[(y*w+x)*4+3]<128)y++;
          samples.push({x,y});
        }
        report.walls.crest.push({side,samples});
      }
    }
    if(name==='backdrop') {
      const samples=[];
      for(let y=800;y<=1300;y+=25) {
        const edges=[];
        for(const side of [-1,1])for(let x=w/2;x>0&&x<w;x+=side) {
          const i=(y*w+x)*4;
          if(px[i]>110&&px[i+1]>105){edges.push(x);break;}
        }
        if(edges.length!==2)throw new Error(`Missing curb at y${y}`);
        samples.push([y,...edges]);
      }
      const l=fit(samples.map(p=>[p[0],p[1]])),r=fit(samples.map(p=>[p[0],p[2]]));
      const y=(r.intercept-l.intercept)/(l.slope-r.slope),x=l.slope*y+l.intercept;
      report.registration={samples,left:l,right:r,vanishingPoint:{x,y},normalized:{x:x/w,y:y/h},meanCurbSlope:(r.slope-l.slope)/2};
    }
    im.delete();
  }
  fs.mkdirSync('docs/city/maps',{recursive:true});
  fs.writeFileSync('docs/city/maps/mountain-measurements.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.registration));
})();
