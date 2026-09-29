// Deterministic promotional layouts: real captures remain unmodified inside frames.
// Run: node marketing/app-store/build-posters.cjs
const fs = require('node:fs');
const path = require('node:path');
let sharp;
try { sharp = require('sharp'); } catch { sharp = require('C:/Users/braya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }
const root = path.join(__dirname, 'es');
const src = path.join(root, 'sources');
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const data = file => { const bytes=fs.readFileSync(file); return `data:image/${bytes[0]===0xFF?'jpeg':'png'};base64,${bytes.toString('base64')}`; };
const bg = data(path.join(src,'travel-background.png'));
const slides = [
 {id:'01-elige-tu-carril',title:['Nuevas palabras.','Nuevos caminos.'],copy:['Conduce hacia la traducción correcta.','Amplía tu vocabulario mientras juegas.'],tag:'ELIGE TU CARRIL · APRENDE JUGANDO',shot:'review',color:'#087653',accent:'#FFD267',dark:true},
 {id:'02-esquiva-obstaculos',title:['Esquiva obstáculos.','Supera cada reto.'],copy:['Coches, barreras y monedas.','Mucho más que memorizar palabras.'],tag:'APRENDER TAMBIÉN ES JUGAR',shot:'traffic-7',color:'#123044',accent:'#FFD267',dark:true},
 {id:'03-niveles-por-temas',title:['Nivel a nivel.','Palabra a palabra.'],copy:['Explora vocabulario organizado por temas.','Avanza paso a paso y a tu ritmo.'],tag:'NIVELES TEMÁTICOS · UN VIAJE DE APRENDIZAJE',shot:'levels',color:'#F7EFDA',accent:'#087653',dark:false},
 {id:'04-repeticion-espaciada',title:['Repasa hoy.','Recuerda mañana.'],copy:['Vuelve a las palabras que te cuestan.','Refuérzalas con repetición espaciada.'],tag:'TUS ERRORES SON PARTE DEL APRENDIZAJE',shot:'results',color:'#087653',accent:'#FFD267',dark:true},
 {id:'05-pronunciacion',title:['Mira. Escucha.','Aprende.'],copy:['Escucha la traducción correcta,','incluso cuando te equivocas.'],tag:'ESCUCHA CÓMO SE PRONUNCIA',shot:'audio',color:'#F7EFDA',accent:'#087653',dark:false},
];
function text(x,y,size,content,fill,weight=400,extra='') { return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(content)}</text>`; }
function build(slide,device){
 const pad=device==='ipad', W=pad?2064:1320,H=pad?2752:2868;
 const ink=slide.dark?'#FFF9E9':'#102D3C', muted=slide.dark?'#DAEAE1':'#40594E';
 const margin=pad?132:94, titleSize=pad?142:105, line=pad?158:120;
 const titleY=pad?295:285;
 const copyY=pad?570:565;
 const sw=pad?1350:848, sh=sw*(pad?1376/1032:956/440);
 const sx=(W-sw)/2, sy=pad?837:840, bezel=pad?25:22, rad=pad?52:62;
 const shot=path.join(src,`${device}-${slide.shot}.png`);
 const border=slide.dark?'#84968D':'#66796F';
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pad?2064:1284}" height="${pad?2752:2778}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
 <defs>
  <clipPath id="screen"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${rad-12}"/></clipPath>
  <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="25" stdDeviation="25" flood-color="#041A18" flood-opacity=".36"/></filter>
 </defs>
 <rect width="${W}" height="${H}" fill="${slide.color}"/>
 <image xlink:href="${bg}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="${slide.dark?.14:1}"/>
 ${slide.dark?`<rect width="${W}" height="${H*.76}" fill="${slide.color}" opacity=".64"/>`:''}
 <path d="M ${W-50} 80 L ${W-320} 760" stroke="${slide.accent}" opacity=".12" stroke-width="110" fill="none"/>
 <path d="M ${W-50} 80 L ${W-320} 760" stroke="${slide.accent}" opacity=".35" stroke-width="4" stroke-dasharray="23 23" fill="none"/>
 ${text(margin,pad?130:126,pad?65:57,'Dashword',ink,800,'letter-spacing="-2"')}
 ${text(W-margin,pad?122:119,pad?25:23,'VOCABULARIO EN MOVIMIENTO',slide.dark?'#DDE9DB':'#526557',700,'text-anchor="end" letter-spacing="3"')}
 ${slide.title.map((s,i)=>text(margin,titleY+i*line,titleSize,s,i===1?slide.accent:ink,800,'letter-spacing="-4"')).join('')}
 ${slide.copy.map((s,i)=>text(margin,copyY+i*(pad?60:58),pad?49:46,s,muted)).join('')}
 <rect x="${margin}" y="${pad?700:691}" width="${W-margin*2}" height="3" fill="${slide.accent}" opacity=".36"/>
 ${text(margin,pad?762:751,pad?31:26,slide.tag,ink,700,'letter-spacing="1.4"')}
 <rect x="${sx-bezel}" y="${sy-bezel}" width="${sw+bezel*2}" height="${sh+bezel*2}" rx="${rad+bezel}" fill="#101D25" stroke="${border}" stroke-width="4" filter="url(#shadow)"/>
 <image xlink:href="${data(shot)}" x="${sx}" y="${sy}" width="${sw}" height="${sh}" clip-path="url(#screen)"/>
 <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${rad-12}" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2"/>
 ${text(W/2,H-37,pad?24:23,'Dashword · Vocabulario que avanza contigo',slide.dark?'#F7EAC8':'#FFF7DA',500,'text-anchor="middle"')}
 </svg>`;
}
(async()=>{
 const manifest=[];
 for(const device of ['iphone','ipad']){
  fs.mkdirSync(path.join(root,device),{recursive:true});
  fs.mkdirSync(path.join(root,'editable',device),{recursive:true});
  for(const slide of slides){
   const svg=build(slide,device);
   fs.writeFileSync(path.join(root,'editable',device,slide.id+'.svg'),svg);
   const target=path.join(root,device,slide.id+'.png');
   await sharp(Buffer.from(svg)).flatten({background:slide.color}).removeAlpha().toColourspace('srgb').png().toFile(target);
   const m=await sharp(target).metadata();
   if(m.width!==(device==='ipad'?2064:1284)||m.height!==(device==='ipad'?2752:2778)||m.hasAlpha)throw Error('Invalid store export '+target);
   manifest.push({file:`${device}/${slide.id}.png`,width:m.width,height:m.height,channels:m.channels,title:slide.title.join(' '),source:`sources/${device}-${slide.shot}.png`});
  }
 }
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
 for(const device of ['iphone','ipad']){
  const tw=device==='iphone'?264:330, th=device==='iphone'?571:440,gap=18;
  const parts=await Promise.all(slides.map(async(s,i)=>({input:await sharp(path.join(root,device,s.id+'.png')).resize(tw,th).toBuffer(),left:gap+i*(tw+gap),top:gap})));
  await sharp({create:{width:5*(tw+gap)+gap,height:th+gap*2,channels:3,background:'#DFE5DC'}}).composite(parts).png().toFile(path.join(root,`preview-${device}.png`));
 }
 console.log('Exported and validated exactly 5 iPhone + 5 iPad promotional PNGs.');
})().catch(e=>{console.error(e);process.exit(1)});

