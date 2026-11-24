(async()=>{
if(!window.THREE||!window.SO101)return;
const T=THREE,cv=document.getElementById('gl'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let gl;try{gl=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true})}catch(e){return}
const DPR=Math.min(devicePixelRatio,2);gl.setPixelRatio(DPR);gl.outputEncoding=T.sRGBEncoding;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;
const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,0.1,100);

/* studio light: soft key, cool sky, and two contour lights from behind that draw the silhouette */
scene.add(new T.HemisphereLight(0x8fa6ff,0x050817,.55));
const key=new T.DirectionalLight(0xffffff,.85);key.position.set(-3,5,6);scene.add(key);
const rimA=new T.DirectionalLight(0x5b9cff,2.4);rimA.position.set(4,3,-5);scene.add(rimA);
const rimB=new T.DirectionalLight(0x9a7bff,1.6);rimB.position.set(-5,2,-4);scene.add(rimB);
const bounce=new T.PointLight(0xffb26b,.6,6);bounce.position.set(.6,.2,1.2);scene.add(bounce);

const group=new T.Group();scene.add(group);
/* soft contact shadow under the base */
{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
 const m=new T.Mesh(new T.PlaneGeometry(3.4,2.4),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(1.1,.002,0);m.scale.setScalar(1.5);group.add(m)}


const printed=new T.MeshStandardMaterial({color:0xbfc8ee,roughness:.6,metalness:0}),servo=new T.MeshStandardMaterial({color:0x12182f,roughness:.38,metalness:.25});
let arm;try{arm=await SO101.load('/so101/',{printed,servo})}catch(e){return}
const holder=new T.Object3D();holder.rotation.x=-Math.PI/2;holder.scale.setScalar(10);holder.add(arm.root);group.add(holder);
const J=['shoulder_pan','shoulder_lift','elbow_flex','wrist_flex','wrist_roll','gripper'];
J.forEach(n=>arm.set(n,0));holder.updateMatrixWorld(true);
/* geometry at zero pose: gripper length from the wrist joint to the fingertips */
const wj=arm.joint.wrist_flex.parent,_a=new T.Vector3(),_b=new T.Vector3();wj.getWorldPosition(_a);arm.tip.getWorldPosition(_b);const LG=_a.distanceTo(_b)/group.scale.x;
const q={shoulder_pan:-.3,shoulder_lift:-.4,elbow_flex:.6,wrist_flex:.9,wrist_roll:0,gripper:.5};J.forEach(n=>arm.set(n,q[n]));

/* exploded view: each part has a direction out from the arm's centre (computed in its own link frame) */
holder.updateMatrixWorld(true);
const ctr=new T.Vector3(1.4,2.2,0),wp=new T.Vector3(),inv=new T.Matrix4(),rnd=(()=>{let s=3;return()=>((s=s*16807%2147483647)-1)/2147483646})();
arm.parts.forEach((m,i)=>{m.getWorldPosition(wp);const d=wp.clone().sub(ctr);d.y=Math.max(d.y,-.2);d.normalize().multiplyScalar(.7+rnd()*.6);d.y+=.25+rnd()*.35;
  inv.copy(m.parent.matrixWorld).invert();const p0=new T.Vector3().applyMatrix4(inv),p1=d.clone().applyMatrix4(inv);m.userData.ex=p1.sub(p0);
  let depth=0,o=m.parent;while(o&&o!==arm.root){if(o.userData.axis)depth++;o=o.parent}m.userData.t0=.35+depth*.28+rnd()*.25});

/* inverse kinematics: pan/lift/elbow bring the wrist above the target (CCD), the wrist keeps the gripper pointing down */
const chain=['elbow_flex','shoulder_lift','shoulder_pan'],P=new T.Vector3(),A=new T.Vector3(),E=new T.Vector3(),G=new T.Vector3(),W=new T.Vector3(),tmpQ=new T.Quaternion();
const LIM={shoulder_lift:[-1.1,1.0],elbow_flex:[-.2,1.65],shoulder_pan:[-1.3,1.3]};
function ccd(target,iters,gain){W.copy(target);W.y+=LG*group.scale.x;
  for(let it=0;it<iters;it++)for(const n of chain){const r=arm.joint[n];r.updateMatrixWorld(true);
  r.getWorldPosition(P);A.copy(r.userData.axis).applyQuaternion(r.getWorldQuaternion(tmpQ)).normalize();wj.getWorldPosition(E);
  E.sub(P);G.copy(W).sub(P);E.addScaledVector(A,-E.dot(A));G.addScaledVector(A,-G.dot(A));if(E.lengthSq()<1e-8||G.lengthSq()<1e-8)continue;
  const ang=Math.atan2(A.dot(E.clone().cross(G)),E.dot(G)),[lo,hi]=LIM[n];arm.set(n,Math.min(hi,Math.max(lo,arm.joint[n].userData.q+ang*gain)))}
  const want=Math.PI/2-arm.joint.shoulder_lift.userData.q-arm.joint.elbow_flex.userData.q;arm.set('wrist_flex',arm.joint.wrist_flex.userData.q+(want-arm.joint.wrist_flex.userData.q)*.25)}

const ray=new T.Raycaster(),ptr=new T.Vector2(),plane=new T.Plane(),hit=new T.Vector3(),tgt=new T.Vector3(1.2,1,0),want=new T.Vector3();
let active=false,last=0,grip=0,mx=0,my=0;
addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();if(e.clientY>r.bottom||e.clientY<r.top)return;ptr.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);mx=ptr.x;my=ptr.y;active=true;last=performance.now()},{passive:true});
cv.parentElement.addEventListener('pointerdown',e=>{if(!e.target.closest('a'))grip=1});addEventListener('pointerup',()=>grip=0);

/* caption */
const hero=cv.parentElement,cap=document.createElement('div');cap.className='tel';hero.appendChild(cap);let capT=0,capOn=false;
const deg=n=>Math.round(arm.joint[n].userData.q*57.3);

let wide=true,baseRY=-.5;
function size(){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;gl.setSize(w,h,false);cam.aspect=w/h;wide=w/h>1.1;
  cam.position.set(0,1.8,14);cam.lookAt(0,.4,0);cam.updateProjectionMatrix();
  const half=Math.tan(cam.fov*Math.PI/360)*14,tx=Math.min(w*.7,w/2+430),wx=(tx/w-.5)*2*half*cam.aspect,sc=.56*2*half/4.2;
  group.position.set(wx-1.5*sc,-2.0*sc,0);group.scale.setScalar(sc)}
new ResizeObserver(size).observe(cv);size();group.rotation.y=baseRY;

const clock=new T.Clock();let t=0,vis=1;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);t+=dt;
  /* fade with the hero; stop drawing once it's gone */
  const sy=Math.max(0,scrollY),fade=Math.max(0,1-sy/(innerHeight*.8));if(Math.abs(fade-vis)>.001){vis=fade;cv.style.opacity=fade;cap.style.opacity=capOn?fade:0}
  if(fade<=0)return;
  const live=active&&performance.now()-last<3000&&!reduce;
  group.rotation.y+=((live?baseRY+mx*.18:baseRY+Math.sin(t*.13)*.1)-group.rotation.y)*Math.min(1,dt*2);
  group.updateMatrixWorld();
  /* target */
  if(live){ray.setFromCamera(ptr,cam);group.getWorldPosition(P);plane.setFromNormalAndCoplanarPoint(cam.getWorldDirection(A).negate(),group.localToWorld(P.set(2.4,1.2,0)));
    if(ray.ray.intersectPlane(plane,hit)){group.worldToLocal(hit);hit.x=Math.min(3.0,Math.max(1.3,hit.x));hit.y=Math.min(2.2,Math.max(.25,hit.y));hit.z=Math.min(1.4,Math.max(-1.4,hit.z));want.copy(hit);group.localToWorld(want)}}
  else{const e=.5+.5*Math.sin(t*.5);want.set(2.0+.35*Math.sin(t*.21),.3+.9*e,.8*Math.sin(t*.17));group.localToWorld(want)}
  tgt.lerp(want,1-Math.pow(.02,dt));
  if(!reduce)ccd(tgt,3,.3);
  arm.set('wrist_roll',reduce?0:.5*Math.sin(t*.23));
  const gq=live?(grip?0:1.0):(.15+.85*(.5+.5*Math.sin(t*.5)));arm.set('gripper',arm.joint.gripper.userData.q+(gq-arm.joint.gripper.userData.q)*Math.min(1,dt*6));
  /* assemble on load, come apart as the page scrolls away */
  const sk=Math.min(1,sy/(innerHeight*.75));let kMax=0;
  arm.parts.forEach(m=>{const u=reduce?1:Math.min(1,Math.max(0,(t-m.userData.t0)/1.1)),e=u*u*(3-2*u),k=Math.max(1-e,sk*.8);if(k>kMax)kMax=k;
    m.position.copy(m.userData.home).addScaledVector(m.userData.ex,k)});
  const on=kMax<.02;if(on!==capOn){capOn=on;cap.classList.toggle('on',on);cap.style.opacity=on?vis:0}
  if((capT-=dt)<0&&capOn){capT=.2;cap.textContent=`Pan ${deg('shoulder_pan')}° · Lift ${deg('shoulder_lift')}° · Elbow ${deg('elbow_flex')}° · Gripper ${Math.round(arm.joint.gripper.userData.q/1.1*100)}%`;
    group.localToWorld(wp.set(1.4,0,1.9));wp.project(cam);cap.style.transform=`translate(${(wp.x*.5+.5)*cv.clientWidth}px,${(-wp.y*.5+.5)*cv.clientHeight+18}px) translateX(-50%)`}
  gl.render(scene,cam)}
frame();
addEventListener('pageshow',()=>{vis=-1});
setTimeout(()=>hero.classList.add('ready'),2600);
})();
