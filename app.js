/* Leggio d'insieme — web app */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const VERSION='1.3.0';
const CFG=Object.assign({apiKey:'',folder:''},window.LEGGIO_CONFIG||{});
const PEER_PREFIX='leggio-insieme-';

/* ================= Librerie esterne ================= */
const LIBS={
  pdf:['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'],
  pdfWorker:['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'],
  peer:['https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js','https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'],
  qr:['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js','https://unpkg.com/qrcode-generator@1.4.4/qrcode.js']
};
const scriptP={};
function loadScript(key,test){
  if(test())return Promise.resolve();
  if(!scriptP[key])scriptP[key]=(async()=>{
    for(const src of LIBS[key]){
      try{await new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.append(s);});if(test())return;}catch(e){}
    }
    throw new Error('lib '+key);
  })().catch(e=>{scriptP[key]=null;throw e;});
  return scriptP[key];
}
let pdfjsP=null;
function loadPdfJs(){
  if(!pdfjsP)pdfjsP=(async()=>{
    await loadScript('pdf',()=>!!window.pdfjsLib);
    const L=window.pdfjsLib;
    if(!L.GlobalWorkerOptions.workerSrc){
      for(const u of LIBS.pdfWorker){
        try{const r=await fetch(u);if(r.ok){L.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([await r.text()],{type:'text/javascript'}));break;}}catch(e){}
      }
      if(!L.GlobalWorkerOptions.workerSrc){await loadScript('pdfWorker',()=>!!window.pdfjsWorker);L.GlobalWorkerOptions.workerSrc=LIBS.pdfWorker[0];}
    }
    return L;
  })().catch(e=>{pdfjsP=null;throw e;});
  return pdfjsP;
}

/* ================= Strumenti e brani d'esempio ================= */
const INSTR=[
 {id:'piano',n:'Pianoforte',t:0,c:'G'},
 {id:'voce',n:'Voce',t:0,c:'G'},
 {id:'flauto',n:'Flauto',t:0,c:'G'},
 {id:'violino',n:'Violino',t:0,c:'G'},
 {id:'oboe',n:'Oboe',t:0,c:'G'},
 {id:'chitarra',n:'Chitarra',t:12,c:'G',d:'si legge un\'ottava sopra'},
 {id:'clar',n:'Clarinetto in Si♭',t:2,c:'G',d:'parte trasposta un tono sopra'},
 {id:'tromba',n:'Tromba in Si♭',t:2,c:'G',d:'parte trasposta un tono sopra'},
 {id:'saxa',n:'Sax contralto in Mi♭',t:9,c:'G',d:'parte trasposta una sesta maggiore sopra'},
 {id:'saxs',n:'Sax soprano in Si♭',t:2,c:'G',d:'parte trasposta un tono sopra'},
 {id:'saxt',n:'Sax tenore in Si♭',t:14,c:'G',d:'parte trasposta una nona sopra'},
 {id:'saxb',n:'Sax baritono in Mi♭',t:21,c:'G',d:'parte trasposta un\'ottava e una sesta sopra'},
 {id:'clarb',n:'Clarinetto basso in Si♭',t:14,c:'G',d:'parte trasposta una nona sopra'},
 {id:'corno',n:'Corno in Fa',t:7,c:'G',d:'parte trasposta una quinta sopra'},
 {id:'viola',n:'Viola',t:0,c:'C',d:'chiave di contralto'},
 {id:'cello',n:'Violoncello',t:0,c:'F',d:'chiave di basso'},
 {id:'trombone',n:'Trombone',t:0,c:'F',d:'chiave di basso'},
 {id:'euph',n:'Euphonium (chiave di basso)',t:0,c:'F',d:'chiave di basso'},
 {id:'euphb',n:'Euphonium in Si♭ (chiave di violino)',t:14,c:'G',d:'parte trasposta una nona sopra'},
 {id:'tuba',n:'Tuba / Basso tuba',t:0,c:'F',d:'chiave di basso'},
 {id:'fagotto',n:'Fagotto',t:0,c:'F',d:'chiave di basso'},
 {id:'basso',n:'Basso / Contrabbasso',t:12,c:'F',d:'chiave di basso, suona un\'ottava sotto'},
 {id:'batteria',n:'Batteria / Percussioni',t:0,c:'G'}
];
const instById=id=>INSTR.find(i=>i.id===id)||INSTR[0];
const CLEF={G:{mid:34,glyph:'\u{1D11E}',dy:1.0,fs:4.1},F:{mid:22,glyph:'\u{1D122}',dy:-1.0,fs:3.6},C:{mid:28,glyph:'\u{1D121}',dy:0,fs:4.1}};
const LET='CDEFGAB',PC=[0,2,4,5,7,9,11];
const SHARP=[[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0]];
const DEMOS=[
 {id:'ode',txt:`T: Inno alla gioia
M: 4/4
Q: 100
E4/4 E4/4 F4/4 G4/4 | G4/4 F4/4 E4/4 D4/4 | C4/4 C4/4 D4/4 E4/4 | E4/4. D4/8 D4/2 |
E4/4 E4/4 F4/4 G4/4 | G4/4 F4/4 E4/4 D4/4 | C4/4 C4/4 D4/4 E4/4 | D4/4. C4/8 C4/2 |
D4/4 D4/4 E4/4 C4/4 | D4/4 E4/8 F4/8 E4/4 C4/4 | D4/4 E4/8 F4/8 E4/4 D4/4 | C4/4 D4/4 G3/2 |
E4/4 E4/4 F4/4 G4/4 | G4/4 F4/4 E4/4 D4/4 | C4/4 C4/4 D4/4 E4/4 | D4/4. C4/8 C4/2`},
 {id:'martino',txt:`T: Fra Martino
M: 4/4
Q: 104
C4/4 D4/4 E4/4 C4/4 | C4/4 D4/4 E4/4 C4/4 | E4/4 F4/4 G4/2 | E4/4 F4/4 G4/2 |
G4/8 A4/8 G4/8 F4/8 E4/4 C4/4 | G4/8 A4/8 G4/8 F4/8 E4/4 C4/4 | C4/4 G3/4 C4/2 | C4/4 G3/4 C4/2`},
 {id:'saints',txt:`T: When the Saints
M: 4/4
Q: 120
R/4 C4/4 E4/4 F4/4 | G4/1 | R/4 C4/4 E4/4 F4/4 | G4/1 | R/4 C4/4 E4/4 F4/4 | G4/2 E4/2 | C4/2 E4/2 | D4/1 |
R/4 E4/4 E4/4 D4/4 | C4/2. C4/4 | E4/2 G4/2 | G4/4 F4/2. | R/4 E4/4 F4/4 G4/4 | E4/2 C4/2 | D4/2 D4/2 | C4/1`},
 {id:'grace',txt:`T: Amazing Grace
M: 3/4
Q: 80
R/2 G3/4 | C4/2 E4/8 C4/8 | E4/2 D4/4 | C4/2 A3/4 | G3/2 G3/4 | C4/2 E4/8 C4/8 | E4/2 D4/4 | G4/2. |
G4/2 E4/8 G4/8 | E4/2 C4/4 | E4/2 D4/4 | C4/2 A3/4 | G3/2 G3/4 | C4/2 E4/8 C4/8 | E4/2 D4/4 | C4/2.`}
];
function parse(text){
  let title='Brano',ts=[4,4],bpm=90;const notes=[];let oct=4,beat=0;
  for(const line of String(text).split('\n')){
    const m=line.match(/^\s*([TMQ])\s*:\s*(.+)$/i);
    if(m){const k=m[1].toUpperCase(),v=m[2].trim();
      if(k==='T')title=v.slice(0,60);
      else if(k==='M'){const p=v.match(/(\d+)\s*\/\s*(\d+)/);if(p)ts=[+p[1],+p[2]];}
      else if(k==='Q'){const q=parseInt(v,10);if(q>=20&&q<=300)bpm=q;}
      continue;}
    for(const tok of line.split(/\s+/)){
      const r=tok.match(/^([A-Ga-gRr])(#|b)?(\d)?\/(1|2|4|8|16)(\.?)$/);
      if(!r)continue;
      let d=4/(+r[4]);if(r[5])d*=1.5;
      const L=r[1].toUpperCase();
      if(L==='R')notes.push({r:1,b:beat,d});
      else{if(r[3]!=null)oct=+r[3];const li=LET.indexOf(L),acc=r[2]==='#'?1:r[2]==='b'?-1:0;notes.push({li,oct,acc,b:beat,d,midi:12*(oct+1)+PC[li]+acc});}
      beat+=d;
    }
  }
  const mQ=ts[0]*4/ts[1];
  return {kind:'demo',title,ts,bpm,notes,total:beat,mQ,bars:Math.max(1,Math.ceil(beat/mQ-1e-9))};
}
const demoById=id=>DEMOS.find(d=>d.id===id)||DEMOS[0];

/* ================= Preferenze ================= */
const LS='leggio.app.v1';
let prefs={nick:'',inst:'piano',oct:'auto',zoom:1,size:1,head:.3,met:true,guide:false,vol:.6,off:0,rot:false,pdfMode:'v',rows:'auto',mark:false,inv:false,parts:{},apiKey:'',folder:''};
try{Object.assign(prefs,JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){}
if(!['h','v','r'].includes(prefs.pdfMode))prefs.pdfMode='v';
const savePrefs=()=>{try{localStorage.setItem(LS,JSON.stringify(prefs));}catch(e){}};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const myName=()=>(prefs.nick||'').trim()||'Senza nome';

/* ================= Archivio locale (IndexedDB) ================= */
const idb=(()=>{
  let p=null;
  const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('leggio',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));
  return {
    async get(k){try{const d=await open();return await new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}catch(e){return undefined;}},
    async set(k,v){try{const d=await open();await new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error);});}catch(e){}}
  };
})();

/* ================= Google Drive ================= */
const apiKey=()=>(prefs.apiKey||CFG.apiKey||'').trim();
function folderIdOf(s){s=String(s||'').trim();const m=s.match(/folders\/([\w-]{10,})/)||s.match(/[?&]id=([\w-]{10,})/)||s.match(/^([\w-]{10,})$/);return m?m[1]:'';}
const rootFolder=()=>folderIdOf(prefs.folder||CFG.folder);
const FOLDER='application/vnd.google-apps.folder',SHORTCUT='application/vnd.google-apps.shortcut';
async function driveErr(r){let m='';try{const j=await r.json();m=(j.error&&j.error.message)||'';}catch(e){}const e=new Error(m||('HTTP '+r.status));e.status=r.status;return e;}
async function driveList(id){
  const out=[];let tok='';
  do{
    const q=new URLSearchParams({q:`'${id}' in parents and trashed=false`,fields:'nextPageToken,files(id,name,mimeType,modifiedTime,shortcutDetails)',pageSize:'1000',supportsAllDrives:'true',includeItemsFromAllDrives:'true',key:apiKey()});
    if(tok)q.set('pageToken',tok);
    const r=await fetch('https://www.googleapis.com/drive/v3/files?'+q);
    if(!r.ok)throw await driveErr(r);
    const j=await r.json();
    for(const f of j.files||[]){
      if(f.mimeType===SHORTCUT&&f.shortcutDetails)out.push({id:f.shortcutDetails.targetId,name:f.name,mimeType:f.shortcutDetails.targetMimeType,modifiedTime:f.modifiedTime});
      else out.push(f);
    }
    tok=j.nextPageToken||'';
  }while(tok);
  return out;
}
async function driveMeta(id){const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name&supportsAllDrives=true&key=${encodeURIComponent(apiKey())}`);if(!r.ok)throw await driveErr(r);return r.json();}
async function driveDownload(id,key){const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(key||apiKey())}`);if(!r.ok)throw await driveErr(r);return r.arrayBuffer();}
const isPdf=f=>f.mimeType==='application/pdf'||/\.pdf$/i.test(f.name||'');
const IMG_RE=/\.(jpe?g|png|webp|gif|bmp|heic|heif|tiff?)$/i;
const isImg=f=>/^image\//.test(f.mimeType||'')||IMG_RE.test(f.name||'');
const isSheet=f=>isPdf(f)||isImg(f);
const imgType=f=>/^image\//.test(f.mimeType||'')?f.mimeType:('image/'+((f.name||'').match(IMG_RE)||['','jpeg'])[1].toLowerCase().replace('jpg','jpeg'));
// raggruppa le immagini della stessa parte: «Tromba 1.jpg», «Tromba 2.jpg» → «Tromba»
function groupParts(files){
  const out=[],groups=new Map();
  for(const f of files){
    if(isPdf(f)){out.push({label:f.name.replace(/\.pdf$/i,'').slice(0,40),files:[f],img:false});continue;}
    const base=f.name.replace(IMG_RE,'');
    const stem=(base.replace(/[\s_\-.]*(?:p|pag|pagina|page|pg)?[\s_\-.]*\(?\d{1,3}\)?\s*$/i,'').trim()||base).slice(0,40);
    const k=stem.toLowerCase();
    if(!groups.has(k)){const g={label:stem,files:[],img:true};groups.set(k,g);out.push(g);}
    groups.get(k).files.push(f);
  }
  for(const g of out)g.files.sort(byName);
  return out;
}
async function makeImageDoc(srcs){
  const imgs=[],urls=[];
  for(const s of srcs){
    const url=URL.createObjectURL(new Blob([s.buf],{type:s.type}));urls.push(url);
    const im=new Image();im.src=url;
    try{await im.decode();}catch(e){urls.forEach(u=>URL.revokeObjectURL(u));const er=new Error('img');er.img=1;throw er;}
    imgs.push(im);
  }
  const doc={numPages:imgs.length,isImage:true,rots:[],destroy(){urls.forEach(u=>URL.revokeObjectURL(u));},
    getPage:async n=>{const im=imgs[n-1],W0=im.naturalWidth,H0=im.naturalHeight;
      return {getViewport:({scale})=>({width:W0*scale,height:H0*scale,scale}),
        render:({canvasContext:c,viewport:v,transform:t})=>{c.save();if(t)c.transform(...t);c.scale(v.scale,v.scale);
          const r=doc.rots[n-1]||0;if(r){c.fillStyle='#fff';c.fillRect(0,0,W0,H0);c.translate(W0/2,H0/2);c.rotate(r);c.translate(-W0/2,-H0/2);}
          c.drawImage(im,0,0);c.restore();return {promise:Promise.resolve()};}};}};
  return doc;
}
// apre una parte: PDF oppure una o più immagini
async function openPartDoc(part){
  if(part.imgs&&part.imgs.length){
    const srcs=[];for(const i of part.imgs)srcs.push({buf:await pdfBytes(i.f,i.m),type:i.t});
    const d=await makeImageDoc(srcs);d.rots=(part.rots||[]).slice();return d;
  }
  return openPdf(await pdfBytes(part.fileId,part.mod));
}
const byName=(a,b)=>a.name.localeCompare(b.name,'it',{numeric:true,sensitivity:'base'});
function driveMsg(e){
  const s=e&&e.status;
  if(s===400&&/key/i.test(e.message))return 'La chiave API non è valida. Controllala nelle impostazioni di Drive.';
  if(s===403)return /referer|referrer/i.test(e.message)?'La chiave API non accetta richieste da questo indirizzo: controlla le restrizioni della chiave.':/not been used|disabled/i.test(e.message)?'L\'API di Google Drive non è attiva nel progetto della chiave.':'Accesso negato da Drive: '+e.message;
  if(s===404)return 'Cartella o file non trovati: la cartella deve essere condivisa con «Chiunque abbia il link».';
  if(!s)return 'Non riesco a raggiungere Google Drive. Controlla la connessione.';
  return 'Errore di Drive: '+e.message;
}

/* ================= PDF ================= */
async function openPdf(buf){
  const L=await loadPdfJs();
  return L.getDocument({data:new Uint8Array(buf.slice(0)),isEvalSupported:false}).promise;
}
async function renderCrop(doc,p,cx0,cy0,cx1,cy1,outW){
  const page=await doc.getPage(p+1);const v1=page.getViewport({scale:1});
  const pw=v1.width;const scale=outW/((cx1-cx0)*pw);const vp=page.getViewport({scale});
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(outW));c.height=Math.max(1,Math.round((cy1-cy0)*pw*scale));
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  await page.render({canvasContext:x,viewport:vp,transform:[1,0,0,1,-cx0*pw*scale,-cy0*pw*scale]}).promise;
  return c;
}
const AW=1600;
function binarize(img,adaptive){
  const W=img.width,H=img.height,d=img.data;
  const g=new Uint8Array(W*H);
  if(!adaptive){for(let i=0,j=0;i<g.length;i++,j+=4){const a=d[j+3]/255;g[i]=((d[j]*0.3+d[j+1]*0.59+d[j+2]*0.11)*a+255*(1-a))<150?1:0;}return g;}
  // foto e scansioni: confronto con la luminosità della zona intorno, così ombre e carta grigia non diventano nere
  const L=new Float32Array(W*H);for(let i=0,j=0;i<L.length;i++,j+=4)L[i]=d[j]*0.3+d[j+1]*0.59+d[j+2]*0.11;
  const I=new Float64Array((W+1)*(H+1));
  for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=L[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+row;}}
  const r=Math.max(8,Math.round(W/60));
  for(let y=0;y<H;y++){const y0=Math.max(0,y-r),y1=Math.min(H,y+r+1);
    for(let x=0;x<W;x++){const x0=Math.max(0,x-r),x1=Math.min(W,x+r+1);
      const m=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/((y1-y0)*(x1-x0));
      const v=L[y*W+x];g[y*W+x]=(v<m*0.8&&v<200)||v<70?1:0;}}
  return g;
}
// inclinazione della pagina (in gradi): l'angolo che rende più "netti" i righi
function estimateSkew(g,W,H){
  const pts=[];for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(g[y*W+x])pts.push(x,y);
  if(pts.length<200)return 0;
  const score=a=>{const t=Math.tan(a*Math.PI/180),off=Math.ceil(W*Math.abs(t))+2,h=new Float64Array(H+2*off);
    for(let i=0;i<pts.length;i+=2){const yy=Math.round(pts[i+1]-pts[i]*t)+off;if(yy>=0&&yy<h.length)h[yy]++;}
    let s=0;for(let i=0;i<h.length;i++)s+=h[i]*h[i];return s;};
  let best=0,bs=-1;
  for(let a=-5;a<=5.001;a+=0.25){const v=score(a);if(v>bs){bs=v;best=a;}}
  const c=best;for(let a=c-0.25;a<=c+0.25001;a+=0.05){const v=score(a);if(v>bs){bs=v;best=a;}}
  const c2=best;for(let a=c2-0.05;a<=c2+0.05001;a+=0.01){const v=score(a);if(v>bs){bs=v;best=a;}}
  return best;
}
async function analyzeDoc(doc,onPage){
  const adaptive=!!doc.isImage;const rots=[];
  const out=[];const aspects=[];
  for(let p=0;p<doc.numPages;p++){
    onPage&&onPage(p+1,doc.numPages);
    const page=await doc.getPage(p+1);const v1=page.getViewport({scale:1});const sc=AW/v1.width;const vp=page.getViewport({scale:sc});
    const c=document.createElement('canvas');c.width=AW;c.height=Math.round(vp.height);
    const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    await page.render({canvasContext:x,viewport:vp}).promise;
    let id=x.getImageData(0,0,c.width,c.height);
    let g=binarize(id,adaptive);
    rots[p]=0;
    if(adaptive){
      const a=estimateSkew(g,c.width,c.height);
      if(Math.abs(a)>0.04){doc.rots[p]=-a*Math.PI/180;rots[p]=doc.rots[p];
        x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);await page.render({canvasContext:x,viewport:vp}).promise;
        id=x.getImageData(0,0,c.width,c.height);g=binarize(id,adaptive);}
    }
    aspects.push(+(c.height/AW).toFixed(5));
    for(const s of analyzeImage(id,adaptive,g))out.push(Object.assign(s,{p}));
    c.width=c.height=1;
  }
  return {sys:out,pages:aspects,rots};
}
function analyzeImage(img,adaptive,pre){
  const W=img.width,H=img.height;
  const g=pre||binarize(img,adaptive);
  // righe lunghe = linee del pentagramma
  const lines=[];let prev=null;
  for(let y=0;y<H;y++){
    let run=0,best=0,bs=0,st=0;const o=y*W;
    for(let x=0;x<W;x++){if(g[o+x]){if(!run)st=x;run++;if(run>best){best=run;bs=st;}}else run=0;}
    if(best>W*0.15){
      if(prev&&prev.y2===y-1){prev.y2=y;prev.x0=Math.min(prev.x0,bs);prev.x1=Math.max(prev.x1,bs+best);}
      else{prev={y1:y,y2:y,x0:bs,x1:bs+best};lines.push(prev);}
    }
  }
  lines.forEach(l=>l.y=(l.y1+l.y2)/2);
  const staves=[];
  for(let i=0;i+4<lines.length;){
    const L=lines.slice(i,i+5);const gaps=[1,2,3,4].map(k=>L[k].y-L[k-1].y);const mn=Math.min(...gaps),mx=Math.max(...gaps);
    if(mn>=3&&mx<=mn*1.35+1&&mx<W/22){staves.push({top:L[0].y1,bot:L[4].y2,sp:(L[4].y-L[0].y)/4,x0:Math.min(...L.map(l=>l.x0)),x1:Math.max(...L.map(l=>l.x1))});i+=5;}
    else i++;
  }
  const colF=(x,y0,y1)=>{x=Math.round(x);if(x<0||x>=W)return 0;y0=Math.max(0,Math.round(y0));y1=Math.min(H-1,Math.round(y1));if(y1<y0)return 0;let n=0;for(let y=y0;y<=y1;y++)n+=g[y*W+x];return n/(y1-y0+1);};
  const boxF=(xa,xb,y0,y1)=>{if(xa>xb)[xa,xb]=[xb,xa];xa=Math.max(0,Math.round(xa));xb=Math.min(W-1,Math.round(xb));y0=Math.max(0,Math.round(y0));y1=Math.min(H-1,Math.round(y1));let n=0,t=0;for(let y=y0;y<=y1;y++)for(let x=xa;x<=xb;x++){n+=g[y*W+x];t++;}return t?n/t:0;};
  // unisci pentagrammi collegati (es. pianoforte)
  const systems=[];
  for(const st of staves){
    const last=systems[systems.length-1];
    if(last&&st.top-last.bot<8*st.sp){
      const xa=Math.min(last.x0,st.x0);let linked=false;
      for(let x=Math.round(xa-2*st.sp);x<=xa+1.5*st.sp;x++){if(colF(x,last.top,st.bot)>=0.9){linked=true;break;}}
      if(linked){last.bot=st.bot;last.n++;last.x0=Math.min(last.x0,st.x0);last.x1=Math.max(last.x1,st.x1);continue;}
    }
    systems.push({top:st.top,bot:st.bot,sp:st.sp,x0:st.x0,x1:st.x1,n:1});
  }
  const res=[];
  systems.forEach((s,si)=>{
    const sp=s.sp;const cand=[];
    for(let x=Math.max(0,s.x0-2);x<=Math.min(W-1,s.x1+2);x++){
      if(colF(x,s.top,s.bot)<(adaptive?0.9:0.97))continue;
      const ef=adaptive?0.6:1;
      if(colF(x,s.top-(adaptive?1:0),s.top+0.3*sp)<ef||colF(x,s.bot-0.3*sp,s.bot+(adaptive?1:0))<ef)continue;
      if(s.n===1){const a=colF(x,s.top-1.3*sp,s.top-0.4*sp),b=colF(x,s.bot+0.4*sp,s.bot+1.3*sp);if(a>0.5||b>0.5)continue;}
      cand.push(x);
    }
    const cl=[];
    for(const x of cand){const c=cl[cl.length-1];if(c&&x-c.last<=Math.max(2,0.9*sp)){c.last=x;if(x-c.runEnd>1)c.runs++;c.runEnd=x;}else cl.push({first:x,last:x,runEnd:x,runs:1});}
    // una colonna nera accanto a una testa di nota è un gambo, non una stanghetta
    const isStem=c=>{
      for(const sd of [-1,1]){
        const e0=sd>0?c.last+1+0.1*sp:c.first-1-0.1*sp,e1=sd>0?c.last+0.65*sp:c.first-0.65*sp;
        const e=Math.max(boxF(e0,e1,s.top,s.top+0.8*sp),boxF(e0,e1,s.bot-0.8*sp,s.bot)),m=boxF(e0,e1,s.top+1.5*sp,s.bot-1.5*sp);
        if(e>(adaptive?0.5:0.42)&&m<0.3)return true;
      }
      return false;
    };
    let ends=cl.filter(c=>{
      const w=c.last-c.first+1,cx=(c.first+c.last)/2;
      if(cx<s.x0+5.5*sp)return false;                        // inizio sistema, chiave, tempo
      if(!adaptive&&c.runs===1&&w>=0.24*sp&&w<=0.45*sp&&s.x1-cx>1.5*sp)return false; // tratto di un numero/lettera
      if(isStem(c))return false;
      return true;
    }).map(c=>(c.first+c.last)/2);
    if(!ends.length||s.x1-ends[ends.length-1]>2.5*sp)ends.push(s.x1);
    const widths=ends.slice(1).map((e,i)=>e-ends[i]);
    const avg=widths.length?widths.reduce((a,b)=>a+b,0)/widths.length:(ends[0]-s.x0);
    let start=ends.length>1?Math.min(ends[0]-2*sp,Math.max(s.x0+3*sp,ends[0]-avg)):s.x0+4*sp;
    start=Math.max(s.x0,Math.min(start,ends[0]-sp));
    const prevB=si>0?systems[si-1].bot:0,nextT=si<systems.length-1?systems[si+1].top:H;
    const cy0=Math.max(0,s.top-4.5*sp,(prevB+s.top)/2),cy1=Math.min(H,s.bot+4.5*sp,(s.bot+nextT)/2);
    const r=v=>+(v/W).toFixed(5);
    res.push({x0:r(s.x0),x1:r(s.x1),sy0:r(s.top),sy1:r(s.bot),cy0:r(cy0),cy1:r(cy1),b:[start,...ends].map(r),m:0,off:0});
  });
  return res;
}

const sysBars=s=>s.b.length-1;
const partBars=p=>p.sys.reduce((a,s)=>a+(s.off?0:sysBars(s)),0);
function setSysBars(s,n){n=clamp(n,1,64);const a=s.b[0],z=s.b[s.b.length-1];s.b=Array.from({length:n+1},(_,i)=>+(a+(z-a)*i/n).toFixed(5));s.m=1;}
function guessInst(name){
  const n=name.toLowerCase();
  const T=[['clarinetto bass','clarb'],['clarinetto in sib bass','clarb'],['clar. bass','clarb'],['clar bass','clarb'],['cl. bass','clarb'],['cl bass','clarb'],['bass clar','clarb'],['flicorno baritono','euph'],['flicorno tenore','euph'],['euph','euph'],['eufon','euph'],['bombardin','euph'],['tuba','tuba'],['bassotuba','tuba'],['sax bari','saxb'],['bari sax','saxb'],['baritono','saxb'],['sax sopran','saxs'],['soprano sax','saxs'],['sax s.','saxs'],['sax t.','saxt'],['sax a.','saxa'],['batter','batteria'],['percuss','batteria'],['drum','batteria'],['trombon','trombone'],['tromb','tromba'],['trump','tromba'],['trp','tromba'],['flic','tromba'],['clar','clar'],['cl.','clar'],['tenor','saxt'],['contralto','saxa'],['alto','saxa'],['sax','saxa'],['corn','corno'],['horn','corno'],['flaut','flauto'],['flute','flauto'],['ottavin','flauto'],['oboe','oboe'],['violonc','cello'],['cell','cello'],['viola','viola'],['violin','violino'],['contrab','basso'],['bass','basso'],['fagott','fagotto'],['chitarr','chitarra'],['guitar','chitarra'],['pian','piano'],['tastier','piano'],['keys','piano'],['voc','voce'],['canto','voce'],['sopran','voce']];
  for(const [k,v] of T)if(n.includes(k))return v;
  return 'piano';
}
async function pdfBytes(fileId,mod){
  const k='pdf:'+fileId+':'+mod;
  let b=await idb.get(k);if(b)return b;
  try{b=await driveDownload(fileId,apiKey()||(S&&S.k));}
  catch(e){if(mode==='guest')b=await askHostPdf(fileId);else throw e;}
  await idb.set(k,b);
  return b;
}

/* ================= Stato ================= */
let mode='home';      // home | host | guest
let code='';
let S=null;           // stato condiviso
let song=null,songKey='';
let lib=null;         // elenco brani su Drive (organizzatore)
let cur=null;         // brano PDF aperto dall'organizzatore
let clockOff=0;
const hostNow=()=>Date.now()+(mode==='guest'?clockOff:0);
const viewNow=()=>hostNow()+(+prefs.off||0);
const beatQ=()=>(S&&S.beat)||1;
const mspq=()=>60000/(S.bpm*beatQ());
function countQ(){return (S.count||0)*beatQ();}
function defaultBeat(ts){const n=ts[0],d=ts[1];if(d===2)return 2;if(d===8&&n%3===0&&n>3)return 1.5;if(d===8)return 0.5;if(d===16)return 0.25;return 1;}
const barBeats=(ts,b)=>Math.max(1,Math.round(ts[0]*4/ts[1]/b));
const UNIT={0.25:'semicroma',0.5:'croma',1:'semiminima',1.5:'semiminima puntata',2:'minima',3:'minima puntata'};
function posAt(t){if(!S||!song)return 0;if(!S.playing)return S.fromBeat;return S.fromBeat+(t-S.startAt)/mspq()-countQ();}

/* ================= Rete (PeerJS) ================= */
let peer=null,conns=new Map(),hostConn=null,retryT=null,syncT=null,pongs=[],pending=new Map(),joinTries=0,lost=false;
const peerId=c=>PEER_PREFIX+c.toLowerCase();
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let s='';for(let i=0;i<4;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}
const PeerC=()=>window.Peer||(window.peerjs&&window.peerjs.Peer);
function makePeer(id){
  const opts={debug:1,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(Array.isArray(CFG.iceServers)?CFG.iceServers:[])}};
  const P=PeerC();return id?new P(id,opts):new P(opts);
}
function setHostNet(t,bad){
  $('netStatus').textContent=t;$('netStatus').className='status'+(bad?' bad':'');
  $('codeChip').classList.toggle('bad',!!bad);
}
function netErr(e){
  const t=e&&e.type;
  if(t==='browser-incompatible')return 'Questo browser non supporta il collegamento diretto tra telefoni.';
  if(t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed')return 'Non riesco a collegarmi al servizio che mette in contatto i telefoni. Controlla la connessione.';
  return 'Errore di collegamento ('+(t||'sconosciuto')+(e&&e.message?': '+e.message:'')+').';
}
async function hostOpen(){
  setHostNet('Scarico il modulo di collegamento…');
  try{await loadScript('peer',()=>!!PeerC());}catch(e){setHostNet('Non riesco a scaricare il modulo di collegamento (PeerJS). Controlla la connessione, poi esci e ricrea la sessione.',true);openQr();return;}
  let shown=false;
  const tryOpen=()=>{
    code=newCode();$('codeChip').textContent=code;
    setHostNet('Mi registro sul servizio di collegamento…');
    try{peer=makePeer(peerId(code));}catch(e){setHostNet('Il browser non supporta il collegamento tra telefoni: '+e.message,true);openQr();return;}
    const tmo=setTimeout(()=>{if(peer&&!peer.open)setHostNet('Il servizio di collegamento non risponde. Controlla la connessione; se non cambia, esci e ricrea la sessione.',true);},12000);
    peer.on('open',()=>{clearTimeout(tmo);setHostNet('In linea: gli altri possono entrare con il codice '+code+'.');renderPeople();if(!shown){shown=true;openQr();}});
    peer.on('error',e=>{
      if(e.type==='unavailable-id'){clearTimeout(tmo);try{peer.destroy();}catch(_){}tryOpen();return;}
      if(e.type==='peer-unavailable')return;
      setHostNet(netErr(e),true);if(!shown){shown=true;openQr();}
    });
    peer.on('disconnected',()=>{setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect();}catch(_){}},1500);});
    peer.on('connection',c=>{
      c.on('open',()=>{conns.set(c.peer,{c,nm:'',inst:''});sendTo(c,{t:'state',s:S});});
      c.on('data',d=>onHostData(c,d));
      c.on('close',()=>{conns.delete(c.peer);renderPeople();broadcastRoster();});
      c.on('error',()=>{});
    });
  };
  tryOpen();
}
function sendTo(c,msg){try{if(c&&c.open)c.send(msg);}catch(e){}}
function broadcast(msg){for(const {c} of conns.values())sendTo(c,msg);}
function roster(){
  const list=[{nm:myName(),inst:prefs.inst,host:1}];
  for(const v of conns.values())if(v.nm)list.push({nm:v.nm,inst:v.inst});
  return list;
}
function broadcastRoster(){broadcast({t:'roster',list:roster()});}
async function onHostData(c,d){
  if(!d||typeof d!=='object')return;
  let me=conns.get(c.peer);if(!me){me={c,nm:'',inst:''};conns.set(c.peer,me);}
  if(d.t==='ping'){sendTo(c,{t:'pong',a:d.a,h:Date.now()});return;}
  if(d.t==='hello'){me.nm=String(d.nm||'').slice(0,24);me.inst=String(d.inst||'');renderPeople();broadcastRoster();return;}
  if(d.t==='getpdf'&&typeof d.f==='string'){
    let m=null;
    for(const p of (cur?cur.parts:[])){if(p.fileId===d.f&&!p.imgs)m=p.mod;for(const i of p.imgs||[])if(i.f===d.f)m=i.m;}
    if(m===null)return;
    try{const b=await pdfBytes(d.f,m);sendTo(c,{t:'pdf',f:d.f,data:b});}catch(e){sendTo(c,{t:'pdf',f:d.f,err:1});}
  }
}
async function guestJoin(c){
  joinStatus('Scarico il modulo di collegamento…');
  try{await loadScript('peer',()=>!!PeerC());}catch(e){joinStatus('Non riesco a scaricare il modulo di collegamento (PeerJS). Controlla la connessione e riprova.');return false;}
  joinStatus('');
  code=c;mode='guest';S=null;joinTries=0;lost=false;
  enterStand();
  showLoad('1/3 · Mi collego al servizio di collegamento…');
  try{peer=makePeer();}catch(e){showLoad('Questo browser non supporta il collegamento tra telefoni ('+e.message+').');return false;}
  const tmo=setTimeout(()=>{if(mode==='guest'&&peer&&!peer.open)showLoad('Il servizio di collegamento non risponde. Controlla la connessione del telefono, poi premi Esci e riprova.');},12000);
  peer.on('open',()=>{clearTimeout(tmo);guestConnect();});
  peer.on('error',e=>{
    if(mode!=='guest')return;
    if(e.type==='peer-unavailable'){
      joinTries++;
      if(!S)showLoad(joinTries>=2?'Non trovo la sessione '+code+'. Controlla il codice e che sul telefono di chi organizza la sessione sia «In linea». Riprovo da solo…':'2/3 · Cerco la sessione '+code+'…');
      else if(S)setGuestState('Collegamento perso, riprovo…');
      clearTimeout(retryT);retryT=setTimeout(guestConnect,3000);
      return;
    }
    if(!S)showLoad(netErr(e));else toast(netErr(e));
  });
  peer.on('disconnected',()=>{setTimeout(()=>{try{if(peer&&!peer.destroyed)peer.reconnect();}catch(_){}},1500);});
  return true;
}
function guestConnect(){
  if(mode!=='guest'||!peer||peer.destroyed)return;
  try{if(hostConn)hostConn.close();}catch(e){}
  const c=peer.connect(peerId(code),{reliable:true});hostConn=c;
  if(!S)showLoad('2/3 · Cerco la sessione '+code+'…');
  const tmo=setTimeout(()=>{if(hostConn===c&&!c.open&&mode==='guest'){
    const m='La sessione '+code+' esiste, ma la rete non permette il collegamento diretto tra i due dispositivi. Prova a mettere questo telefono sullo stesso Wi-Fi di chi organizza, o sul suo hotspot.';
    if(!S)showLoad(m);else setGuestState('Collegamento bloccato dalla rete');
    clearTimeout(retryT);retryT=setTimeout(guestConnect,4000);}},15000);
  c.on('open',()=>{
    clearTimeout(tmo);if(!S)showLoad('3/3 · Collegato. Aspetto il brano da chi organizza…');
    joinTries=0;lost=false;
    sendTo(c,{t:'hello',nm:myName(),inst:prefs.inst});
    clockSync(12);clearInterval(syncT);syncT=setInterval(()=>clockSync(5),20000);
    if(S)setGuestState(S.playing?'In corso':'In attesa del via');
  });
  c.on('data',onGuestData);
  c.on('close',()=>{
    if(mode!=='guest'||hostConn!==c)return;
    lost=true;setGuestState('Collegamento perso, riprovo…');
    clearTimeout(retryT);retryT=setTimeout(guestConnect,2500);
  });
  c.on('error',()=>{});
}
function clockSync(n){
  pongs=[];let i=0;
  const iv=setInterval(()=>{if(!hostConn||!hostConn.open||i++>=n){clearInterval(iv);return;}sendTo(hostConn,{t:'ping',a:Date.now()});},120);
}
function onGuestData(d){
  if(!d||typeof d!=='object')return;
  if(d.t==='pong'&&typeof d.a==='number'&&typeof d.h==='number'){
    const t1=Date.now(),rtt=t1-d.a;if(rtt<0||rtt>5000)return;
    pongs.push({rtt,off:d.h+rtt/2-t1});
    const best=pongs.slice().sort((a,b)=>a.rtt-b.rtt).slice(0,3);
    clockOff=best.reduce((a,p)=>a+p.off,0)/best.length;
    $('syncNote').textContent=`Orologio allineato con chi organizza (ritardo di rete ${Math.round(best[0].rtt)} ms).`;
    return;
  }
  if(d.t==='state'){receive(d.s);return;}
  if(d.t==='roster'&&Array.isArray(d.list)){renderPeople(d.list);return;}
  if(d.t==='pdf'&&typeof d.f==='string'){const p=pending.get(d.f);if(p){pending.delete(d.f);d.err||!d.data?p.rej(new Error('host')):p.res(d.data instanceof ArrayBuffer?d.data:(d.data.buffer||d.data));}}
}
function askHostPdf(f){
  return new Promise((res,rej)=>{
    if(!hostConn||!hostConn.open){rej(new Error('nohost'));return;}
    pending.set(f,{res,rej});sendTo(hostConn,{t:'getpdf',f});
    setTimeout(()=>{if(pending.has(f)){pending.delete(f);rej(new Error('timeout'));}},60000);
  });
}
function netClose(){
  clearTimeout(retryT);clearInterval(syncT);
  for(const {c} of conns.values()){try{c.close();}catch(e){}}
  conns.clear();
  try{if(hostConn)hostConn.close();}catch(e){}
  hostConn=null;
  try{if(peer)peer.destroy();}catch(e){}
  peer=null;
}

/* ================= Stato condiviso ================= */
function baseState(){return {rev:0,song:{kind:'demo',id:'ode'},bpm:100,beat:1,count:4,playing:false,startAt:0,fromBeat:0,k:''};}
function publish(){
  if(mode!=='host')return;
  S.rev=Date.now();S.k=apiKey();
  broadcast({t:'state',s:S});
}
function receive(d){
  if(!d||typeof d!=='object'||!d.song)return;
  if(S&&d.rev<S.rev)return;
  const prev=S&&S.playing;
  S={rev:+d.rev||0,song:d.song,bpm:clamp(+d.bpm||100,20,300),playing:!!d.playing,startAt:+d.startAt||0,fromBeat:Math.max(0,+d.fromBeat||0),beat:UNIT[+d.beat]?+d.beat:1,count:clamp(parseInt(d.count,10)||0,0,32),k:String(d.k||'')};
  applySong();
  onStateChange(prev);
}
function songStateKey(s){return s.kind==='pdf'?'pdf:'+s.id+':'+(s.v||0):'demo:'+s.id;}
function makePdfSong(d){
  const ts=Array.isArray(d.ts)&&d.ts.length===2?d.ts.map(Number):[4,4];const mQ=ts[0]*4/ts[1];
  const bars=Math.max(1,+d.bars||1);
  return {kind:'pdf',id:d.id,title:String(d.title||'Brano').slice(0,60),ts,mQ,bars,total:bars*mQ,notes:[],parts:Array.isArray(d.parts)?d.parts:[]};
}
function applySong(){
  const key=songStateKey(S.song);
  if(key===songKey)return;
  const keepPart=song&&song.kind==='pdf'&&S.song.kind==='pdf'&&song.id===S.song.id;
  songKey=key;
  song=S.song.kind==='pdf'?makePdfSong(S.song):parse(demoById(S.song.id).txt);
  if(!keepPart)panPx=0;
  rebuild();
}

/* ================= Home ================= */
function fillInst(sel){sel.textContent='';for(const i of INSTR){const o=document.createElement('option');o.value=i.id;o.textContent=i.n;sel.append(o);}sel.value=prefs.inst;}
fillInst($('instHome'));fillInst($('instSet'));
$('nick').value=prefs.nick;
function instNote(){const i=instById(prefs.inst);$('instNote').textContent=i.d?('Nei brani d\'esempio vedrai la '+i.d+'. Nei PDF ricevi la parte del tuo strumento.'):'Nei PDF ricevi la parte del tuo strumento.';}
instNote();
$('nick').oninput=e=>{prefs.nick=e.target.value.slice(0,24);savePrefs();};
$('instHome').onchange=e=>setInst(e.target.value);
function setInst(v){
  prefs.inst=v;savePrefs();$('instHome').value=v;$('instSet').value=v;instNote();
  if(mode==='guest')sendTo(hostConn,{t:'hello',nm:myName(),inst:prefs.inst});
  if(mode==='host'){renderPeople();broadcastRoster();}
  rebuild();
}
$('codeIn').oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'');};
$('codeIn').onkeydown=e=>{if(e.key==='Enter')$('joinBtn').click();};
function joinStatus(t){const s=$('joinStatus');s.hidden=!t;s.textContent=t||'';}
$('joinBtn').onclick=async()=>{
  unlockAudio();
  const c=$('codeIn').value.trim();
  if(c.length!==4){joinStatus('Il codice ha 4 lettere.');return;}
  if(!prefs.nick.trim()){joinStatus('Scrivi il tuo nome, così gli altri sanno chi c\'è.');$('nick').focus();return;}
  joinStatus('');
  $('joinBtn').disabled=true;
  await guestJoin(c);
  $('joinBtn').disabled=false;
};
$('createBtn').onclick=()=>{
  unlockAudio();
  mode='host';S=baseState();applySong();S.bpm=song.bpm;S.beat=defaultBeat(song.ts);S.count=barBeats(song.ts,S.beat);
  enterStand();
  hostOpen();
  if(rootFolder()&&apiKey())loadLibrary(false);
};
(function initHome(){
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=window.navigator.standalone||matchMedia('(display-mode: standalone)').matches;
  $('installHint').hidden=!(ios&&!standalone);
  const q=new URLSearchParams(location.search).get('s');
  if(q&&/^[A-Za-z]{4}$/.test(q)){$('codeIn').value=q.toUpperCase();joinStatus(prefs.nick?'Codice inserito: scegli lo strumento e premi Entra.':'Codice inserito: scrivi il tuo nome, scegli lo strumento e premi Entra.');}
  $('verNote').textContent='Versione '+VERSION;
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{try{r.update();}catch(e){}}).catch(()=>{});
})();

/* ================= Leggio ================= */
function enterStand(){
  $('home').hidden=true;$('stand').hidden=false;
  $('codeChip').textContent=mode==='host'?(code||'····'):code;
  const host=mode==='host';
  $('songBtn').hidden=!host;$('playBtn').hidden=!host;$('guestState').hidden=host;
  setGuestState('In attesa');
  checkRotate();renderPeople();
  requestAnimationFrame(()=>rebuild());
  updateBar();
}
function leave(){
  stopAudio();releaseWake();
  if(mode==='host'&&S&&S.playing){S.playing=false;publish();}
  netClose();
  mode='home';S=null;song=null;songKey='';PV.key='';PV.layout=null;cur=null;showLoad('');
  document.querySelectorAll('.sheet').forEach(s=>s.hidden=true);
  $('stand').hidden=true;$('home').hidden=false;joinStatus('');
}
$('leaveBtn').onclick=leave;
function setGuestState(t){$('guestState').textContent=t;}
function renderPeople(list){
  if(!list)list=mode==='host'?roster():[];
  const box=$('people');box.textContent='';
  for(const p of list){
    const d=document.createElement('span');d.className='person'+(p.host?' host':'');
    const b=document.createElement('b');const me=(mode==='host'&&p.host)||(mode==='guest'&&!p.host&&p.nm===myName());
    b.textContent=String(p.nm||'').slice(0,24)+(me?' (tu)':'');
    d.append(b,document.createTextNode(' · '+instById(String(p.inst)).n));
    box.append(d);
  }
}
function updateBar(){
  if(!song){$('songTitle').textContent=mode==='guest'?'In attesa…':'—';$('songMeta').textContent='';return;}
  $('songTitle').textContent=song.title;
  let meta=song.ts[0]+'/'+song.ts[1]+' · '+(S?S.bpm:song.bpm)+' BPM'+(S&&beatQ()!==1?' ('+UNIT[beatQ()]+')':'')+' · '+song.bars+' battute';
  if(song.kind==='pdf'){const p=song.parts[choosePart(song)];if(p)meta+=' · '+p.label;}
  $('songMeta').textContent=meta;
  const p=$('playBtn');
  if(S&&S.playing){p.className='ibtn stop';p.textContent='Stop';}else{p.className='ibtn go';p.textContent='Avvia';}
  if(mode==='guest'&&!lost)setGuestState(!S?'In attesa':S.playing?'In corso':'In attesa del via');
}
function onStateChange(prevPlaying){
  updateBar();resetSched();
  if(S.playing)reqWake();else releaseWake();
  if(!S.playing)panPx=0;
  if(mode==='guest'&&S.playing&&!prevPlaying&&!(ctx&&ctx.state==='running'))toast('Tocca lo schermo per attivare il metronomo.');
}

/* --- comandi dell'organizzatore --- */
$('playBtn').onclick=()=>{
  unlockAudio();
  if(!S||!song)return;
  if(S.playing){
    const b=posAt(viewNow());S.playing=false;
    const bar=clamp(Math.floor(Math.max(0,b)/song.mQ)+1,1,song.bars);
    S.fromBeat=(bar-1)*song.mQ;$('barIn').value=bar;
  }else{
    const bar=clamp(parseInt($('barIn').value,10)||1,1,song.bars);
    S.fromBeat=(bar-1)*song.mQ;S.playing=true;S.startAt=hostNow()+1500;
  }
  publish();onStateChange();
};
function canEditSong(){return S&&!S.playing&&mode==='host';}
function hostChange(fn){if(!canEditSong())return;fn();applySong();publish();updateBar();resetSched();}
function openSongSheet(){
  if(!S)return;
  const lock=S.playing;$('lockNote').hidden=!lock;
  ['bpmIn','bpmRange','bpmDn','bpmUp','barIn','countIn','beatSel','cnt1','cnt2','tsSel'].forEach(id=>$(id).disabled=lock);
  $('bpmIn').value=S.bpm;$('bpmRange').value=S.bpm;$('countIn').value=S.count;$('beatSel').value=String(beatQ());countHint();
  $('tsSel').value=song?song.ts.join('/'):'4/4';$('tsSel').disabled=lock||!song||song.kind!=='pdf';
  $('barIn').max=song?song.bars:1;
  $('folderIn').value=prefs.folder||'';$('keyIn').value=prefs.apiKey||'';
  $('driveCfg').open=!(rootFolder()&&apiKey());
  renderLib();renderDemos();renderParts();
  $('songSheet').hidden=false;
}
$('songBtn').onclick=openSongSheet;
async function saveMeta(patch){if(!cur)return;const k='meta:'+cur.id;const m=Object.assign((await idb.get(k))||{},patch);await idb.set(k,m);}
const setBpm=v=>{v=clamp(Math.round(+v||0),30,240);$('bpmIn').value=v;$('bpmRange').value=v;hostChange(()=>{S.bpm=v;});if(song&&song.kind==='pdf')saveMeta({bpm:v});};
$('bpmIn').onchange=e=>setBpm(e.target.value);
$('bpmRange').oninput=e=>{$('bpmIn').value=e.target.value;};
$('bpmRange').onchange=e=>setBpm(e.target.value);
$('bpmDn').onclick=()=>setBpm(+$('bpmIn').value-2);
$('bpmUp').onclick=()=>setBpm(+$('bpmIn').value+2);
$('barIn').onchange=e=>{if(!song)return;const v=clamp(parseInt(e.target.value,10)||1,1,song.bars);e.target.value=v;hostChange(()=>{S.fromBeat=(v-1)*song.mQ;});panPx=0;};
function countHint(){if(!song||!S)return;const n=barBeats(song.ts,beatQ());$('cntHint').textContent=`Con questo battito una battuta di ${song.ts.join('/')} conta ${n} battit${n===1?'o':'i'}.`;$('cnt1').textContent='1 battuta ('+n+')';$('cnt2').textContent='2 battute ('+2*n+')';}
function setCount(v){v=clamp(parseInt(v,10)||0,0,32);$('countIn').value=v;hostChange(()=>{S.count=v;});if(cur&&song&&song.kind==='pdf')saveMeta({count:v});}
$('countIn').onchange=e=>setCount(e.target.value);
$('cnt1').onclick=()=>setCount(barBeats(song.ts,beatQ()));
$('cnt2').onclick=()=>setCount(2*barBeats(song.ts,beatQ()));
$('beatSel').onchange=e=>{const b=+e.target.value;if(!UNIT[b])return;hostChange(()=>{S.beat=b;});if(cur&&song&&song.kind==='pdf')saveMeta({beat:b});countHint();};
$('tsSel').onchange=e=>{
  if(!cur||!canEditSong())return;
  cur.ts=e.target.value.split('/').map(Number);
  const b=defaultBeat(cur.ts),c=barBeats(cur.ts,b);
  S.beat=b;S.count=c;$('beatSel').value=String(b);$('countIn').value=c;
  saveMeta({ts:cur.ts,beat:b,count:c});pushCur();countHint();
};

/* --- brani d'esempio --- */
function renderDemos(){
  const box=$('demoList');box.textContent='';
  for(const d of DEMOS){
    const p=parse(d.txt);const r=document.createElement('div');r.className='item'+(S&&S.song.kind==='demo'&&S.song.id===d.id?' cur':'');
    const t=document.createElement('span');t.className='t';t.textContent=p.title;
    const s=document.createElement('span');s.className='s';s.textContent=p.ts.join('/')+' · '+p.bars+' battute';
    const b=document.createElement('button');b.className='ibtn';b.textContent='Usa';b.disabled=!canEditSong();
    b.onclick=()=>{hostChange(()=>{S.song={kind:'demo',id:d.id};S.fromBeat=0;cur=null;});S.bpm=song.bpm;S.beat=defaultBeat(song.ts);S.count=barBeats(song.ts,S.beat);$('barIn').value=1;publish();updateBar();openSongSheet();};
    r.append(t,s,b);box.append(r);
  }
}

/* --- Drive: elenco brani --- */
function driveStatus(t){const s=$('driveStatus');s.hidden=!t;s.textContent=t||'';}
// navigazione tra le cartelle: nav = [{id,title,folders,pdfs}]
let nav=[];
async function listFolder(id,title){
  const items=await driveList(id);
  return {id,title,folders:items.filter(f=>f.mimeType===FOLDER).sort(byName).map(f=>({id:f.id,title:f.name})),pdfs:items.filter(isSheet).sort(byName)};
}
async function loadLibrary(force){
  if(!rootFolder()||!apiKey()){lib=null;nav=[];driveStatus('Collega la cartella Drive dalle impostazioni qui sotto.');renderLib();return;}
  const root=rootFolder();
  if(!force&&!lib){const c=await idb.get('nav:'+root);if(c&&c.id){nav=[c];lib=c.folders;renderLib();}}
  const at=force&&nav.length>1?nav[nav.length-1]:null;
  driveStatus('Leggo la cartella su Drive…');
  try{
    if(at){const f=await listFolder(at.id,at.title);nav[nav.length-1]=f;}
    else{
      const m=await driveMeta(root).catch(()=>({name:'Drive'}));
      const f=await listFolder(root,m.name||'Cartella principale');nav=[f];await idb.set('nav:'+root,f);
    }
    lib=nav[nav.length-1].folders;
    const top=nav[nav.length-1];
    driveStatus(top.folders.length||top.pdfs.length?'':'Questa cartella è vuota.');
  }catch(e){driveStatus(driveMsg(e)+(nav.length?' Uso l\'ultimo elenco salvato.':''));}
  renderLib();
}
async function openFolder(f){
  if(opening)return;
  if(!canEditSong()){driveStatus('Ferma il brano per cambiare spartito.');return;}
  driveStatus('Leggo «'+f.title+'»…');
  try{
    const r=await listFolder(f.id,f.title);
    if(!r.folders.length&&r.pdfs.length){driveStatus('');openBrano(r);return;}
    if(!r.folders.length){driveStatus('Nella cartella «'+f.title+'» non ci sono PDF, immagini o altre cartelle.');return;}
    nav.push(r);lib=r.folders;driveStatus('');renderLib();
    $('libList').scrollIntoView({block:'nearest'});
  }catch(e){driveStatus(driveMsg(e));}
}
function renderLib(){
  const box=$('libList');box.textContent='';
  if(!nav.length){if(rootFolder()&&apiKey()){const e=document.createElement('div');e.className='empty';e.textContent='Premi «Aggiorna» per leggere i brani.';box.append(e);}return;}
  const top=nav[nav.length-1];
  if(nav.length>1){
    const r=document.createElement('div');r.className='row';
    const back=document.createElement('button');back.className='ibtn';back.textContent='← '+nav[nav.length-2].title;
    back.onclick=()=>{nav.pop();lib=nav[nav.length-1].folders;driveStatus('');renderLib();};
    const here=document.createElement('span');here.className='note';here.textContent=nav.slice(1).map(n=>n.title).join(' › ');
    r.append(back,here);box.append(r);
  }
  const ed=canEditSong();
  if(top.pdfs.length&&(top.folders.length||nav.length===1)){
    const r=document.createElement('div');r.className='item'+(cur&&cur.id===top.id?' cur':'');
    const t=document.createElement('span');t.className='t';t.textContent=top.title;
    const s2=document.createElement('span');s2.className='s';s2.textContent=top.pdfs.length+' spartiti in questa cartella';
    const b=document.createElement('button');b.className='ibtn';b.textContent=cur&&cur.id===top.id?'Aperto':'Apri come brano';b.disabled=!ed;
    b.onclick=()=>openBrano(top);
    r.append(t,s2,b);box.append(r);
  }
  for(const d of top.folders){
    const r=document.createElement('div');r.className='item'+(cur&&cur.id===d.id?' cur':'');
    const t=document.createElement('span');t.className='t';t.textContent=d.title;
    const b=document.createElement('button');b.className='ibtn';b.textContent=cur&&cur.id===d.id?'Aperto':'Apri';b.disabled=!ed;
    b.onclick=()=>openFolder(d);
    r.append(t,b);box.append(r);
  }
}
$('refreshBtn').onclick=()=>loadLibrary(true);
$('cfgSave').onclick=()=>{
  prefs.folder=$('folderIn').value.trim();prefs.apiKey=$('keyIn').value.trim();savePrefs();
  if(prefs.folder&&!folderIdOf(prefs.folder)){driveStatus('Il link della cartella non sembra valido: deve contenere «/folders/».');return;}
  $('driveCfg').open=false;lib=null;loadLibrary(true);
};

/* --- Drive: apertura di un brano --- */
let opening=false;
async function openBrano(b){
  if(!canEditSong()||opening)return;
  opening=true;driveStatus('Leggo «'+b.title+'»…');
  try{
    const files=b.pdfs||(await driveList(b.id)).filter(isSheet).sort(byName);
    if(!files.length){driveStatus('Nella cartella «'+b.title+'» non ci sono PDF o immagini.');return;}
    const items=groupParts(files);
    const meta=(await idb.get('meta:'+b.id))||{};
    if(items.some(g=>!g.img))await loadPdfJs();
    const parts=[];
    for(let i=0;i<items.length;i++){
      const g=items[i],f=g.files[0],label=g.label;
      driveStatus(`Scarico e leggo «${label}» (${i+1} di ${items.length})…`);
      const mod=g.files.map(x=>x.modifiedTime||'0').join('|');
      const part={fileId:f.id,mod,label,inst:(meta.inst||{})[f.id]||guessInst(g.label),sys:[],pages:[],err:''};
      if(g.img)part.imgs=g.files.map(x=>({f:x.id,m:x.modifiedTime||'0',t:imgType(x)}));
      const ak='an:'+g.files.map(x=>x.id).join('+')+':'+mod;part.ak=ak;
      let an=await idb.get(ak);
      try{
        if(!an){const doc=await openPartDoc(part);an=await analyzeDoc(doc,(p,n)=>driveStatus(`Leggo «${label}» · pagina ${p} di ${n} (${i+1} di ${items.length})`));try{doc.destroy();}catch(e){}await idb.set(ak,an);}
        part.sys=an.sys;part.pages=an.pages;if(an.rots&&an.rots.some(Boolean))part.rots=an.rots;
        if(!an.sys.length)part.err=g.img?'Nessun pentagramma trovato nella foto: serve più dritta e nitida':'Nessun pentagramma trovato';
      }catch(e){part.err=e&&e.status?driveMsg(e):e&&e.img?'Formato immagine non leggibile da questo browser (converti in JPG)':'File non leggibile';}
      parts.push(part);
    }
    cur={id:b.id,title:b.title,parts,ts:meta.ts||[4,4],bpm:meta.bpm||100,bars:meta.bars||0,v:Date.now()};
    S.beat=UNIT[meta.beat]?meta.beat:defaultBeat(cur.ts);S.count=meta.count!=null?meta.count:barBeats(cur.ts,S.beat);
    driveStatus('');
    S.fromBeat=0;$('barIn').value=1;
    pushCur();
    hostChange(()=>{S.bpm=cur.bpm;});
    openSongSheet();
  }catch(e){driveStatus(driveMsg(e));}
  finally{opening=false;}
}
function expectedBars(){
  if(cur.bars)return cur.bars;
  const cnt={};for(const p of cur.parts){if(!p.err){const b=partBars(p);cnt[b]=(cnt[b]||0)+1;}}
  let best=0,bc=0;for(const [b,c] of Object.entries(cnt))if(c>bc||(c===bc&&+b>best)){best=+b;bc=c;}
  return best||1;
}
function curToState(){
  return {kind:'pdf',id:cur.id,title:cur.title,ts:cur.ts,bars:expectedBars(),v:cur.v,
    parts:cur.parts.filter(p=>!p.err).map(p=>Object.assign({fileId:p.fileId,mod:p.mod,label:p.label,inst:p.inst,sys:p.sys,pages:p.pages},p.imgs?{imgs:p.imgs}:{},p.rots?{rots:p.rots}:{}))};
}
function pushCur(){if(!cur||!canEditSong())return;cur.v=Date.now();S.song=curToState();applySong();publish();updateBar();renderParts();}
function renderParts(){
  const sec=$('partsSec');
  if(!cur||!S||S.song.kind!=='pdf'||S.song.id!==cur.id){sec.hidden=true;return;}
  sec.hidden=false;
  const exp=expectedBars();
  $('partsHead').textContent=`«${cur.title}»: ${exp} battute di riferimento. Una parte con un numero diverso scorrerebbe fuori tempo: aprila con «Controlla» (di solito sono pause di più battute contate come una).`;
  const box=$('partsBox');box.textContent='';
  cur.parts.forEach((p,i)=>{
    const r=document.createElement('div');r.className='part';
    const t=document.createElement('span');t.className='fn';t.textContent=p.label;
    const sel=document.createElement('select');sel.id='pi'+i;sel.setAttribute('aria-label','Strumento di '+p.label);
    for(const it of INSTR){const o=document.createElement('option');o.value=it.id;o.textContent=it.n;sel.append(o);}
    sel.value=p.inst;sel.disabled=!canEditSong();
    sel.onchange=async()=>{p.inst=sel.value;const m=(await idb.get('meta:'+cur.id))||{};m.inst=m.inst||{};m.inst[p.fileId]=p.inst;await idb.set('meta:'+cur.id,m);pushCur();};
    const s=document.createElement('span');s.className='s';
    const pill=document.createElement('span');
    if(p.err){s.textContent=p.err;pill.className='pill warn';pill.textContent='Esclusa';}
    else{const b=partBars(p);s.textContent=p.sys.filter(x=>!x.off).length+' righi · '+b+' battute';const ok=b===exp;pill.className='pill '+(ok?'ok':'warn');pill.textContent=ok?'In tempo':(b>exp?'+':'')+(b-exp)+' battute';}
    const chk=document.createElement('button');chk.className='ibtn';chk.textContent='Controlla';chk.disabled=!!p.err||!canEditSong();chk.onclick=()=>openReview(i);
    r.append(t,sel,s,pill,chk);box.append(r);
  });
}
let rvToken=0;
async function openReview(i){
  const p=cur.parts[i];const box=$('rvBox');box.hidden=false;box.textContent='';const tok=++rvToken;
  const h=document.createElement('h3');h.style.fontSize='20px';h.textContent='Righi di «'+p.label+'»';
  const close=document.createElement('button');close.className='ibtn';close.textContent='Fatto';
  close.onclick=async()=>{box.hidden=true;box.textContent='';rvToken++;await idb.set(p.ak||('an:'+p.fileId+':'+p.mod),{sys:p.sys,pages:p.pages,rots:p.rots});pushCur();};
  h.append(close);box.append(h);
  const note=document.createElement('p');note.className='note';note.textContent='Le linee blu sono le stanghette trovate. Se un rigo ha battute in più o in meno (una pausa di 8 battute conta 8), correggi il numero: le battute del rigo vengono divise in parti uguali. «Escludi» toglie un rigo che non va suonato. Premi «Fatto» per mandare le correzioni a tutti.';box.append(note);
  const rv=document.createElement('div');rv.className='rv';box.append(rv);
  box.scrollIntoView({behavior:'smooth',block:'start'});
  let doc;try{doc=await openPartDoc(p);}catch(e){note.textContent='Non riesco ad aprire lo spartito.';return;}
  const W=Math.min(1400,Math.round((rv.clientWidth||700)*Math.min(2,devicePixelRatio||1)));
  for(let k=0;k<p.sys.length;k++){
    if(tok!==rvToken)break;
    const s=p.sys[k];const cx0=Math.max(0,s.x0-0.012),cx1=Math.min(1,s.x1+0.012);
    const row=document.createElement('div');row.className='rvrow'+(s.off?' off':'');
    let cv;try{cv=await renderCrop(doc,s.p,cx0,s.cy0,cx1,s.cy1,W);}catch(e){continue;}
    const base=document.createElement('canvas');base.width=cv.width;base.height=cv.height;
    const paint=()=>{const x=base.getContext('2d');x.drawImage(cv,0,0);x.fillStyle='rgba(42,69,204,.85)';const kk=cv.width/(cx1-cx0);s.b.forEach(bx=>x.fillRect((bx-cx0)*kk-1.5,0,3,cv.height));x.font=`600 ${Math.max(12,Math.round(cv.height*0.1))}px sans-serif`;for(let j=0;j<s.b.length-1;j++)x.fillText(String(j+1),((s.b[j]+s.b[j+1])/2-cx0)*kk-4,Math.max(14,cv.height*0.12));};
    paint();
    const ctl=document.createElement('div');ctl.className='rvctl';
    const lab=document.createElement('span');lab.textContent=`Rigo ${k+1} · pag. ${s.p+1}`;
    const mn=document.createElement('button');mn.className='ibtn';mn.textContent='−';mn.setAttribute('aria-label','Una battuta in meno');
    const num=document.createElement('span');num.className='num';num.textContent=sysBars(s);
    const pl=document.createElement('button');pl.className='ibtn';pl.textContent='+';pl.setAttribute('aria-label','Una battuta in più');
    const bl=document.createElement('span');bl.textContent='battute';
    const ex=document.createElement('button');ex.className='ibtn';ex.textContent=s.off?'Includi':'Escludi';
    const upd=()=>{num.textContent=sysBars(s);paint();row.className='rvrow'+(s.off?' off':'');ex.textContent=s.off?'Includi':'Escludi';};
    mn.onclick=()=>{setSysBars(s,sysBars(s)-1);upd();};pl.onclick=()=>{setSysBars(s,sysBars(s)+1);upd();};ex.onclick=()=>{s.off=s.off?0:1;upd();};
    ctl.append(lab,mn,num,pl,bl,ex);row.append(base,ctl);rv.append(row);
  }
  try{doc.destroy();}catch(e){}
}

/* --- QR --- */
function joinUrl(){return location.origin+location.pathname.replace(/index\.html$/,'')+'?s='+code;}
$('codeChip').onclick=()=>openQr();
async function openQr(){
  if(mode!=='host')return;
  $('qrCode').textContent=code;$('qrLink').textContent=joinUrl();$('qrSheet').hidden=false;
  const box=$('qrBox');box.textContent='';box.hidden=false;
  try{await loadScript('qr',()=>!!window.qrcode);const q=window.qrcode(0,'M');q.addData(joinUrl());q.make();box.innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});}
  catch(e){box.hidden=true;}
}
$('copyLink').onclick=async()=>{try{await navigator.clipboard.writeText(joinUrl());toast('Link copiato.');}catch(e){const r=document.createRange();r.selectNodeContents($('qrLink'));const s=getSelection();s.removeAllRanges();s.addRange(r);}};

/* --- impostazioni personali --- */
function bindRange(id,key,fmt,after){const el=$(id),out=$(id.replace('Set','Out'));el.value=prefs[key];if(out)out.textContent=fmt(prefs[key]);
  el.oninput=()=>{prefs[key]=+el.value;if(out)out.textContent=fmt(prefs[key]);savePrefs();if(after)after();};}
bindRange('zoomSet','zoom',v=>'×'+(+v).toFixed(1),()=>rebuild());
bindRange('sizeSet','size',v=>Math.round(v*100)+'%',()=>rebuild());
bindRange('headSet','head',v=>Math.round(v*100)+'%',()=>rebuild());
bindRange('volSet','vol',v=>Math.round(v*100)+'%');
bindRange('offSet','off',v=>(v>0?'+':'')+v+' ms',()=>resetSched());
$('metSet').checked=prefs.met;$('guideSet').checked=prefs.guide;$('octSet').value=String(prefs.oct);
$('markSet').checked=prefs.mark;$('invSet').checked=prefs.inv;$('modeSet').value=prefs.pdfMode;
$('metSet').onchange=e=>{prefs.met=e.target.checked;savePrefs();resetSched();unlockAudio();};
$('guideSet').onchange=e=>{prefs.guide=e.target.checked;savePrefs();resetSched();unlockAudio();};
$('octSet').onchange=e=>{prefs.oct=e.target.value;savePrefs();rebuild();};
$('markSet').onchange=e=>{prefs.mark=e.target.checked;savePrefs();PV.dirty=true;};
$('invSet').onchange=e=>{prefs.inv=e.target.checked;savePrefs();PV.dirty=true;};
$('modeSet').onchange=e=>{prefs.pdfMode=e.target.value;savePrefs();panPx=0;$('rowsField').hidden=prefs.pdfMode==='h';rebuild();};
$('rowsSet').value=String(prefs.rows);$('rowsSet').onchange=e=>{prefs.rows=e.target.value;savePrefs();rebuild();};
$('instSet').onchange=e=>setInst(e.target.value);
$('setBtn').onclick=()=>{fillParts();$('setSheet').hidden=false;};
document.querySelectorAll('.sheet').forEach(sh=>{sh.addEventListener('click',e=>{if(e.target===sh||e.target.closest('[data-close]'))sh.hidden=true;});});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.sheet').forEach(s=>s.hidden=true);});
function checkRotate(){$('rotate').hidden=mode==='home'||prefs.rot||(song&&song.kind==='pdf')||!(innerHeight>innerWidth&&innerWidth<700);}
$('rotOk').onclick=()=>{prefs.rot=true;savePrefs();checkRotate();};
let rzT=null;
addEventListener('resize',()=>{checkRotate();clearTimeout(rzT);rzT=setTimeout(rebuild,150);});

/* ================= Disegno ================= */
let G=null,noteEls=[];
function showLoad(msg){const m=$('loadMsg');m.hidden=!msg;m.textContent=msg||'';}
function rebuild(){
  if(!song||mode==='home')return;
  const vp=$('vp');const W=vp.clientWidth,H=vp.clientHeight;if(!W||!H)return;
  const isPdf=song.kind==='pdf';
  $('score').style.display=isPdf?'none':'';$('clef').style.display=isPdf?'none':'';$('pdfc').hidden=!isPdf;$('ph').hidden=isPdf;
  $('zoomRow').hidden=isPdf;
  checkRotate();fillParts();
  if(isPdf){G=null;pdfSetup(W,H);updateBar();return;}
  showLoad('');PV.key='';
  const inst=instById(prefs.inst),clef=CLEF[inst.c==='C'||inst.c==='F'?inst.c:'G'];
  const s=clamp(H/13,7,22)*prefs.size;
  const ppb=s*4.4*prefs.zoom;
  const midY=Math.round(H/2)+0.5;
  const tr=inst.t;
  let w=song.notes.map(n=>{
    if(n.r)return n;
    let li,oct,acc;
    if(tr===0){li=n.li;oct=n.oct;acc=n.acc;}
    else{const m=n.midi+tr,pc=((m%12)+12)%12;oct=Math.floor(m/12)-1;[li,acc]=SHARP[pc];}
    return Object.assign({},n,{wacc:acc,dn:oct*7+li});
  });
  const pitched=w.filter(n=>!n.r);
  let k=0;
  if(prefs.oct==='auto'){if(pitched.length){const mean=pitched.reduce((a,n)=>a+n.dn,0)/pitched.length;k=Math.round((clef.mid-mean)/7);}}
  else k=+prefs.oct;
  if(k)w=w.map(n=>n.r?n:Object.assign({},n,{dn:n.dn+7*k}));
  const headX=Math.round(W*prefs.head);
  const xOf=b=>s*2+b*ppb+s;
  const totalW=Math.ceil(xOf(song.total)+W);
  const yOf=dn=>midY-(dn-clef.mid)*(s/2);
  const sw=Math.max(1,s*0.1);
  const out=[];
  const lines=[];for(let i=-2;i<=2;i++)lines.push(midY+i*s);
  out.push(`<g stroke="var(--ink)" stroke-width="${sw.toFixed(2)}" opacity=".55">`+lines.map(y=>`<line x1="0" x2="${totalW}" y1="${y}" y2="${y}"/>`).join('')+'</g>');
  let bl='';const fs=Math.max(10,s*0.95);
  for(let b=0;b<=song.bars;b++){
    const x=xOf(b*song.mQ)-s*1.05;const last=b===song.bars;
    if(b>0)bl+=`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${(midY-2*s).toFixed(1)}" y2="${(midY+2*s).toFixed(1)}" stroke="var(--ink)" stroke-width="${(sw*1.3).toFixed(2)}"/>`;
    if(last)bl+=`<rect x="${(x+s*0.35).toFixed(1)}" y="${(midY-2*s).toFixed(1)}" width="${(s*0.45).toFixed(1)}" height="${(4*s).toFixed(1)}" fill="var(--ink)"/>`;
    else bl+=`<text x="${(x+s*0.2).toFixed(1)}" y="${(midY-4.6*s).toFixed(1)}" font-family="var(--f-mono)" font-size="${fs.toFixed(1)}" fill="var(--muted)">${b+1}</text>`;
  }
  out.push(bl);
  noteEls=[];let nh='';
  const rx=s*0.62,ry=s*0.44;
  const isDot=d=>[0.375,0.75,1.5,3,6].some(v=>Math.abs(d-v)<1e-6);
  w.forEach((n,i)=>{
    const x=xOf(n.b);let g=`<g class="n" id="n${i}">`;
    const dotted=isDot(n.d),base=dotted?n.d/1.5:n.d;
    if(n.r){
      const y=midY;
      if(base>=4)g+=`<rect x="${x-s*.6}" y="${y-s}" width="${s*1.2}" height="${s*.5}" stroke="none"/>`;
      else if(base>=2)g+=`<rect x="${x-s*.6}" y="${y-s*.5}" width="${s*1.2}" height="${s*.5}" stroke="none"/>`;
      else if(base>=1)g+=`<path d="M${x-s*.25} ${y-s*1.5} L${x+s*.35} ${y-s*.7} L${x-s*.2} ${y-s*.05} L${x+s*.35} ${y+s*.6} C${x-s*.55} ${y+s*.35} ${x-s*.35} ${y+s*1.1} ${x+s*.05} ${y+s*1.35}" fill="none" stroke-width="${s*.24}" stroke-linejoin="round" stroke-linecap="round"/>`;
      else{const flags=base>=0.5?1:2;g+=`<line x1="${x+s*.35}" y1="${y-s*.7}" x2="${x-s*.15}" y2="${y+s*1.1}" stroke-width="${s*.16}"/>`;
        for(let f=0;f<flags;f++){const yy=y-s*.7+f*s*.8;g+=`<circle cx="${x-s*.2}" cy="${yy+s*.05}" r="${s*.26}" stroke="none"/><path d="M${x-s*.2} ${yy+s*.25} Q${x+s*.1} ${yy+s*.35} ${x+s*.35-f*s*.2} ${yy}" fill="none" stroke-width="${s*.12}"/>`;}}
      if(dotted)g+=`<circle cx="${x+s*.95}" cy="${y-s*.5}" r="${s*.17}" stroke="none"/>`;
    }else{
      const y=yOf(n.dn),off=n.dn-clef.mid;
      if(off>=6)for(let t=6;t<=off;t+=2)g+=`<line x1="${x-s*1.05}" x2="${x+s*1.05}" y1="${yOf(clef.mid+t)}" y2="${yOf(clef.mid+t)}" stroke-width="${sw}"/>`;
      if(off<=-6)for(let t=-6;t>=off;t-=2)g+=`<line x1="${x-s*1.05}" x2="${x+s*1.05}" y1="${yOf(clef.mid+t)}" y2="${yOf(clef.mid+t)}" stroke-width="${sw}"/>`;
      const open=base>=2;
      g+=`<ellipse class="${open?'hd-open':''}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${y})" ${open?`fill="var(--paper)" stroke-width="${s*.17}"`:'stroke="none"'}/>`;
      if(n.wacc)g+=`<text x="${x-s*1.15}" y="${y+s*.38}" text-anchor="end" font-family="var(--f-music)" font-size="${s*1.7}" stroke="none">${n.wacc>0?'♯':'♭'}</text>`;
      if(base<4){
        const up=off<0;const sx=up?x+s*0.56:x-s*0.56;const ye=up?y-s*3.4:y+s*3.4;
        g+=`<line x1="${sx}" x2="${sx}" y1="${up?y-s*.15:y+s*.15}" y2="${ye}" stroke-width="${s*.12}"/>`;
        const flags=base<=0.25?2:base<=0.5?1:0;
        for(let f=0;f<flags;f++){const fy=ye+(up?1:-1)*f*s*.8;
          g+=up?`<path d="M${sx} ${fy} C${sx+s*.2} ${fy+s*1.1} ${sx+s*1.3} ${fy+s*1.2} ${sx+s*.85} ${fy+s*2.4}" fill="none" stroke-width="${s*.2}"/>`
               :`<path d="M${sx} ${fy} C${sx+s*.2} ${fy-s*1.1} ${sx+s*1.3} ${fy-s*1.2} ${sx+s*.85} ${fy-s*2.4}" fill="none" stroke-width="${s*.2}"/>`;}
      }
      if(dotted){const dy=(off%2===0)?-s*.5:0;g+=`<circle cx="${x+s*1.05}" cy="${y+dy}" r="${s*.17}" stroke="none"/>`;}
    }
    nh+=g+'</g>';
  });
  out.push(nh);
  const svg=$('score');
  svg.setAttribute('width',totalW);svg.setAttribute('height',H);svg.setAttribute('viewBox',`0 0 ${totalW} ${H}`);
  svg.innerHTML=out.join('');
  for(let i=0;i<w.length;i++)noteEls.push(document.getElementById('n'+i));
  const cw=s*5.2;const c=$('clef');
  c.setAttribute('width',cw+s*2);c.setAttribute('height',H);c.setAttribute('viewBox',`0 0 ${cw+s*2} ${H}`);
  let cl=`<defs><linearGradient id="cfade" x1="0" x2="1"><stop offset="0" stop-color="var(--paper)" stop-opacity="1"/><stop offset="1" stop-color="var(--paper)" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="${cw}" height="${H}" fill="var(--paper)"/><rect x="${cw}" y="0" width="${s*2}" height="${H}" fill="url(#cfade)"/>`;
  cl+=`<g stroke="var(--ink)" stroke-width="${sw}" opacity=".55">`+lines.map(y=>`<line x1="0" x2="${cw}" y1="${y}" y2="${y}"/>`).join('')+'</g>';
  cl+=`<text x="${s*.5}" y="${midY+clef.dy*s}" font-family="var(--f-music)" font-size="${s*clef.fs}" fill="var(--ink)" dominant-baseline="middle">${clef.glyph}</text>`;
  cl+=`<g font-family="var(--f-display)" font-weight="800" font-size="${s*2.3}" fill="var(--ink)" text-anchor="middle"><text x="${s*4}" y="${midY-s*.08}">${song.ts[0]}</text><text x="${s*4}" y="${midY+s*1.92}">${song.ts[1]}</text></g>`;
  c.innerHTML=cl;
  $('ph').style.left=(headX-1)+'px';
  G={s,ppb,headX,xOf,w};
  curIdx=-1;pastUntil=-1;
  updateBar();
}

/* ================= Vista PDF ================= */
const PV={key:'',part:null,doc:null,layout:null,lkey:'',crops:new Map(),busy:false,cur:0,lastOff:NaN,dirty:true};
const docCache=new Map();
function getDoc(part){
  const k=part.fileId+':'+part.mod;
  if(!docCache.has(k)){
    if(docCache.size>=3){for(const [kk,p] of docCache){if(kk!==k){p.then(d=>{try{d.destroy();}catch(e){}}).catch(()=>{});docCache.delete(kk);break;}}}
    docCache.set(k,openPartDoc(part).catch(e=>{docCache.delete(k);throw e;}));
  }
  return docCache.get(k);
}
function choosePart(sg){
  if(!sg.parts.length)return 0;
  const saved=(prefs.parts||{})[sg.id];
  if(saved!=null&&sg.parts[saved])return +saved;
  const i=sg.parts.findIndex(p=>p.inst===prefs.inst);
  return i<0?0:i;
}
function fillParts(){
  const f=$('partField'),sel=$('partSet');
  const pdf=song&&song.kind==='pdf';
  f.hidden=!pdf;$('modeField').hidden=!pdf;$('rowsField').hidden=!pdf||prefs.pdfMode==='h';$('octField').hidden=!!pdf;
  if(!pdf)return;
  sel.textContent='';
  song.parts.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.label+' ('+instById(p.inst).n+')';sel.append(o);});
  sel.value=choosePart(song);
}
$('partSet').onchange=e=>{prefs.parts=prefs.parts||{};prefs.parts[song.id]=+e.target.value;savePrefs();rebuild();};
async function pdfSetup(W,H){
  if(!song.parts.length){showLoad('Questo brano non ha parti leggibili.');PV.layout=null;return;}
  const idx=choosePart(song);const part=song.parts[idx];
  const key=song.id+':'+part.fileId+':'+part.mod;
  PV.part=part;
  if(PV.key!==key){
    PV.key=key;PV.doc=null;PV.crops=new Map();PV.lkey='';
    showLoad('Carico la parte «'+part.label+'»…');
    try{const doc=await getDoc(part);if(PV.key!==key)return;PV.doc=doc;showLoad('');}
    catch(e){if(PV.key===key){PV.key='';showLoad(e&&e.status?driveMsg(e):'Non riesco a scaricare il PDF di questa parte. Controlla la connessione: riprovo quando cambi parte o giri il telefono.');}return;}
  }
  pdfLayout(W,H);
}
function pdfLayout(W,H){
  const part=PV.part;if(!part)return;
  const items=[];let sb=0;
  for(const s of part.sys){if(s.off)continue;const n=sysBars(s);items.push({s,start:sb,n,cx0:Math.max(0,s.x0-0.012),cx1:Math.min(1,s.x1+0.012)});sb+=n;}
  if(!items.length){showLoad('Questa parte non ha righi da leggere.');PV.layout=null;return;}
  const mode2=['h','v','r'].includes(prefs.pdfMode)?prefs.pdfMode:'v';
  let k,len=0;
  if(mode2==='h'){
    k=Infinity;for(const it of items)k=Math.min(k,(H*0.96)/(it.s.cy1-it.s.cy0));k*=prefs.size;
    for(const it of items){it.w=(it.cx1-it.cx0)*k;it.h=(it.s.cy1-it.s.cy0)*k;it.x=len;it.y=H/2-(((it.s.sy0+it.s.sy1)/2)-it.s.cy0)*k;len+=it.w;}
  }else{
    let mw=0,ah=0;for(const it of items){mw=Math.max(mw,it.cx1-it.cx0);ah+=it.s.cy1-it.s.cy0;}ah/=items.length;
    const rowsN=prefs.rows==='auto'?(W>H?3:0):(+prefs.rows||0);
    const kW=(W-16)/(mw||1),kH=rowsN?(H*0.97)/(rowsN*ah):Infinity;
    k=Math.min(kW,kH*prefs.size,kW*Math.min(1,prefs.size)*(rowsN?99:1));
    for(const it of items){it.w=(it.cx1-it.cx0)*k;it.h=(it.s.cy1-it.s.cy0)*k;it.x=(W-it.w)/2;it.y=len;len+=it.h;}
  }
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const lkey=mode2+':'+k.toFixed(3)+':'+dpr+':'+PV.key;
  if(lkey!==PV.lkey){for(const c of PV.crops.values())if(c.c){c.c.width=c.c.height=1;}PV.crops=new Map();PV.lkey=lkey;}
  // battute della parte riportate a quelle del brano
  PV.layout={mode:mode2,k,items,len,W,H,dpr,scale:sb/song.bars};
  const c=$('pdfc');c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);
  PV.dirty=true;PV.lastOff=NaN;
}
function pdfPos(bar){
  const L=PV.layout;if(!L)return 0;
  bar=Math.max(0,bar)*L.scale;
  let it=L.items[L.items.length-1];
  for(const x of L.items){if(bar<x.start+x.n){it=x;break;}}
  const rel=Math.min(bar-it.start,it.n);
  if(L.mode!=='h')return it.y+(rel/it.n)*it.h;
  const i=Math.min(it.n-1,Math.floor(rel)),f=rel-i;const b=it.s.b;
  return it.x+(b[i]+f*(b[i+1]-b[i])-it.cx0)*L.k;
}
const anchorOf=L=>L.mode==='h'?L.W*prefs.head:L.H*Math.min(0.45,prefs.head);
function pdfFrame(bar,pan){
  const L=PV.layout;if(!L||!PV.doc)return;
  const anchor=anchorOf(L);
  const sb=Math.max(0,bar)*L.scale;
  let cur2=0;for(let i=0;i<L.items.length;i++)if(sb>=L.items[i].start)cur2=i;
  PV.cur=cur2;
  let off=pdfPos(bar)-anchor-pan;
  if(L.mode==='r'&&S&&S.playing){
    const target=L.items[cur2].y-8,tn=performance.now();
    if(!isFinite(PV.sm)||Math.abs(PV.sm-target)>L.H*3)PV.sm=target;
    else PV.sm+= (target-PV.sm)*Math.min(1,(tn-(PV.smT||tn))/110);
    PV.smT=tn;off=PV.sm;
  }else{PV.sm=off;PV.smT=performance.now();}
  if(!PV.dirty&&Math.abs(off-PV.lastOff)<0.25)return;
  PV.dirty=false;PV.lastOff=off;
  const c=$('pdfc'),x=c.getContext('2d'),dpr=L.dpr;
  x.setTransform(dpr,0,0,dpr,0,0);x.filter='none';
  const cs=getComputedStyle(document.documentElement);
  x.fillStyle=prefs.inv?'#000':(cs.getPropertyValue('--paper').trim()||'#fff');x.fillRect(0,0,L.W,L.H);
  if(prefs.inv)x.filter='invert(1) hue-rotate(180deg)';
  const need=[];
  L.items.forEach((it,i)=>{
    const sx=L.mode==='h'?it.x-off:it.x,sy=L.mode==='h'?it.y:it.y-off;
    const vis=L.mode==='h'?(sx<L.W&&sx+it.w>0):(sy<L.H&&sy+it.h>0);
    if(vis||Math.abs(i-cur2)<=3)need.push(i);
    if(!vis)return;
    const cr=PV.crops.get(i);
    if(cr&&cr.state==='ok')x.drawImage(cr.c,sx,sy,it.w,it.h);
    else{x.fillStyle='#fff';x.fillRect(sx,sy,it.w,it.h);x.strokeStyle='#ccc';x.lineWidth=1;const top=sy+(it.s.sy0-it.s.cy0)*L.k,gap=(it.s.sy1-it.s.sy0)*L.k/4;for(let l=0;l<5;l++){x.beginPath();x.moveTo(sx+8,top+l*gap);x.lineTo(sx+it.w-8,top+l*gap);x.stroke();}}
  });
  x.filter='none';
  if(prefs.mark){
    x.fillStyle=cs.getPropertyValue('--accent').trim()||'#2a45cc';x.globalAlpha=.75;
    if(L.mode==='h')x.fillRect(anchor-1,0,2,L.H);
    else if(L.mode==='v')x.fillRect(0,anchor-1,L.W,2);
    else{const it=L.items[cur2],rel=Math.min(Math.max(0,sb-it.start),it.n),i=Math.min(it.n-1,Math.floor(rel)),f=rel-i,b=it.s.b;
      const hx=it.x+(b[i]+f*(b[i+1]-b[i])-it.cx0)*L.k,ty=it.y-off+(it.s.sy0-it.s.cy0)*L.k,hh=(it.s.sy1-it.s.sy0)*L.k;
      x.fillRect(hx-1.5,ty-hh*0.6,3,hh*2.2);}
    x.globalAlpha=1;}
  for(const i of need)if(!PV.crops.has(i))PV.crops.set(i,{state:'q'});
  pumpCrops();
}
async function pumpCrops(){
  if(PV.busy)return;PV.busy=true;
  try{
    for(;;){
      const L=PV.layout;if(!L||!PV.doc)break;
      const q=[...PV.crops].filter(([,c])=>c.state==='q');if(!q.length)break;
      q.sort((a,b)=>Math.abs(a[0]-PV.cur)-Math.abs(b[0]-PV.cur));
      const [i,c]=q[0];c.state='r';const it=L.items[i];const lk=PV.lkey,doc=PV.doc;
      if(!it){PV.crops.delete(i);continue;}
      try{const cv=await renderCrop(doc,it.s.p,it.cx0,it.s.cy0,it.cx1,it.s.cy1,Math.min(4096,it.w*L.dpr));if(PV.lkey!==lk){cv.width=cv.height=1;continue;}c.c=cv;c.state='ok';PV.dirty=true;}
      catch(e){c.state='err';}
      const ok=[...PV.crops].filter(([,c])=>c.state==='ok');
      if(ok.length>12){ok.sort((a,b)=>Math.abs(b[0]-PV.cur)-Math.abs(a[0]-PV.cur));for(const [j,cc] of ok.slice(0,ok.length-12)){if(Math.abs(j-PV.cur)>3){cc.c.width=cc.c.height=1;PV.crops.delete(j);}}}
    }
  }finally{PV.busy=false;}
}

/* ================= Animazione ================= */
let curIdx=-1,pastUntil=-1,panPx=0;
function findIdx(b){const w=G.w;let lo=0,hi=w.length-1,ans=-1;while(lo<=hi){const m=(lo+hi)>>1;if(w[m].b<=b+1e-6){ans=m;lo=m+1;}else hi=m-1;}return ans;}
function frame(){
  requestAnimationFrame(frame);
  if(!song||mode==='home'||!S)return;
  const isPdf=song.kind==='pdf';
  if(!isPdf&&!G)return;
  const t=viewNow();
  let b=posAt(t);
  if(S.playing&&b>=song.total+0.25){
    if(mode==='host'){S.playing=false;S.fromBeat=0;$('barIn').value=1;publish();onStateChange();toast('Fine del brano.');}
    b=song.total;
  }
  const shown=S.playing?Math.max(b,S.fromBeat):b;
  countOverlay(t,b);
  $('prog').style.width=(clamp(b/song.total,0,1)*100).toFixed(2)+'%';
  if(isPdf){pdfFrame(shown/song.mQ,S.playing?0:panPx);return;}
  $('score').style.transform=`translate3d(${(G.headX-G.xOf(shown)+(S.playing?0:panPx)).toFixed(1)}px,0,0)`;
  const idx=(S.playing&&b>=S.fromBeat)?findIdx(b):-1;
  let on=idx;if(on>=0){const n=G.w[on];if(b>n.b+n.d)on=-1;}
  if(on!==curIdx){if(curIdx>=0&&noteEls[curIdx])noteEls[curIdx].classList.remove('on');if(on>=0&&noteEls[on])noteEls[on].classList.add('on');curIdx=on;}
  const past=S.playing?idx-1:-1;
  if(past!==pastUntil){
    if(past<pastUntil){for(let i=Math.max(0,past+1);i<=pastUntil;i++)noteEls[i]&&noteEls[i].classList.remove('past');}
    else{for(let i=Math.max(0,pastUntil+1);i<=past;i++)noteEls[i]&&noteEls[i].classList.add('past');}
    pastUntil=past;
  }
}
requestAnimationFrame(frame);
setTimeout(()=>{if(!schedTimer)schedTimer=setInterval(sched,25);},0);
function countOverlay(t,b){
  const ci=$('countin');
  if(S.playing&&b<S.fromBeat){
    const into=(t-S.startAt)/mspq();
    ci.hidden=false;ci.textContent=into<0?'•':String(Math.min(S.count,Math.floor(into/beatQ()+1e-6)+1));
  }else ci.hidden=true;
}
(function(){
  const vp=$('vp');let sx=null,sy=0,sp=0;
  vp.addEventListener('pointerdown',e=>{unlockAudio();if(S&&song&&!S.playing){sx=e.clientX;sy=e.clientY;sp=panPx;try{vp.setPointerCapture(e.pointerId);}catch(_){}}});
  vp.addEventListener('pointermove',e=>{
    if(sx===null||!song||!S)return;
    if(song.kind==='pdf'){
      const L=PV.layout;if(!L)return;
      const d=L.mode==='h'?e.clientX-sx:e.clientY-sy;
      const base=pdfPos(S.fromBeat/song.mQ);
      panPx=clamp(sp+d,base-anchorOf(L)-L.len+40,base);PV.dirty=true;
    }else if(G){
      panPx=clamp(sp+(e.clientX-sx),-(G.xOf(song.total)-G.xOf(S.fromBeat)),G.headX);
    }
  });
  const end=()=>{sx=null;};vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
  vp.addEventListener('dblclick',()=>{panPx=0;PV.dirty=true;});
})();

/* ================= Audio ================= */
let ctx=null,audioUnlocked=false,schedTimer=null,nextClick=0,schedBase=null,gi=-1,silentEl=null;
const SILENT='data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
function unlockAudio(){
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(e){}
  // iOS: un elemento audio in riproduzione fa ignorare il tasto silenzioso anche al metronomo
  try{if(!silentEl){silentEl=new Audio(SILENT);silentEl.loop=true;silentEl.setAttribute('playsinline','');silentEl.volume=0.01;}
    if(silentEl.paused){const p=silentEl.play();if(p&&p.catch)p.catch(()=>{});}}catch(e){}
  try{if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ctx=new A();}
    if(ctx.state!=='running'){const p=ctx.resume();if(p&&p.catch)p.catch(()=>{});}
    const b=ctx.createBuffer(1,1,22050),src=ctx.createBufferSource();src.buffer=b;src.connect(ctx.destination);src.start(0);
  }catch(e){}
  audioUnlocked=!!ctx&&ctx.state==='running';
  if(!schedTimer)schedTimer=setInterval(sched,25);
}
['touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,unlockAudio,{passive:true}));
document.addEventListener('pointerdown',()=>{if(!ctx)unlockAudio();},{passive:true});
function resetSched(){nextClick=0;gi=-1;schedBase=S?S.rev+':'+S.startAt+':'+S.playing:null;}
function stopAudio(){resetSched();}
function aTime(epoch){return ctx.currentTime+(epoch-viewNow())/1000;}
function click(at,accent){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.frequency.value=accent?1760:1180;o.type='sine';
  const v=prefs.vol*(accent?0.6:0.38);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(v,at+0.002);g.gain.exponentialRampToValueAtTime(0.0001,at+0.06);
  o.connect(g).connect(ctx.destination);o.start(at);o.stop(at+0.08);
}
function tone(at,dur,midi){
  const f=440*Math.pow(2,(midi-69)/12);
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();
  o.type='triangle';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2;lp.type='lowpass';lp.frequency.value=2400;
  const v=prefs.vol*0.32,end=at+Math.max(0.06,dur*0.92);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(v,at+0.015);g.gain.setTargetAtTime(v*0.6,at+0.05,0.15);g.gain.setTargetAtTime(0,end-0.03,0.02);
  o.connect(lp);o2.connect(lp);lp.connect(g).connect(ctx.destination);
  o.start(at);o2.start(at);o.stop(end+0.15);o2.stop(end+0.15);
}
let audioWarnT=0;
function sched(){
  if(S&&S.playing&&mode!=='home'&&(prefs.met||prefs.guide)&&(!ctx||ctx.state!=='running')){
    if(Date.now()-audioWarnT>8000){audioWarnT=Date.now();toast('Tocca lo schermo per attivare il metronomo.');}
    return;
  }
  if(!ctx||ctx.state!=='running'||!S||!song||!S.playing||mode==='home')return;
  const key=S.rev+':'+S.startAt+':'+S.playing;if(key!==schedBase)resetSched();
  const t=viewNow(),ahead=t+150,q=mspq(),cQ=countQ(),unit=beatQ();
  const musicStart=S.startAt+cQ*q;
  const endT=musicStart+(song.total-S.fromBeat)*q;
  if(!nextClick){nextClick=S.startAt;while(nextClick<t-30)nextClick+=unit*q;}
  while(nextClick<ahead&&nextClick<endT-1){
    if(prefs.met&&nextClick>=t-30){
      const k=Math.round((nextClick-S.startAt)/(unit*q));
      const inCount=(nextClick-S.startAt)/q<cQ-1e-6;
      let accent;
      if(inCount){const r=((k-S.count)%barBeats(song.ts,unit)+barBeats(song.ts,unit))%barBeats(song.ts,unit);accent=k===0||r===0;}
      else{const beatPos=S.fromBeat+(nextClick-S.startAt)/q-cQ;const rel=((beatPos%song.mQ)+song.mQ)%song.mQ;accent=rel<1e-3||song.mQ-rel<1e-3;}
      click(aTime(nextClick),accent);
    }
    nextClick+=unit*q;
  }
  if(prefs.guide&&song.notes.length){
    const w=song.notes;
    if(gi<0){gi=0;const b0=Math.max(S.fromBeat,posAt(t));while(gi<w.length&&w[gi].b<b0-1e-6)gi++;}
    while(gi<w.length){
      const n=w[gi];const nt=musicStart+(n.b-S.fromBeat)*q;
      if(nt>ahead)break;
      if(!n.r&&nt>=t-30)tone(aTime(nt),n.d*q/1000,n.midi);
      gi++;
    }
  }
}

/* ================= Schermo acceso ================= */
let wake=null;
async function reqWake(){try{if(!wake&&navigator.wakeLock){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;});}}catch(e){}}
function releaseWake(){try{if(wake)wake.release();}catch(e){}wake=null;}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  if(S&&S.playing)reqWake();
  try{if(ctx&&ctx.state!=='running')ctx.resume().catch(()=>{});}catch(e){}
  if(mode==='guest'){clockSync(6);if(!hostConn||!hostConn.open){clearTimeout(retryT);retryT=setTimeout(guestConnect,300);}}
  if(peer&&peer.disconnected&&!peer.destroyed){try{peer.reconnect();}catch(e){}}
});

let toastT=null;
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},4200);}
window.__leggio={get state(){return S;},get mode(){return mode;},get clockOff(){return clockOff;},posAt:()=>posAt(viewNow())};
})();
