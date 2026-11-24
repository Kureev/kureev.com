(async()=>{
/* "The bench": an SO-101 on a cutting mat moving an LED between two breadboard sockets.
   The arm follows the cursor across the mat; it stays assembled while you scroll.
   Easter eggs: press R twice (Fast Refresh), click the lit LED (Blink). */
if(!window.THREE||!window.SO101)return;
const T=THREE,cv=document.getElementById('gl'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gl;try{gl=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true})}catch(e){return}
const DPR=Math.min(devicePixelRatio,2);gl.setPixelRatio(DPR);gl.outputEncoding=T.sRGBEncoding;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;
const scene=new T.Scene(),cam=new T.PerspectiveCamera(32,1,0.1,200),V=(x,y,z)=>new T.Vector3(x,y,z);

scene.add(new T.HemisphereLight(0x8fa6ff,0x050817,.5));
const key=new T.DirectionalLight(0xffffff,.85);key.position.set(-3,6,6);scene.add(key);
const rimA=new T.DirectionalLight(0x5b9cff,2.2);rimA.position.set(4,3,-5);scene.add(rimA);
const rimB=new T.DirectionalLight(0x9a7bff,1.4);rimB.position.set(-5,2,-4);scene.add(rimB);
const group=new T.Group();scene.add(group);

/* cutting mat: canvas grid, radial alpha fade so it has no edges */
const MW=9,MD=5.4,MC=V(1.6,0,.3);
{const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*MD/MW);const x=c.getContext('2d');x.fillStyle='#101a44';x.fillRect(0,0,c.width,c.height);
 const u=c.width/MW;for(let i=0;i<=MW*2;i++){x.strokeStyle=i%10?'rgba(91,156,255,.07)':'rgba(91,156,255,.14)';x.lineWidth=1.5;x.beginPath();x.moveTo(i*u/2,0);x.lineTo(i*u/2,c.height);x.stroke()}
 for(let j=0;j<=MD*2;j++){x.strokeStyle=j%10?'rgba(91,156,255,.07)':'rgba(91,156,255,.14)';x.beginPath();x.moveTo(0,j*u/2);x.lineTo(c.width,j*u/2);x.stroke()}
 const a=document.createElement('canvas');a.width=a.height=256;const y=a.getContext('2d'),g=y.createRadialGradient(128,128,10,128,128,128);g.addColorStop(0,'#fff');g.addColorStop(.7,'#eee');g.addColorStop(1,'#000');y.fillStyle=g;y.fillRect(0,0,256,256);
 const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
 const mat=new T.Mesh(new T.PlaneGeometry(MW,MD),new T.MeshStandardMaterial({map:tex,alphaMap:new T.CanvasTexture(a),transparent:true,depthWrite:false,roughness:.9}));mat.rotation.x=-Math.PI/2;mat.position.copy(MC);group.add(mat)}
/* soft contact shadows */
const shadowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c)})();
const shadow=(w,d,x,z)=>{const m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.004,z);group.add(m);return m};
shadow(2.4,2.0,.2,0);shadow(1.3,1.1,.2,0).material.opacity=.9;

/* breadboard with two sockets */
const BB=V(2.55,0,.75),SOCK=[V(2.05,.12,.75),V(3.05,.12,.75)];
{const c=document.createElement('canvas');c.width=512;c.height=320;const x=c.getContext('2d');x.fillStyle='#cfd5ea';x.fillRect(0,0,512,320);
 x.fillStyle='#9aa3c4';for(let i=0;i<30;i++)for(let j=0;j<10;j++){if(j===4||j===5)continue;x.fillRect(14+i*16.5,40+j*24+(j>5?12:0),6,6)}
 x.fillStyle='rgba(91,156,255,.5)';x.fillRect(10,14,492,3);x.fillStyle='rgba(255,120,90,.5)';x.fillRect(10,303,492,3);
 const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;
 const b=new T.Mesh(new T.BoxGeometry(1.6,.12,1.0),[new T.MeshStandardMaterial({color:0xcfd5ea,roughness:.7}),new T.MeshStandardMaterial({color:0xcfd5ea,roughness:.7}),new T.MeshStandardMaterial({map:t,roughness:.7}),new T.MeshStandardMaterial({color:0xcfd5ea}),new T.MeshStandardMaterial({color:0xcfd5ea,roughness:.7}),new T.MeshStandardMaterial({color:0xcfd5ea,roughness:.7})]);
 b.position.set(BB.x,.06,BB.z);group.add(b);shadow(2.2,1.6,BB.x,BB.z);
 SOCK.forEach(p=>{const r=new T.Mesh(new T.RingGeometry(.09,.12,24),new T.MeshBasicMaterial({color:0x5b9cff,transparent:true,opacity:.5}));r.rotation.x=-Math.PI/2;r.position.set(p.x,.122,p.z);group.add(r)})}
/* the LED: dome + body + legs, glows copper when seated */
const led=new T.Group(),ledMat=new T.MeshStandardMaterial({color:0xff9a6b,roughness:.2,transparent:true,opacity:.85,emissive:0xffb26b,emissiveIntensity:0});
{const dome=new T.Mesh(new T.SphereGeometry(.12,20,12,0,Math.PI*2,0,Math.PI/2),ledMat);dome.position.y=.3;led.add(dome);
 const body=new T.Mesh(new T.CylinderGeometry(.12,.12,.2,20),ledMat);body.position.y=.2;led.add(body);
 const rim=new T.Mesh(new T.CylinderGeometry(.14,.14,.03,20),ledMat);rim.position.y=.105;led.add(rim);
 const legM=new T.MeshStandardMaterial({color:0xc8cfd8,metalness:.8,roughness:.3});[-.05,.05].forEach((x,i)=>{const l=new T.Mesh(new T.CylinderGeometry(.012,.012,i?.26:.22,6),legM);l.position.set(x,i?-.04:-.02,0);led.add(l)})}
led.scale.setScalar(1.15);group.add(led);
const ledLight=new T.PointLight(0xffb26b,0,2.4,1.6);group.add(ledLight);
const ledShadow=shadow(.5,.5,0,0);

/* the arm */
const printed=new T.MeshStandardMaterial({color:0xc3cbee,roughness:.58,metalness:0}),servo=new T.MeshStandardMaterial({color:0x12182f,roughness:.38,metalness:.25});
let arm;try{arm=await SO101.load('/so101/',{printed,servo})}catch(e){return}
const holder=new T.Object3D();holder.rotation.x=-Math.PI/2;holder.scale.setScalar(10);holder.add(arm.root);group.add(holder);
['shoulder_pan','shoulder_lift','elbow_flex','wrist_flex','wrist_roll','gripper'].forEach(n=>arm.set(n,0));holder.updateMatrixWorld(true);
const wj=arm.joint.wrist_flex.parent,_a=V(0,0,0),_b=V(0,0,0);wj.getWorldPosition(_a);arm.tip.getWorldPosition(_b);const LG=_a.distanceTo(_b);
[['shoulder_pan',-.3],['shoulder_lift',-.4],['elbow_flex',.6],['wrist_flex',.9],['gripper',.5]].forEach(([n,v])=>arm.set(n,v));
holder.updateMatrixWorld(true);
arm.parts.forEach(m=>{m.userData.q0=m.quaternion.clone()});

/* IK: pan/lift/elbow bring the wrist above the target, the wrist keeps the gripper pointing down */
const chain=['elbow_flex','shoulder_lift','shoulder_pan'],LIM={shoulder_lift:[-1.1,1.1],elbow_flex:[-.2,1.7],shoulder_pan:[-1.4,1.4]};
const P=V(0,0,0),A=V(0,0,0),E=V(0,0,0),G=V(0,0,0),W=V(0,0,0),tq=new T.Quaternion();
function ik(tgtLocal,gain){W.copy(tgtLocal);group.localToWorld(W);W.y+=LG*group.scale.y;
  for(let it=0;it<3;it++)for(const n of chain){const r=arm.joint[n];r.updateMatrixWorld(true);r.getWorldPosition(P);A.copy(r.userData.axis).applyQuaternion(r.getWorldQuaternion(tq)).normalize();wj.getWorldPosition(E);
    E.sub(P);G.copy(W).sub(P);E.addScaledVector(A,-E.dot(A));G.addScaledVector(A,-G.dot(A));if(E.lengthSq()<1e-8||G.lengthSq()<1e-8)continue;
    const ang=Math.atan2(A.dot(E.clone().cross(G)),E.dot(G)),[lo,hi]=LIM[n];arm.set(n,Math.min(hi,Math.max(lo,r.userData.q+ang*gain)))}
  const want=Math.PI/2-arm.joint.shoulder_lift.userData.q-arm.joint.elbow_flex.userData.q;arm.set('wrist_flex',arm.joint.wrist_flex.userData.q+(want-arm.joint.wrist_flex.userData.q)*.3)}
const tipLocal=()=>{arm.tip.getWorldPosition(E);return group.worldToLocal(E.clone())};

/* knolling layout: every part's place on the mat when the kit is laid out */
const ctr=V(1.3,2.2,0),rnd=(()=>{let s=3;return()=>((s=s*16807%2147483647)-1)/2147483646})();
arm.parts.forEach((m,i)=>{const col=i%7,row=Math.floor(i/7);m.userData.knoll=V(-1.2+col*.85,.22,-1.5+row*.95);
  m.getWorldPosition(_a);group.worldToLocal(_a);const d=_a.clone().sub(ctr);d.normalize().multiplyScalar(.8+rnd()*.6);d.y=Math.abs(d.y)+.3;m.userData.ex=d;
  let depth=0,o=m.parent;while(o&&o!==arm.root){if(o.userData.axis)depth++;o=o.parent}m.userData.depth=depth});
let assembleAt=0;const tParts=m=>.3+m.userData.depth*.22+(m.id%5)*.05;

/* pointer: a ring on the mat */
const ring=new T.Mesh(new T.RingGeometry(.16,.19,40),new T.MeshBasicMaterial({color:0x5b9cff,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;group.add(ring);
const ray=new T.Raycaster(),ptr=new T.Vector2(),plane=new T.Plane(),hit=V(0,0,0);let active=false,last=0,mx=0,my=0,clickAt=-1;
addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();if(e.clientY>r.bottom||e.clientY<r.top)return;ptr.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);mx=ptr.x;my=ptr.y;active=true;last=performance.now()},{passive:true});
cv.parentElement.addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;clickAt=performance.now();last=clickAt;active=true});

/* caption + eggs */
const hero=cv.parentElement,cap=document.createElement('div');cap.className='tel';hero.appendChild(cap);
let capMsg='',capUntil=0,blinkUntil=0,egg='';
const say=(html,ms)=>{capMsg=html;capUntil=performance.now()+ms;cap.innerHTML=html};
let rCount=0,rT=0;addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea'))return;if(e.key==='r'||e.key==='R'){const n=performance.now();rCount=n-rT<600?rCount+1:1;rT=n;if(rCount>=2){rCount=0;assembleAt=clk+0.001;fast=true;say('Fast Refresh ✓ 0.6s',5000)}}});
let fast=false;

/* state */
const st={mode:'idle',phase:0,from:0,carry:false,seat:1,ledPos:SOCK[0].clone(),drop:null,timer:0};
led.position.copy(SOCK[0]);
const tgt=V(1.8,.9,.4),want=V(0,0,0);let grip=.5,clk=window.__tt||0;

let half=1,vw=1,vh=1;
function size(){vw=cv.clientWidth;vh=cv.clientHeight;if(!vw||!vh)return;gl.setSize(vw,vh,false);cam.aspect=vw/vh;
  const tx=Math.min(vw*.66,vw/2+440);cam.setViewOffset(vw,vh,-(tx-vw/2),-vh*.02,vw,vh);cam.updateProjectionMatrix()}
new ResizeObserver(size).observe(cv);size();group.rotation.y=-.55;

const clock=new T.Clock();let vis=1,pitch=22,qd=new T.Quaternion(),pd=V(0,0,0),pw=V(0,0,0),pinv=new T.Matrix4(),mw=new T.Matrix4(),sc=V(1,1,1),qw=new T.Quaternion(),qBase=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);clk+=dt;const now=performance.now();
  const sy=Math.max(0,scrollY),fade=Math.max(0,1-sy/(innerHeight*.9));if(Math.abs(fade-vis)>.001){vis=fade;cv.style.opacity=fade;cap.style.opacity=fade}
  if(fade<=0)return;
  const kk=0;
  /* camera: 22° down, easing toward 65° as the kit is laid out */
  pitch=22+43*kk;const pr=pitch*Math.PI/180,d=12.3,aim=V(1.55,1.35-1.0*kk,.35);
  cam.position.set(aim.x,aim.y+Math.sin(pr)*d,aim.z+Math.cos(pr)*d);cam.lookAt(aim);
  const live=active&&now-last<4000&&!reduce;
  group.rotation.y+=((-.55+(live?mx*.08:Math.sin(clk*.13)*.06))-group.rotation.y)*Math.min(1,dt*2);group.updateMatrixWorld();
  /* cursor on the mat */
  let onMat=false;if(live){ray.setFromCamera(ptr,cam);group.getWorldPosition(P);plane.setFromNormalAndCoplanarPoint(V(0,1,0),P);
    if(ray.ray.intersectPlane(plane,hit)){group.worldToLocal(hit);let a=Math.atan2(hit.z,hit.x),r=Math.hypot(hit.x,hit.z);a=Math.max(-1.25,Math.min(1.25,a));r=Math.max(1.3,Math.min(3.2,r));hit.set(Math.cos(a)*r,0,Math.sin(a)*r);onMat=true;ring.position.lerp(V(hit.x,(Math.abs(hit.x-BB.x)<.8&&Math.abs(hit.z-BB.z)<.5)?.125:.012,hit.z),Math.min(1,dt*10))}}
  ring.material.opacity+=((onMat?.8:0)-ring.material.opacity)*Math.min(1,dt*6);
  /* click on the lit LED: it blinks (egg) */
  if(clickAt>0&&now-clickAt<50){ray.setFromCamera(ptr,cam);
    if(st.seat&&!st.carry&&ray.intersectObject(led,true).length){clickAt=-1;blinkUntil=now+5000;say('digitalWrite(13, HIGH) · <a href="/electronics">learn why →</a>',5000)}}

  if(clickAt>0&&now-clickAt>60)clickAt=-1;
  /* behaviour */
  let gq=.9,dip=false;
  if(live){want.set(ring.position.x,.85,ring.position.z);gq=.9}
  else{/* idle: the arm hovers over the breadboard and looks around, gripper breathing */
    const u=clk*.35;want.set(BB.x-.35+Math.sin(u)*.75,1.05+Math.sin(u*1.7)*.2,BB.z+Math.sin(u*.8+1)*.55);gq=.55+.35*Math.sin(clk*.9)}
  if(fast)fast=false;
  tgt.lerp(want,1-Math.pow(dip?.0005:.02,dt));
  if(!reduce)ik(tgt,.35);
  arm.set('wrist_roll',reduce?0:.25*Math.sin(clk*.23));
  grip+=(gq-grip)*Math.min(1,dt*8);arm.set('gripper',grip);
  /* the LED follows the gripper when carried */
  if(st.carry){const p=tipLocal();led.position.set(p.x,p.y-.22,p.z)}else led.position.lerp(st.ledPos,1-Math.pow(.001,dt));
  ledShadow.position.set(led.position.x,.005,led.position.z);
  const on=st.seat&&!st.carry?(now<blinkUntil?(Math.floor(now/500)%2):1):0;
  ledMat.emissiveIntensity+=((on?1.6:0)-ledMat.emissiveIntensity)*Math.min(1,dt*(on?6:10));ledLight.intensity=ledMat.emissiveIntensity*.9;ledLight.position.set(led.position.x,.5,led.position.z);
  /* assemble on load (and on R R), lay out flat on scroll */
  const tA=clk-assembleAt,spd=assembleAt?2.2:1;
  arm.parts.forEach(m=>{const u=reduce?1:Math.min(1,Math.max(0,(tA*spd-tParts(m))/1.0)),e=u*u*(3-2*u),k=1-e;
    m.position.copy(m.userData.home).addScaledVector(m.userData.exL||(m.userData.exL=(()=>{m.parent.updateMatrixWorld(true);pinv.copy(m.parent.matrixWorld).invert();const a=V(0,0,0).applyMatrix4(group.matrixWorld).applyMatrix4(pinv),b=m.userData.ex.clone().applyMatrix4(group.matrixWorld).applyMatrix4(pinv);return b.sub(a)})()),k);
    m.quaternion.copy(m.userData.q0);
    if(kk>0){/* knolling: lerp the part's world transform toward its slot on the mat */
      m.parent.updateMatrixWorld(true);m.updateMatrixWorld(true);m.matrixWorld.decompose(pw,qw,sc);
      const g=m.geometry.boundingSphere.center.clone().multiply(sc);
      pd.copy(m.userData.knoll);group.localToWorld(pd);qd.copy(group.quaternion).multiply(qBase);pd.sub(g.applyQuaternion(qd));
      pw.lerp(pd,kk);qw.slerp(qd,kk);mw.compose(pw,qw,sc);pinv.copy(m.parent.matrixWorld).invert();mw.premultiply(pinv);mw.decompose(m.position,m.quaternion,_b)}});
  /* caption */
  if(now>capUntil){const msg=clk<5?'move the cursor, the arm follows':`Pan ${Math.round(arm.joint.shoulder_pan.userData.q*57.3)}° · Lift ${Math.round(arm.joint.shoulder_lift.userData.q*57.3)}° · Elbow ${Math.round(arm.joint.elbow_flex.userData.q*57.3)}° · Gripper ${Math.round(grip*100)}%`;if(msg!==capMsg){capMsg=msg;cap.textContent=msg}}
  _a.copy(MC).setZ(MC.z+MD*.38);group.localToWorld(_a);_a.project(cam);cap.style.transform=`translate(${(_a.x*.5+.5)*vw}px,${Math.min((-_a.y*.5+.5)*vh,vh-44)}px) translateX(-50%)`;
  if(!cap.classList.contains('on')&&clk>1.2)cap.classList.add('on');
  gl.render(scene,cam)}
frame();
setTimeout(()=>hero.classList.add('ready'),2600);
})();
