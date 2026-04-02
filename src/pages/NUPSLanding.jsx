import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Full HTML source — embedded as srcDoc to avoid cross-origin iframe blocking
const NUPS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NUPS</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:#010009;}
#c{position:fixed;inset:0;z-index:1;display:block;}
#brand{position:fixed;bottom:0;left:0;right:0;z-index:10;text-align:center;pointer-events:none;padding:24px 16px max(20px,2.8vh);background:linear-gradient(to top,rgba(1,0,9,.94) 0%,rgba(1,0,9,.6) 55%,transparent 100%);}
.sep{width:50px;height:1px;margin:0 auto 9px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.8),transparent);}
.hero{font-family:'Orbitron',monospace;font-size:clamp(30px,5.5vw,60px);font-weight:900;letter-spacing:.34em;line-height:1;white-space:nowrap;background:linear-gradient(135deg,#fff 0%,#b8e0ff 14%,#00d4ff 30%,#0077ff 50%,#00aaff 70%,#fff 88%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:hg 3.5s ease-in-out infinite alternate;}
@keyframes hg{from{filter:drop-shadow(0 0 8px rgba(0,160,255,.5));}to{filter:drop-shadow(0 0 22px rgba(0,212,255,1)) drop-shadow(0 0 50px rgba(0,100,255,.65));}}
.sub{font-family:'Rajdhani';font-size:clamp(8px,1vw,11px);font-weight:700;letter-spacing:.42em;color:rgba(0,212,255,.58);margin-top:4px;text-transform:uppercase;}
.tag{font-family:'Rajdhani';font-size:clamp(6px,.82vw,9px);font-weight:400;letter-spacing:.28em;color:rgba(100,180,255,.28);margin-top:2px;text-transform:uppercase;}
.cta{display:inline-block;margin-top:11px;pointer-events:all;font-family:'Rajdhani';font-size:clamp(9px,.95vw,11px);font-weight:700;letter-spacing:.24em;text-transform:uppercase;padding:8px 24px;border-radius:26px;border:1px solid rgba(0,170,255,.50);background:rgba(0,70,200,.18);color:rgba(140,215,255,.90);backdrop-filter:blur(10px);cursor:pointer;text-decoration:none;transition:all .35s;}
.cta:hover{background:rgba(0,120,255,.30);color:#fff;box-shadow:0 0 20px rgba(0,180,255,.42);}
#hint{position:fixed;top:13px;left:50%;transform:translateX(-50%);z-index:11;font-family:'Rajdhani';font-size:9px;letter-spacing:.24em;color:rgba(0,150,255,.20);text-transform:uppercase;pointer-events:none;white-space:nowrap;}
#snd{position:fixed;top:11px;right:15px;z-index:11;font-family:'Rajdhani';font-size:9px;letter-spacing:.2em;text-transform:uppercase;padding:5px 11px;border-radius:16px;cursor:pointer;background:rgba(0,60,180,.18);border:1px solid rgba(0,160,255,.28);color:rgba(0,200,255,.65);transition:all .3s;}
#snd:hover{background:rgba(0,130,255,.28);color:#fff;}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="brand">
  <div class="sep"></div>
  <div class="hero">NUPS</div>
  <div class="sub">Nexus Unified Portal System</div>
  <div class="tag">Venue Technology &nbsp;&middot;&nbsp; GlyphLock LLC</div>
  <a class="cta" href="#" id="enterBtn">Enter Platform</a>
</div>
<div id="hint">DRAG &nbsp;&middot;&nbsp; SCROLL</div>
<button id="snd">&#9835; SOUND</button>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
// Notify parent when CTA clicked
document.getElementById('enterBtn').addEventListener('click', function(e){
  e.preventDefault();
  window.parent.postMessage('NUPS_ENTER', '*');
});

const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x010009,1);
renderer.setSize(innerWidth,innerHeight);
renderer.sortObjects=true;
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,200);
camera.position.set(0,.3,7.5);
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
scene.add(new THREE.AmbientLight(0x112244,2.0));
[[0x0099ff,5,[4,7,6]],[0x0033cc,3.5,[-5,2,-4]],[0xffffff,2.2,[0,8,3]]].forEach(([c,i,p])=>{const l=new THREE.DirectionalLight(c,i);l.position.set(...p);scene.add(l);});
const PL1=new THREE.PointLight(0x0088ff,10,9); scene.add(PL1);
const PL2=new THREE.PointLight(0x00ccff,6,8);  scene.add(PL2);
const SPAL=[[0,212,255],[0,100,220],[0,229,255],[150,210,255],[255,255,255],[200,225,255]];
const sPosA=new Float32Array(300*3),sColA=new Float32Array(300*3),sColBase=new Float32Array(300*3);
for(let i=0;i<300;i++){sPosA[i*3]=(Math.random()-.5)*80;sPosA[i*3+1]=(Math.random()-.5)*80;sPosA[i*3+2]=(Math.random()-.5)*60;const c=SPAL[Math.floor(Math.random()*SPAL.length)];sColA[i*3]=sColBase[i*3]=c[0]/255;sColA[i*3+1]=sColBase[i*3+1]=c[1]/255;sColA[i*3+2]=sColBase[i*3+2]=c[2]/255;}
const sGeo=new THREE.BufferGeometry();sGeo.setAttribute('position',new THREE.BufferAttribute(sPosA,3));sGeo.setAttribute('color',new THREE.BufferAttribute(sColA,3));
scene.add(new THREE.Points(sGeo,new THREE.PointsMaterial({vertexColors:true,size:.08,sizeAttenuation:true,transparent:true,opacity:.9})));
(()=>{const cv=document.createElement('canvas');cv.width=cv.height=512;const ctx=cv.getContext('2d');ctx.fillStyle='#010009';ctx.fillRect(0,0,512,512);[[.5,.08,200,160,.50],[.05,.52,80,120,.25],[.92,.09,76,76,.18],[.5,1.0,104,72,.22]].forEach(([x,y,rx,ry,a])=>{const grd=ctx.createRadialGradient(x*512,y*512,0,x*512,y*512,Math.max(rx,ry)*2);grd.addColorStop(0,'rgba(0,44,185,'+a+')');grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,512,512);});const m=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),depthWrite:false}));m.position.z=-50;m.renderOrder=-1;scene.add(m);})();
const S=3.2,H=S/2,W=.16;
const cubeGroup=new THREE.Group();scene.add(cubeGroup);
function makeFaceTex(){const cv=document.createElement('canvas');cv.width=cv.height=512;const ctx=cv.getContext('2d');ctx.fillStyle='rgb(0,9,30)';ctx.fillRect(0,0,512,512);const bg=ctx.createLinearGradient(0,0,512,512);bg.addColorStop(0,'rgba(0,22,65,.97)');bg.addColorStop(1,'rgba(0,7,32,.97)');ctx.fillStyle=bg;ctx.fillRect(0,0,512,512);for(let x=24;x<512;x+=28)for(let y=24;y<512;y+=28){const g=ctx.createRadialGradient(x,y,0,x,y,3.5);g.addColorStop(0,'rgba(0,190,255,.28)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='rgba(0,170,255,.055)';ctx.lineWidth=1;for(let x=0;x<512;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}for(let y=0;y<512;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}const b=16,L=52;ctx.strokeStyle='rgba(0,200,255,.85)';ctx.lineWidth=2.8;[[b,b],[512-b,b],[b,512-b],[512-b,512-b]].forEach(([x,y])=>{const sx=x<256?1:-1,sy=y<256?1:-1;ctx.beginPath();ctx.moveTo(x,y+sy*L);ctx.lineTo(x,y);ctx.lineTo(x+sx*L,y);ctx.stroke();});ctx.strokeStyle='rgba(0,170,255,.18)';ctx.lineWidth=1;ctx.strokeRect(32,32,448,448);const sh=ctx.createLinearGradient(0,0,512,90);sh.addColorStop(0,'rgba(255,255,255,.11)');sh.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.fillRect(0,0,512,90);return new THREE.CanvasTexture(cv);}
function addFace(w,h,d,px,py,pz,ry){const mat=new THREE.MeshPhongMaterial({map:makeFaceTex(),color:0x003366,emissive:0x000820,transparent:true,opacity:.62,shininess:85,depthWrite:true,side:THREE.FrontSide});const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);if(ry)m.rotation.y=ry;m.renderOrder=2;cubeGroup.add(m);}
addFace(S,S,W,0,0,H+W/2,0);addFace(S,S,W,0,0,-H-W/2,Math.PI);addFace(W,S,S,H+W/2,0,0,0);addFace(W,S,S,-H-W/2,0,0,0);addFace(S+W*2,W,S+W*2,0,H+W/2,0,0);addFace(S+W*2,W,S+W*2,0,-H-W/2,0,0);
const eGeo=new THREE.EdgesGeometry(new THREE.BoxGeometry(S+W*2,S+W*2,S+W*2));
const eMat=new THREE.LineBasicMaterial({color:0x00d4ff,transparent:true,opacity:.90,blending:THREE.AdditiveBlending,depthWrite:false});
cubeGroup.add(new THREE.LineSegments(eGeo,eMat));
cubeGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(S+W*2+.07,S+W*2+.07,S+W*2+.07)),new THREE.LineBasicMaterial({color:0x0055ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false})));
const cdG=new THREE.SphereGeometry(.040,6,6);const cdM=new THREE.MeshBasicMaterial({color:0x00d4ff,blending:THREE.AdditiveBlending,depthWrite:false});const oo=H+W;
for(const x of[-oo,oo])for(const y of[-oo,oo])for(const z of[-oo,oo]){const m=new THREE.Mesh(cdG,cdM);m.position.set(x,y,z);cubeGroup.add(m);}
const DN=55,dPos=new Float32Array(DN*3),dV=[];
for(let i=0;i<DN;i++){dPos[i*3]=(Math.random()-.5)*(S-.5);dPos[i*3+1]=(Math.random()-.5)*(S-.5);dPos[i*3+2]=(Math.random()-.5)*(S-.5);dV.push({x:(Math.random()-.5)*.003,y:(Math.random()-.5)*.003,z:(Math.random()-.5)*.003});}
const dGeo=new THREE.BufferGeometry();dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
cubeGroup.add(new THREE.Points(dGeo,new THREE.PointsMaterial({color:0x44aaff,size:.038,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true})));
const logoGroup=new THREE.Group();scene.add(logoGroup);
function makeRing(radius,col,op,tiltX,tiltZ){const pts=Array.from({length:129},(_,i)=>{const a=(i/128)*Math.PI*2;return new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,0);});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));line.rotation.x=tiltX;line.rotation.z=tiltZ;line.renderOrder=8;logoGroup.add(line);return line;}
const ring1=makeRing(1.45,0x00d4ff,.65,0,0);const ring2=makeRing(1.45,0x0088ff,.40,Math.PI/3,Math.PI/8);const ring3=makeRing(1.45,0xffaa00,.28,-Math.PI/4,Math.PI/5);
const sparkN=80;const spkPos=new Float32Array(sparkN*3);const spkData=[];
for(let i=0;i<sparkN;i++){const phi=Math.acos(1-2*(i+.5)/sparkN);const theta=Math.PI*(1+Math.sqrt(5))*(i+.5);const r=1.1+Math.random()*.5;spkPos[i*3]=Math.sin(phi)*Math.cos(theta)*r;spkPos[i*3+1]=Math.cos(phi)*r;spkPos[i*3+2]=Math.sin(phi)*Math.sin(theta)*r;spkData.push({phi,theta,r,speed:.008+Math.random()*.016,phase:Math.random()*Math.PI*2});}
const spkGeo=new THREE.BufferGeometry();spkGeo.setAttribute('position',new THREE.BufferAttribute(spkPos,3));
const spkMesh=new THREE.Points(spkGeo,new THREE.PointsMaterial({color:0x00d4ff,size:.058,transparent:true,opacity:.80,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,sizeAttenuation:true}));spkMesh.renderOrder=8;logoGroup.add(spkMesh);
const logoImg=new Image();
logoImg.onload=()=>{const tex=new THREE.Texture(logoImg);tex.needsUpdate=true;const m1=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,depthTest:false,alphaTest:.01});const p1=new THREE.Mesh(new THREE.PlaneGeometry(3.1,3.1),m1);p1.position.z=-.35;p1.renderOrder=9;logoGroup.add(p1);const m2=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,depthTest:false,alphaTest:.02});const p2=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.8),m2);p2.position.z=-.12;p2.renderOrder=10;logoGroup.add(p2);const m3=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,depthTest:false,alphaTest:.04});const p3=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),m3);p3.position.z=0;p3.renderOrder=11;logoGroup.add(p3);const m4=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.10,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,depthTest:false,alphaTest:.01});const p4=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),m4);p4.position.z=.20;p4.renderOrder=12;logoGroup.add(p4);const scM=new THREE.MeshBasicMaterial({color:0x88eeff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,depthTest:false});const sc=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.025),scM);sc.position.z=.22;sc.renderOrder=13;logoGroup.add(sc);logoGroup.userData.scan=sc;logoGroup.userData.layers=[m1,m2,m3,m4];};
logoImg.src='https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/ef67c8dbe_GLLogo.png';
const RPOOL=Array.from({length:14},()=>{const mat=new THREE.MeshBasicMaterial({color:0x00d4ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});const mesh=new THREE.Mesh(new THREE.RingGeometry(.05,.14,64),mat);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=0;scene.add(mesh);return{mesh,mat,active:false,prog:0};});
let rT=0;
function spawnRing(col){const r=RPOOL.find(r=>!r.active);if(!r)return;r.active=true;r.prog=0;r.mat.color.setHex(col||0x00d4ff);r.mesh.scale.set(1,1,1);r.mat.opacity=0;}
function mkOL(rx,ry,col,op,tx){const pts=Array.from({length:129},(_,i)=>{const a=(i/128)*Math.PI*2;return new THREE.Vector3(Math.cos(a)*rx,Math.sin(a)*ry,0);});const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));if(tx)l.rotation.x=tx;scene.add(l);return l;}
const OL=[mkOL(3.8,3.8,0x00d4ff,.34,Math.PI/10),mkOL(4.4,1.1,0x0066ff,.18,Math.PI/4.2),mkOL(3.2,3.2,0x0044bb,.15,-Math.PI/8)];
const oDots=[{col:0x00d4ff,rx:3.8,ry:3.8,sp:.27,tx:Math.PI/10},{col:0x0077ff,rx:4.4,ry:1.1,sp:.19,tx:Math.PI/4.2}].map(d=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:d.col,blending:THREE.AdditiveBlending,depthWrite:false}));const pl=new THREE.PointLight(d.col,.65,1.4);scene.add(pl);scene.add(m);return{m,pl,...d};});
const PN=160,pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=[];
const pPal=[[0,175,255],[0,95,215],[0,215,255],[110,195,255]];
function rstP(i){const a=Math.random()*Math.PI*2,r=2.0+Math.random()*2.2;pPos[i*3]=Math.cos(a)*r;pPos[i*3+1]=(Math.random()-.5)*S*.9;pPos[i*3+2]=Math.sin(a)*r;pVel[i]={vx:(Math.random()-.5)*.004,vy:(Math.random()-.5)*.003,vz:(Math.random()-.5)*.004,lf:Math.random()};const c=pPal[Math.floor(Math.random()*pPal.length)];pCol[i*3]=c[0]/255;pCol[i*3+1]=c[1]/255;pCol[i*3+2]=c[2]/255;}
for(let i=0;i<PN;i++)rstP(i);
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
scene.add(new THREE.Points(pGeo,new THREE.PointsMaterial({vertexColors:true,size:.06,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true})));
const gnd=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({color:0x001f66,transparent:true,opacity:.06,depthWrite:false,blending:THREE.AdditiveBlending}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-(H+W+.1);scene.add(gnd);
let actx=null,aOn=false,beat=0;
document.getElementById('snd').addEventListener('click',()=>{if(!aOn){if(!actx){actx=new(window.AudioContext||window.webkitAudioContext)();const M=actx.createGain();M.gain.value=.25;M.connect(actx.destination);const cb=actx.createBuffer(2,actx.sampleRate*2,actx.sampleRate);for(let ch=0;ch<2;ch++){const d=cb.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);}const cv2=actx.createConvolver();cv2.buffer=cb;const cg=actx.createGain();cg.gain.value=.20;cv2.connect(cg);cg.connect(M);const sub=actx.createOscillator();sub.type='sine';sub.frequency.value=48;const sg=actx.createGain();sg.gain.value=.15;sub.connect(sg);sg.connect(M);sub.connect(cv2);sub.start();[110,165,220].forEach((f,i)=>{const o=actx.createOscillator();o.type='sine';o.frequency.value=f;const g=actx.createGain();g.gain.value=.011-i*.003;o.connect(g);g.connect(M);g.connect(cv2);o.start();});const mo=actx.createOscillator();mo.type='triangle';mo.frequency.value=110;const mg=actx.createGain();mg.gain.value=.001;mo.connect(mg);mg.connect(M);mo.start();let bc=0;function pulse(){bc++;const now=actx.currentTime;mg.gain.setValueAtTime(.08,now);mg.gain.exponentialRampToValueAtTime(.001,now+.5);sg.gain.setValueAtTime(.26,now);sg.gain.exponentialRampToValueAtTime(.15,now+.7);beat=1.0;spawnRing(0x00d4ff);if(bc%4===0)spawnRing(0x0066ff);setTimeout(pulse,bc%4===0?1500:1200);}pulse();}aOn=true;document.getElementById('snd').textContent='\u266a ON';document.getElementById('snd').style.color='rgba(0,229,255,.9)';if(actx.state==='suspended')actx.resume();}else{aOn=false;document.getElementById('snd').textContent='\u266d SOUND';document.getElementById('snd').style.color='';if(actx)actx.suspend();}});
let drag=false,px=0,py=0,vX=0,vY=.012,rotX=.10,rotY=0,camZ=7.5;
document.addEventListener('mousedown',e=>{drag=true;px=e.clientX;py=e.clientY;vX=vY=0;e.preventDefault();});
document.addEventListener('mouseup',()=>drag=false);
document.addEventListener('mousemove',e=>{if(!drag)return;vY=(e.clientX-px)*.009;vX=(e.clientY-py)*.006;px=e.clientX;py=e.clientY;});
document.addEventListener('touchstart',e=>{drag=true;px=e.touches[0].clientX;py=e.touches[0].clientY;vX=vY=0;},{passive:true});
document.addEventListener('touchend',()=>drag=false);
document.addEventListener('touchmove',e=>{if(!drag)return;vY=(e.touches[0].clientX-px)*.009;vX=(e.touches[0].clientY-py)*.006;px=e.touches[0].clientX;py=e.touches[0].clientY;},{passive:true});
document.addEventListener('wheel',e=>{camZ=Math.max(3.5,Math.min(12,camZ+e.deltaY*.004));});
document.addEventListener('click',()=>{beat=Math.min(beat+.5,1.2);spawnRing(0x00d4ff);spawnRing(0x0088ff);});
const camVec=new THREE.Vector3();let t=0,scanT=0,logoSpinY=0;
(function loop(){requestAnimationFrame(loop);t+=.016;beat=Math.max(0,beat-.042);camera.position.z+=(camZ-camera.position.z)*.08;if(!drag){vY*=.978;if(Math.abs(vY)<.005)vY=.012;vX*=.90;}rotY+=vY;rotX+=vX;rotX=Math.max(-.55,Math.min(.55,rotX));const fy=.18+Math.sin(t*.52)*.16+beat*.05;cubeGroup.rotation.set(rotX,rotY,0);cubeGroup.position.y=fy;logoGroup.position.set(0,fy,0);logoSpinY+=.007+beat*.004;logoGroup.rotation.y=logoSpinY;logoGroup.rotation.x=Math.sin(t*.38)*.30+Math.sin(t*.19)*.12;logoGroup.rotation.z=Math.sin(t*.27)*.10;const sc=1+Math.sin(t*.85)*.028+beat*.05;logoGroup.scale.setScalar(sc);const layers=logoGroup.userData.layers;if(layers){layers[0].opacity=.15+Math.sin(t*.5)*.06+beat*.08;layers[1].opacity=.30+Math.sin(t*.7)*.08+beat*.10;layers[3].opacity=.08+Math.sin(t*1.1)*.04+beat*.06;}ring1.rotation.y=t*.80;ring2.rotation.y=-t*.55;ring2.rotation.x=Math.PI/3+Math.sin(t*.22)*.3;ring3.rotation.y=t*.35;ring3.rotation.z=Math.sin(t*.18)*.4;[ring1,ring2,ring3].forEach((r,i)=>{const rs=1+Math.sin(t*.9+i*1.1)*.05+beat*.12;r.scale.setScalar(rs);r.material.opacity=[.65,.40,.28][i]*(1+beat*.3);});for(let i=0;i<sparkN;i++){const d=spkData[i];d.theta+=d.speed*(1+beat*.8);const r=d.r+Math.sin(t*1.2+d.phase)*.08;spkPos[i*3]=Math.sin(d.phi)*Math.cos(d.theta)*r;spkPos[i*3+1]=Math.cos(d.phi)*r;spkPos[i*3+2]=Math.sin(d.phi)*Math.sin(d.theta)*r;}spkGeo.attributes.position.needsUpdate=true;spkMesh.material.opacity=.75+Math.sin(t*1.5)*.15+beat*.20;const sc2=logoGroup.userData.scan;if(sc2){scanT+=.011;sc2.position.y=Math.sin(scanT)*1.30;sc2.material.opacity=.42*(1-Math.abs(Math.sin(scanT))*.4);sc2.rotation.x=-logoGroup.rotation.x;sc2.rotation.z=-logoGroup.rotation.z;}rT++;if(rT%80===0)spawnRing(0x00d4ff);if(rT%125===65)spawnRing(0x0055ff);RPOOL.forEach(r=>{if(!r.active)return;r.prog+=.008;r.mesh.scale.set(1+r.prog*7.5,1,1+r.prog*7.5);r.mesh.position.y=fy-(H+W*.5+.06);r.mat.opacity=r.prog<.05?r.prog*18:Math.max(0,(1-r.prog)*.76)*.52;if(r.prog>=1){r.active=false;r.mat.opacity=0;}});PL1.position.set(Math.sin(t*.7)*.8,fy+.6,.8);PL1.intensity=8+Math.sin(t*1.8)*3+beat*6;PL2.position.set(Math.cos(t*.55)*.9,fy+.5,.9);PL2.intensity=5+Math.sin(t*1.4)*2+beat*4;eMat.opacity=.58+Math.sin(t*1.7)*.24+beat*.14;OL[0].rotation.y=t*.24;OL[1].rotation.y=-t*.18;OL[2].rotation.y=t*.30;oDots.forEach((d,i)=>{const a=t*d.sp+i*2.1;const pos=new THREE.Vector3(Math.cos(a)*d.rx,Math.sin(a)*d.ry*Math.cos(d.tx),Math.sin(a)*d.ry*Math.sin(d.tx));d.m.position.copy(pos);d.pl.position.copy(pos);d.pl.intensity=.55+Math.sin(t*1.8+i)*.25+beat*.4;});for(let i=0;i<300;i++){const tw=.2+.8*Math.abs(Math.sin(i*1.7+t*(0.3+i*.01)));sColA[i*3]=sColBase[i*3]*tw;sColA[i*3+1]=sColBase[i*3+1]*tw;sColA[i*3+2]=sColBase[i*3+2]*tw;}sGeo.attributes.color.needsUpdate=true;for(let i=0;i<DN;i++){const v=dV[i],lim=H-.2;dPos[i*3]+=v.x;dPos[i*3+1]+=v.y;dPos[i*3+2]+=v.z;if(Math.abs(dPos[i*3])>lim)v.x*=-1;if(Math.abs(dPos[i*3+1])>lim)v.y*=-1;if(Math.abs(dPos[i*3+2])>lim)v.z*=-1;}dGeo.attributes.position.needsUpdate=true;for(let i=0;i<PN;i++){const v=pVel[i];v.lf+=.007;pPos[i*3]+=v.vx;pPos[i*3+1]+=v.vy;pPos[i*3+2]+=v.vz;if(v.lf>1)rstP(i);}pGeo.attributes.position.needsUpdate=true;gnd.material.opacity=.05+Math.sin(t*.75)*.018+beat*.025;renderer.render(scene,camera);})();
</script>
</body>
</html>`;

export default function NUPSLanding() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  useEffect(() => {
    // Listen for the "Enter Platform" postMessage from the iframe
    const handleMessage = (event) => {
      if (event.data === 'NUPS_ENTER') {
        navigate("/NUPSGateway");
      }
    };
    window.addEventListener("message", handleMessage);

    // Also handle Enter key
    const handleKey = (e) => { if (e.key === "Enter") navigate("/NUPSGateway"); };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleKey);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      <iframe
        ref={iframeRef}
        srcDoc={NUPS_HTML}
        className="absolute inset-0 w-full h-full border-0"
        title="NUPS Visual"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}