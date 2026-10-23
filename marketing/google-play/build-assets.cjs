// Store layouts adapted from the existing editable App Store campaign.
// Source captures and branding remain unchanged; export separately for Google Play.
const fs = require('node:fs');
const path = require('node:path');
let sharp;
try { sharp = require('sharp'); } catch { sharp = require('C:/Users/braya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }
const out = path.join(__dirname, 'es');
const sources = path.join(__dirname, '../app-store/es/sources');
const icon = path.join(__dirname, '../../assets/branding/dashword-icon.png');
const uri = file => { const bytes=fs.readFileSync(file); return `data:image/${bytes[0]===0xff?'jpeg':'png'};base64,${bytes.toString('base64')}`; };
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const text = (x,y,size,s,color,weight=400,extra='') => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" ${extra}>${escape(s)}</text>`;
const slides = [
 { id:'01-aprende-jugando', title:['Aprende palabras.','Ponte en marcha.'], copy:['Elige el carril con la traducción correcta.','Convierte el vocabulario en una aventura.'], tag:'APRENDE JUGANDO', shot:'choice', bg:'#087653', accent:'#FFD267', dark:true },
 { id:'02-supera-obstaculos', title:['Esquiva obstáculos.','Supera cada reto.'], copy:['Conduce, recoge monedas y sigue avanzando.','Practica entre curvas y nuevos desafíos.'], tag:'MANTÉN EL RITMO', shot:'traffic-7', bg:'#123044', accent:'#FFD267', dark:true },
 { id:'03-explora-niveles', title:['Un nuevo nivel.','Más vocabulario.'], copy:['Explora palabras organizadas por temas.','Construye tu aprendizaje paso a paso.'], tag:'TU VIAJE, NIVEL A NIVEL', shot:'levels', bg:'#F7EFDA', accent:'#087653', dark:false },
 { id:'04-repasa-palabras', title:['Repasa tus errores.','Refuerza lo aprendido.'], copy:['Vuelve a las palabras que te cuestan.','Practica con repetición espaciada.'], tag:'CADA ERROR ES OTRA OPORTUNIDAD', shot:'results', bg:'#087653', accent:'#FFD267', dark:true },
 { id:'05-escucha-pronunciacion', title:['Mira. Escucha.','Sigue aprendiendo.'], copy:['Escucha cómo se pronuncian las palabras.','Repite el audio y familiarízate con su sonido.'], tag:'DALE VOZ A TU VOCABULARIO', shot:'audio', bg:'#F7EFDA', accent:'#087653', dark:false },
];
const background = uri(path.join(sources,'travel-background.png'));
function poster(s) {
 const ink=s.dark?'#FFF9E9':'#102D3C', muted=s.dark?'#DCECE3':'#40594E';
 const sx=240, sy=536, sw=600, sh=600*956/440;
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1920" viewBox="0 0 1080 1920">
 <defs><clipPath id="screen"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="28"/></clipPath></defs>
 <rect width="1080" height="1920" fill="${s.bg}"/>
 <image xlink:href="${background}" width="1080" height="1920" preserveAspectRatio="xMidYMid slice" opacity="${s.dark?'.13':'.72'}"/>
 <path d="M1030 -30 L820 470" fill="none" stroke="${s.accent}" stroke-width="85" opacity=".10"/>
 <path d="M1030 -30 L820 470" fill="none" stroke="${s.accent}" stroke-width="3" stroke-dasharray="15 16" opacity=".36"/>
 ${s.title.map((t,i)=>text(64,155+i*112,s.id.startsWith('04')?88:94,t,i?s.accent:ink,800,'letter-spacing="-3"')).join('')}
 ${s.copy.map((t,i)=>text(64,365+i*43,31,t,muted)).join('')}
 <path d="M64 447H1016" stroke="${s.accent}" stroke-opacity=".38" stroke-width="2"/>
 ${text(64,489,21,s.tag,ink,700,'letter-spacing="1.1"')}
 <rect x="${sx-13}" y="${sy-13}" width="${sw+26}" height="${sh+26}" rx="42" fill="#102530" stroke="${s.dark?'#77978A':'#75867B'}" stroke-width="3"/>
 <image xlink:href="${uri(path.join(sources,`iphone-${s.shot}.png`))}" x="${sx}" y="${sy}" width="${sw}" height="${sh}" clip-path="url(#screen)"/>
 ${text(540,1890,22,'Cada palabra abre un nuevo camino.',ink,500,'text-anchor="middle"')}
 </svg>`;
}
function feature() {
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="500">
 <defs><linearGradient id="blend"><stop stop-color="#061C30"/><stop offset="1" stop-color="#061C30" stop-opacity="0"/></linearGradient></defs>
 <rect width="1024" height="500" fill="#061C30"/>
 <image xlink:href="${uri(icon)}" x="524" width="500" height="500"/>
 <rect x="524" width="96" height="500" fill="url(#blend)"/>
 <path d="M-80 510L520 370" stroke="#FFD267" stroke-width="2" opacity=".4"/>
 <path d="M-80 537L520 397" stroke="#FFD267" stroke-width="24" opacity=".07"/>
 ${text(58,130,60,'Dashword','#FFF9E9',800,'letter-spacing="-2"')}
 ${text(58,218,44,'Aprender también','#FFF9E9',700,'letter-spacing="-1"')}
 ${text(58,272,44,'es una aventura.','#FFD267',700,'letter-spacing="-1"')}
 ${text(60,332,22,'Vocabulario en movimiento.','#CDE4DF')}
 </svg>`;
}
async function exportSvg(name,svg,width,height,limit) {
 fs.writeFileSync(path.join(out,'editable',`${name}.svg`),svg);
 const file=path.join(out,`${name}.png`);
 await sharp(Buffer.from(svg)).flatten({background:'#061C30'}).removeAlpha().png({compressionLevel:9}).toFile(file);
 const m=await sharp(file).metadata(), bytes=fs.statSync(file).size;
 if(m.width!==width||m.height!==height||m.hasAlpha||bytes>limit)throw Error(`Invalid export: ${name}`);
 return {file:`${name}.png`,width,height,bytes};
}
(async()=>{
 fs.mkdirSync(path.join(out,'editable'),{recursive:true});
 fs.mkdirSync(path.join(out,'phone'),{recursive:true});
 fs.mkdirSync(path.join(out,'editable/phone'),{recursive:true});
 const manifest=[];
 await sharp(icon).resize(512,512).flatten({background:'#061C30'}).ensureAlpha(1).png({compressionLevel:9}).toFile(path.join(out,'icon-512.png'));
 const iconMeta=await sharp(path.join(out,'icon-512.png')).metadata();
 const iconBytes=fs.statSync(path.join(out,'icon-512.png')).size;
 if(iconMeta.width!==512||iconMeta.height!==512||iconBytes>1000000)throw Error('Invalid icon');
 manifest.push({file:'icon-512.png',width:512,height:512,bytes:iconBytes});
 manifest.push(await exportSvg('feature-1024x500',feature(),1024,500,15000000));
 for(const s of slides) manifest.push({...await exportSvg(`phone/${s.id}`,poster(s),1080,1920,8000000),source:`marketing/app-store/es/sources/iphone-${s.shot}.png`});
 const parts=await Promise.all(slides.map(async(s,i)=>({input:await sharp(path.join(out,'phone',s.id+'.png')).resize(270,480).toBuffer(),left:16+i*286,top:16})));
 await sharp({create:{width:1446,height:512,channels:3,background:'#DFE5DC'}}).composite(parts).png().toFile(path.join(out,'preview.png'));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify(manifest,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
