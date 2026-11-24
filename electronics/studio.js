/* The studio around the course desk: back wall, walnut shelving with LED strips, books, trailing pothos,
   blueprint frames, a desk lamp with a soft light cone and dust in its beam. three.js r128.
   STUDIO.build(scene, {tex:'/electronics/tex/', quality}) → {update(t), lights} */
(function(){
const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z);
function merge(geos){let n=0,iN=0;geos.forEach(g=>{n+=g.attributes.position.count;iN+=g.index.count});
  const p=new Float32Array(n*3),no=new Float32Array(n*3),uv=new Float32Array(n*2),idx=new Uint32Array(iN);let o=0,io=0;
  geos.forEach(g=>{p.set(g.attributes.position.array,o*3);no.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);
    const gi=g.index.array;for(let k=0;k<gi.length;k++)idx[io+k]=gi[k]+o;o+=g.attributes.position.count;io+=gi.length});
  const m=new T.BufferGeometry();m.setAttribute('position',new T.BufferAttribute(p,3));m.setAttribute('normal',new T.BufferAttribute(no,3));m.setAttribute('uv',new T.BufferAttribute(uv,2));m.setIndex(new T.BufferAttribute(idx,1));return m}
function build(scene,opt){
  opt=opt||{};const L=new T.TextureLoader(),base=opt.tex||'/electronics/tex/',tex=n=>{const t=L.load(base+n);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t};
  const root=new T.Group();scene.add(root);const upd=[];
  const rep=(n,lin)=>{const t=lin?L.load(base+n):tex(n);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t};
  /* walnut with grain relief and uneven sheen: colour, bump and roughness maps */
  const mWood=new T.MeshStandardMaterial({map:rep('shelf.webp'),bumpMap:rep('shelf_bump.webp',1),bumpScale:.02,color:0x6e5d52,roughness:.95,metalness:0,envMapIntensity:0});
  const mDesk=new T.MeshStandardMaterial({map:rep('desk.webp'),bumpMap:rep('desk_bump.webp',1),bumpScale:.035,roughnessMap:rep('desk_rough.webp',1),color:0xc9a993,roughness:1,metalness:0});
  /* back wall: deep navy plaster with a faint vertical gradient baked into vertex colours */
  const FY=-7.4,RW=28,RZ=24;
  const plaster=(w,h)=>{const g=new T.PlaneGeometry(w,h,1,10),c=[];for(let i=0;i<g.attributes.position.count;i++){const y=g.attributes.position.getY(i),k=.6+.4*(y+h/2)/h;c.push(.026*k,.031*k,.058*k)}
    g.setAttribute('color',new T.Float32BufferAttribute(c,3));const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.receiveShadow=true;return m};
  {const w=plaster(2*RW,30);w.position.set(0,FY+15,-9.6);root.add(w);
   const l=plaster(RZ+9.6,30);l.rotation.y=Math.PI/2;l.position.set(-RW,FY+15,(RZ-9.6)/2);root.add(l);
   const r=plaster(RZ+9.6,30);r.rotation.y=-Math.PI/2;r.position.set(RW,FY+15,(RZ-9.6)/2);root.add(r)}
  /* shelving: three bays of walnut uprights and boards */
  const X0=-15,BW=10,YS=[3.2,6.2,9.2,12.2],D=1.7,Z=-8.6;
  const parts=[];let pk=0;
  /* world-scaled UVs, grain along the long side of every face */
  const plank=(w,h,d,x,y,z)=>{const g=new T.BoxGeometry(w,h,d);const a=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]],o=(pk++*.37)%1;
    for(let f=0;f<6;f++){const [fu,fv]=dims[f],sw=fv>fu;for(let k=0;k<4;k++){const i=f*4+k,u=a.getX(i),v=a.getY(i);const U=(sw?v*fv:u*fu)/4+o,V=(sw?u*fu:v*fv)/4+o*.5;a.setXY(i,U,V)}}
    g.translate(x,y,z);parts.push(g)};
  for(let b=0;b<=3;b++)plank(.28,13.4,D,X0+b*BW,6.7,Z);
  YS.forEach((y,i)=>plank(BW*3+.28,.22,D,X0+BW*1.5,y,Z));
  {const sm=new T.Mesh(merge(parts),mWood);sm.receiveShadow=true;root.add(sm)}
  /* LED strips under each board, blue to violet across the bays, plus a few real lights */
  YS.slice(0,3).forEach((y,i)=>{for(let b=0;b<3;b++){const c=new T.Color().lerpColors(new T.Color(0x3d7bff),new T.Color(0x8a5bff),(b+i*.3)/3);
      const s=new T.Mesh(new T.BoxGeometry(BW-.5,.04,.06),new T.MeshBasicMaterial({color:new T.Color(0x5b9cff).multiplyScalar(.9)}));s.position.set(X0+b*BW+BW/2,y-.13,Z+D/2-.12);root.add(s)}});
  /* the strips are the only light on the shelving: each one shines down onto the shelf below it */
  if(opt.quality==='low')[[-10,YS[1]-.4],[0,YS[2]-.4],[10,YS[1]-.4]].forEach(([x,y])=>{const l=new T.PointLight(0x8fb4ff,1.4,5,2);l.position.set(x,y,Z+D/2-.4);root.add(l)});
  else YS.forEach((y,i)=>[0,1,2].forEach(b=>{const x=X0+b*BW+BW/2,l=new T.SpotLight(0x9dbcff,i===0?3.4:5.2,6.5,1.2,1,1.3);l.position.set(x,y-.15,Z+D/2+.15);l.target.position.set(x,y-2.6,Z-.6);root.add(l,l.target)}));
  /* books: one merged mesh, spines from a generated atlas, tops and pages in plain regions */
  {const sp=tex('spines.webp'),mats=new T.MeshStandardMaterial({map:sp,roughness:.8,emissiveMap:sp,emissive:0xffffff,emissiveIntensity:.1});const geos=[];let seed=11;const r=()=>((seed=seed*16807%2147483647)-1)/2147483646;
   const shelf=(x0,x1,y,lean)=>{let x=x0;while(x<x1){const w=.22+r()*.22,h=1.4+r()*.9,d=1.1+r()*.3;if(x+w>x1)break;const g=new T.BoxGeometry(w,h,d);
      const k=Math.floor(r()*16),uv=g.attributes.uv,u0=k/16+.006,u1=(k+1)/16-.006;
      for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;if(f===4){uv.setXY(i,u0+(u1-u0)*uv.getX(i),.04+.92*uv.getY(i))}else{uv.setXY(i,u0+.3*(u1-u0),.5)}}
      g.translate(0,h/2,0);if(lean&&r()<.12){g.rotateZ(-.22);x+=.25}g.translate(x+w/2,y+.11,Z+.05);geos.push(g);x+=w+.015+(r()<.08?.6+r()*1.2:0)}};
   [[X0+.4,X0+6.2,YS[0]],[X0+BW+3.6,X0+2*BW-.4,YS[0]],[X0+2*BW+.4,X0+2*BW+4.4,YS[0]],[X0+.4,X0+3.8,YS[1]],[X0+BW+.4,X0+BW+5.6,YS[1]],[X0+2*BW+5.4,X0+3*BW-.4,YS[1]],[X0+3.4,X0+BW-.4,YS[2]],[X0+2*BW+.4,X0+2*BW+6,YS[2]]].forEach(([a,b,y])=>shelf(a,b,y,true));
   root.add(new T.Mesh(merge(geos),mats))}
  /* plants: pots + pothos leaves as instanced cards with a generated leaf texture */
  const leafTex=tex('leaf.webp'),mLeaf=new T.MeshStandardMaterial({map:leafTex,emissiveMap:leafTex,emissive:0xffffff,emissiveIntensity:.14,alphaTest:.45,side:T.DoubleSide,roughness:.45,color:0xbfd6c8});
  const leafG=new T.PlaneGeometry(.95,.95);leafG.translate(0,.42,0);
  const pots=[],leaves=[];let s2=5;const rr=()=>((s2=s2*16807%2147483647)-1)/2147483646;
  const pot=(x,y,z,r,h,c)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r*.8,h,24),new T.MeshStandardMaterial({color:c,roughness:.75}));m.position.set(x,y+h/2,z);root.add(m);pots.push(m);return y+h};
  const bush=(x,y,z,n,sp)=>{for(let i=0;i<n;i++){const a=rr()*6.283,e=rr();leaves.push({p:V(x+Math.cos(a)*sp*e,y+.1+rr()*sp*.9,z+Math.sin(a)*sp*e*.7),ry:a+Math.PI/2,rx:-.6-rr()*.6,s:.7+rr()*.5})}};
  const vine=(x,y,z,len,sway)=>{const pts=[];for(let k=0;k<=8;k++){const u=k/8;pts.push(V(x+Math.sin(u*2.2)*sway,y-u*len,z+.25+u*.5))}const c=new T.CatmullRomCurve3(pts);
    for(let i=0;i<len*7;i++){const u=i/(len*7),p=c.getPoint(u);leaves.push({p,ry:(i%2?1:-1)*1.1+rr()*.6,rx:.4+rr()*.5,s:.55+rr()*.35*(1-u)})}};
  let top=pot(X0+BW+6.4,YS[2]+.11,Z+.1,.55,.8,0xd9def7);bush(X0+BW+6.4,top,Z+.1,22,.7);vine(X0+BW+6.2,top,Z+.2,6.5,.6);vine(X0+BW+6.9,top,Z+.3,4.2,-.5);
  top=pot(X0+2*BW+7.6,YS[2]+.11,Z+.1,.5,.75,0x1d2752);bush(X0+2*BW+7.6,top,Z+.1,20,.65);vine(X0+2*BW+7.8,top,Z+.2,3.6,.4);
  top=pot(X0+7.6,YS[0]+.11,Z+.1,.5,.7,0xd9def7);bush(X0+7.6,top,Z+.1,24,.8);
  top=pot(X0+2*BW+4.9,YS[1]+.11,Z+.1,.42,.6,0x8a6bff);bush(X0+2*BW+4.9,top,Z+.1,14,.55);
  {const im=new T.InstancedMesh(leafG,mLeaf,leaves.length),o=new T.Object3D();leaves.forEach((l,i)=>{o.position.copy(l.p);o.rotation.set(l.rx,l.ry,0,'YXZ');o.scale.setScalar(l.s);o.updateMatrix();im.setMatrixAt(i,o.matrix)});root.add(im)}
  /* desk lamp on the right: an articulated arm whose shade points at the board; warm cone of light, dust drifting through it */
  const AIM=V(opt.aim?opt.aim.x:3,0,opt.aim?opt.aim.z:.6),BASE=V(7.4,0,-4.0),ELB=V(7.9,3.5,-4.6),LP=V(6.5,4.6,-3.0),dir=AIM.clone().sub(LP).normalize();
  {const m=new T.MeshStandardMaterial({color:0x1a1f33,roughness:.35,metalness:.6});
   const rod=(p,q,r)=>{const g=new T.Mesh(new T.CylinderGeometry(r,r,p.distanceTo(q),10),m);g.position.copy(p).add(q).multiplyScalar(.5);g.quaternion.setFromUnitVectors(V(0,1,0),q.clone().sub(p).normalize());g.castShadow=true;root.add(g)};
   const b=new T.Mesh(new T.CylinderGeometry(.55,.65,.14,28),m);b.position.copy(BASE).setY(.07);b.castShadow=b.receiveShadow=true;root.add(b);
   rod(V(BASE.x,.1,BASE.z),ELB,.055);
   {const cord=[V(BASE.x+.3,.04,BASE.z-.45),V(BASE.x+.6,.03,-5.0),V(BASE.x+.8,.03,-5.35),V(BASE.x+.85,-.2,-5.52),V(BASE.x+.9,-2,-5.6),V(BASE.x+1.1,-7.3,-5.9),V(BASE.x+2.6,-7.38,-6.4)];
    const cm=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cord),80,.03,6),new T.MeshStandardMaterial({color:0x111318,roughness:.6}));cm.castShadow=true;root.add(cm)}rod(ELB,LP.clone().addScaledVector(dir,-.35),.05);
   const j=new T.Mesh(new T.SphereGeometry(.09,12,8),m);j.position.copy(ELB);root.add(j);
   const sh=new T.Mesh(new T.ConeGeometry(.6,.85,32,1,true),new T.MeshStandardMaterial({color:0x1a1f33,roughness:.4,metalness:.5,side:T.DoubleSide}));
   sh.position.copy(LP);sh.quaternion.setFromUnitVectors(V(0,-1,0),dir);sh.castShadow=true;root.add(sh);
   const bulb=new T.Mesh(new T.SphereGeometry(.17,16,10),new T.MeshBasicMaterial({color:new T.Color(0xffd9a8).multiplyScalar(4)}));bulb.position.copy(LP).addScaledVector(dir,.22);root.add(bulb);
   {const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,214,170,.9)');g.addColorStop(.25,'rgba(255,178,107,.35)');g.addColorStop(1,'rgba(255,178,107,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
    const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.setScalar(1.6);sp.position.copy(bulb.position);root.add(sp)}
   /* glare: when you look into the shade the bulb blooms and throws diffraction spikes, fading as you look away */
   {const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.translate(256,256);
    let g=x.createRadialGradient(0,0,0,0,0,256);g.addColorStop(0,'rgba(255,236,210,1)');g.addColorStop(.06,'rgba(255,214,170,.85)');g.addColorStop(.22,'rgba(255,178,107,.22)');g.addColorStop(1,'rgba(255,178,107,0)');x.fillStyle=g;x.fillRect(-256,-256,512,512);
    x.globalCompositeOperation='lighter';[[0,1],[Math.PI/2,1],[Math.PI/4,.45],[-Math.PI/4,.45]].forEach(([a,k])=>{x.save();x.rotate(a);const l=x.createLinearGradient(-256,0,256,0);l.addColorStop(0,'rgba(255,220,180,0)');l.addColorStop(.5,`rgba(255,235,210,${.9*k})`);l.addColorStop(1,'rgba(255,220,180,0)');x.fillStyle=l;x.beginPath();x.moveTo(-256,0);x.lineTo(0,-3*k);x.lineTo(256,0);x.lineTo(0,3*k);x.closePath();x.fill();x.restore()});
    x.strokeStyle='rgba(160,190,255,.10)';x.lineWidth=6;x.beginPath();x.arc(0,0,150,0,Math.PI*2);x.stroke();
    const gm=new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true,opacity:0}),gl=new T.Sprite(gm);gl.position.copy(bulb.position);gl.renderOrder=10;root.add(gl);
    const tv=new T.Vector3();gl.onBeforeRender=(r,sc,cam)=>{tv.copy(cam.position).sub(gl.position).normalize();const a=tv.dot(dir),k=Math.max(0,Math.min(1,(a-.15)/.6));gm.opacity=k*k*.95;gl.scale.setScalar(2+k*7)}}
   const spot=new T.SpotLight(0xffb26b,7,26,.7,.7,1.5);spot.position.copy(LP).addScaledVector(dir,.25);spot.target.position.copy(AIM);
   spot.castShadow=true;spot.shadow.mapSize.set(2048,2048);spot.shadow.bias=-.0004;spot.shadow.radius=4;spot.shadow.camera.near=1;spot.shadow.camera.far=18;root.add(spot,spot.target);
   /* soft volumetric cone: additive, fades along its length and toward the edges */
   const cg=new T.ConeGeometry(3.4,5,40,1,true);cg.translate(0,-2.5,0);
   const cm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uT:{value:0}},
     vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 w=modelViewMatrix*vec4(position,1.);vV=normalize(-w.xyz);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*w;}',
     fragmentShader:'uniform float uT;varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){float along=clamp(-vP.y/5.,0.,1.);float rim=pow(abs(dot(vN,vV)),1.6);float n=.85+.15*sin(vP.y*3.+uT*.6)*sin(vP.x*4.-uT*.4);gl_FragColor=vec4(vec3(1.,.78,.55)*.07*rim*(1.-along)*(1.-along)*n,1.);}'});
   const cone=new T.Mesh(cg,cm);cone.position.copy(LP).addScaledVector(dir,.2);cone.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().negate());root.add(cone);upd.push(t=>cm.uniforms.uT.value=t);
   /* dust motes */
   const N=opt.quality==='low'?70:120,pp=new Float32Array(N*3),ph=new Float32Array(N);for(let i=0;i<N;i++){pp.set([AIM.x+(LP.x-AIM.x)*Math.random()+(Math.random()-.5)*2,Math.random()*4.4,AIM.z+(LP.z-AIM.z)*Math.random()+(Math.random()-.5)*2],i*3);ph[i]=Math.random()*6.28}
   const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(pp,3));dg.setAttribute('aPh',new T.BufferAttribute(ph,1));
   const dm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uT:{value:0},uL:{value:LP.clone().lerp(AIM,.5)},uS:{value:innerHeight*.012}},
     vertexShader:'uniform float uT;uniform vec3 uL;uniform float uS;attribute float aPh;varying float vA;void main(){vec3 p=position;p.y=mod(p.y+uT*.05+aPh,4.4);p.x+=sin(uT*.2+aPh)*.25;p.z+=cos(uT*.17+aPh*1.3)*.25;float d=length(p.xz-vec2(uL.x,uL.z));vA=smoothstep(2.4,.2,d)*(.4+.6*sin(uT*.8+aPh*3.)*.5+.3);vec4 w=modelViewMatrix*vec4(p,1.);gl_PointSize=uS*2.5/-w.z;gl_Position=projectionMatrix*w;}',
     fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.85,.65)*smoothstep(.5,0.,d)*vA*.9,1.);}'});
   root.add(new T.Points(dg,dm));upd.push(t=>dm.uniforms.uT.value=t)}

  /* the rest of the room: every light here has a visible source.
     floor lamp by the sofa (warm), a picture light over the print (warm), an LED bar in the far corner (cool),
     and a cool skirting strip along the walls that outlines everything standing in front of it */
  {const LQ=opt.quality!=='low',fab=new T.MeshLambertMaterial({color:0x1a2142}),fab2=new T.MeshLambertMaterial({color:0x222b52}),blk=new T.MeshLambertMaterial({color:0x08090c}),brass=new T.MeshStandardMaterial({color:0xb08a55,roughness:.4,metalness:.8});
   const bx=(w,h,d,m,x,y,z,par)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(par||root).add(o);return o};
   const cy=(r1,r2,h,m,x,y,z,par,seg)=>{const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg||24),m);o.position.set(x,y,z);o.castShadow=true;(par||root).add(o);return o};
   const glowTex=(c0)=>{const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,128,0,0);g.addColorStop(0,c0);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,4,128);return new T.CanvasTexture(c)};
   const glow=(w,h,col,x,y,z,ry)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:glowTex(col),transparent:true,blending:T.AdditiveBlending,depthWrite:false}));m.position.set(x,y,z);m.rotation.y=ry||0;root.add(m);return m};
   /* skirting LED: a thin lit line at the foot of each wall and the glow it throws up the plaster */
   const sk=new T.MeshBasicMaterial({color:new T.Color(0x5b9cff).multiplyScalar(.8)});
   bx(2*RW,.08,.08,sk,0,FY+.12,-9.5).castShadow=false;glow(2*RW,4.5,'rgba(70,120,255,.28)',0,FY+2.25,-9.55);
   [-1,1].forEach(sd=>{const z=(RZ-9.6)/2,o=bx(.08,.08,RZ+9.6,sk,sd*(RW-.1),FY+.12,z);o.castShadow=false;glow(RZ+9.6,4.5,'rgba(70,120,255,.24)',sd*(RW-.05),FY+2.25,z,-sd*Math.PI/2)});
   /* rug under the desk and chair */
   {const c=document.createElement('canvas');c.width=512;c.height=320;const x=c.getContext('2d');x.fillStyle='#141a2e';x.fillRect(0,0,512,320);x.strokeStyle='#2a3352';x.lineWidth=6;x.strokeRect(18,18,476,284);x.strokeStyle='#1d2440';x.lineWidth=2;x.strokeRect(34,34,444,252);
    for(let i=0;i<4000;i++){x.fillStyle=`rgba(${120+Math.random()*60|0},${130+Math.random()*60|0},200,${Math.random()*.05})`;x.fillRect(Math.random()*512,Math.random()*320,2,2)}
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;const r=new T.Mesh(new T.PlaneGeometry(34,21),new T.MeshLambertMaterial({map:t}));r.rotation.x=-Math.PI/2;r.position.set(-1,FY+.02,3.5);r.receiveShadow=true;root.add(r)}
   /* sofa along the left wall, facing the room */
   {const g=new T.Group();g.position.set(-RW+5.2,FY,3.6);root.add(g);const L=19,Dp=9;
    [[-L/2+.6,-Dp/2+.8],[L/2-.6,-Dp/2+.8],[-L/2+.6,Dp/2-.8],[L/2-.6,Dp/2-.8]].forEach(([z,x])=>cy(.22,.16,1.2,blk,x,.6,z,g,10));
    bx(Dp,2.2,L,fab,0,2.3,0,g);
    bx(2.4,5.0,L,fab,-Dp/2+1.2,4.4,0,g);{const r=cy(1.2,1.2,L,fab,-Dp/2+1.2,6.9,0,g);r.rotation.x=Math.PI/2}
    [-1,1].forEach(sd=>{bx(Dp,3.2,1.5,fab,0,2.8,sd*(L/2-.75),g);const r=cy(.75,.75,Dp,fab,0,4.4,sd*(L/2-.75),g);r.rotation.z=Math.PI/2});
    [-1,0,1].forEach(i=>{bx(Dp-2.8,1.3,(L-3)/3-.12,fab2,1.25,4.05,i*(L-3)/3,g);bx(1.5,3.6,(L-3)/3-.25,fab2,-Dp/2+3.05,6.0,i*(L-3)/3,g).rotation.z=-.12});
    bx(1.6,1.6,.5,new T.MeshLambertMaterial({color:0x8a5a3a}),.2,5.2,-L/2+3.2,g).rotation.set(.2,0,.35)}
   /* floor lamp in the corner: drum shade, warm */
   {const X=-20.2,Z=-7.2;cy(1.3,1.4,.25,blk,X,FY+.12,Z);cy(.1,.1,17,blk,X,FY+8.6,Z,null,10);
    const sh=new T.Mesh(new T.CylinderGeometry(1.7,1.9,2.6,32,1,true),new T.MeshBasicMaterial({color:new T.Color(1.0,.72,.45),side:T.DoubleSide}));sh.position.set(X,FY+17,Z);root.add(sh);
    const fl=new T.PointLight(0xffb878,LQ?3.2:2.2,46,1.15);fl.position.set(X+.6,FY+16.6,Z+.6);root.add(fl);
    glow(10,16,'rgba(255,170,100,.18)',X+.1,FY+18.5,-9.55)}
   /* prints on the walls, each in a thin black frame */
   const frame=(tx,w,h,x,y,z,ry)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry||0;root.add(g);bx(w+.35,h+.35,.12,blk,0,0,0,g);
     const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshLambertMaterial({map:tx}));p.position.z=.07;g.add(p);return g};
   frame(tex('bp3.webp'),4.6,6.9,-24.2,FY+15.6,-9.45);
   const big=frame(tex('bp2.webp'),8.4,5.6,21.4,FY+15.6,-9.45);
   /* a typographic print on the right wall */
   {const c=document.createElement('canvas');c.width=600;c.height=840;const x=c.getContext('2d');x.fillStyle='#0b1230';x.fillRect(0,0,600,840);
    x.fillStyle='#ffb26b';x.font='800 150px Unbounded,Manrope,sans-serif';x.fillText('U=IR',46,330);x.fillStyle='#c9d2f5';x.font='600 30px Manrope,sans-serif';x.fillText('Ohm, 1827',50,400);
    x.strokeStyle='#5b9cff';x.lineWidth=4;x.beginPath();for(let i=0;i<=12;i++){const px=50+i*42,py=600+(i%2?-34:34);i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();
    x.fillStyle='#8f9bc4';x.font='500 24px Manrope,sans-serif';x.fillText('voltage · current · resistance',50,740);
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;frame(t,5,7,RW-.08,FY+15,3.5,-Math.PI/2)}
   /* picture light over the big print */
   {bx(3.2,.18,.3,brass,21.4,FY+19.1,-9.1);const pl=new T.SpotLight(0xffd2a0,LQ?5:3,14,.8,.9,1.3);pl.position.set(21.4,FY+19.0,-8.6);pl.target.position.set(21.4,FY+14,-9.6);root.add(pl,pl.target)}
   /* LED bar in the far right corner washing the walls cool violet */
   {cy(.32,.32,1.4,blk,RW-1.4,FY+.7,-8.4);const b=new T.Mesh(new T.CylinderGeometry(.18,.18,1.2,12),new T.MeshBasicMaterial({color:new T.Color(0x8a6bff).multiplyScalar(1.6)}));b.position.set(RW-1.4,FY+1.6,-8.4);root.add(b);
    const ul=new T.PointLight(0x7f6bff,LQ?3.4:2,30,1.2);ul.position.set(RW-1.6,FY+2.6,-7.8);root.add(ul);
    glow(12,22,'rgba(130,100,255,.34)',RW-5,FY+10,-9.55);glow(12,22,'rgba(130,100,255,.28)',RW-.05,FY+10,-4.6,-Math.PI/2)}
   /* office chair, pulled back from the desk and turned a little */
   {const g=new T.Group();g.position.set(15.2,FY,6.4);g.rotation.y=-2.0;root.add(g);const pl=new T.MeshStandardMaterial({color:0x15171d,roughness:.5,metalness:.4});
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2,leg=bx(2.8,.3,.45,pl,Math.cos(a)*1.45,.75,Math.sin(a)*1.45,g);leg.rotation.y=-a;const w=cy(.32,.32,.35,blk,Math.cos(a)*2.75,.32,Math.sin(a)*2.75,g,12);w.rotation.x=Math.PI/2;w.rotation.y=-a}
    cy(.26,.26,3.6,pl,0,2.6,0,g,12);
    bx(5.4,.9,5.2,fab,0,4.8,0,g);
    const back=bx(5.0,5.6,.7,new T.MeshLambertMaterial({color:0x1c2133}),0,9.0,-2.75,g);back.rotation.x=-.12;
    bx(.9,.6,.5,pl,0,6.0,-2.6,g);
    [-1,1].forEach(sd=>{bx(.35,2.2,.35,pl,sd*2.75,5.9,.2,g);bx(.7,.3,2.4,blk,sd*2.75,7.05,.2,g)})}
  }
  return {root,desk:mDesk,update:t=>upd.forEach(f=>f(t))}}
window.STUDIO={build};
})();
