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
  {const g=new T.PlaneGeometry(60,22,1,8),c=[];for(let i=0;i<g.attributes.position.count;i++){const y=g.attributes.position.getY(i),k=.55+.45*(y+11)/22;c.push(.022*k,.028*k,.055*k)}
   g.setAttribute('color',new T.Float32BufferAttribute(c,3));const w=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));w.position.set(0,8,-9.6);root.add(w)}
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
  [[-10,YS[1]-.5,-7.6,0x5b9cff],[0,YS[2]-.5,-7.6,0x5b9cff],[10,YS[1]-.5,-7.6,0x6f7bff]].forEach(([x,y,z,c])=>{const l=new T.PointLight(c,1.6,5.5,2);l.position.set(x,y,z);root.add(l)});
  {const w=new T.SpotLight(0xffe6cc,2.6,40,.5,.8,1.2);w.position.set(1,17,-1);w.target.position.set(0,8,-8.6);root.add(w,w.target)}
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
   const spot=new T.SpotLight(0xffb26b,6,26,.56,.65,1.6);spot.position.copy(LP).addScaledVector(dir,.25);spot.target.position.copy(AIM);
   spot.castShadow=true;spot.shadow.mapSize.set(2048,2048);spot.shadow.bias=-.0004;spot.shadow.radius=4;spot.shadow.camera.near=1;spot.shadow.camera.far=18;root.add(spot,spot.target);
   /* soft volumetric cone: additive, fades along its length and toward the edges */
   const cg=new T.ConeGeometry(2.6,5,40,1,true);cg.translate(0,-2.5,0);
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
  return {root,desk:mDesk,update:t=>upd.forEach(f=>f(t))}}
window.STUDIO={build};
})();
