/* SO-101 follower arm from its URDF (TheRobotStudio/SO-ARM100, Apache-2.0), for three.js r128.
   SO101.load(base, {printed, servo}) → {root, joint:{name:Object3D}, limits, parts:[Mesh], tip:Object3D} */
(function(){
const T=THREE;
function rpy(o,r){o.rotation.set(r[0],r[1],r[2],'ZYX')}
async function load(base,opt){
  opt=opt||{};
  const [meta,bin]=await Promise.all([fetch(base+'so101.json').then(r=>r.json()),fetch(base+'so101.bin').then(r=>r.arrayBuffer())]);
  const geos={};
  for(const [name,m] of Object.entries(meta.meshes)){
    const q=new Uint16Array(bin,m.off,m.v*3),n=new Int8Array(bin,m.noff,m.v*3),idx=m.i32?new Uint32Array(bin,m.ioff,m.f*3):new Uint16Array(bin,m.ioff,m.f*3);
    const p=new Float32Array(m.v*3),nn=new Float32Array(m.v*3);
    for(let i=0;i<m.v;i++)for(let k=0;k<3;k++){p[i*3+k]=m.lo[k]+q[i*3+k]/65535*(m.hi[k]-m.lo[k]);nn[i*3+k]=n[i*3+k]/127}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(nn,3));g.setIndex(new T.BufferAttribute(idx,1));
    g.computeBoundingSphere();geos[name]=g}
  const mats={'3d_printed':opt.printed||new T.MeshStandardMaterial({color:0xd8ddf5,roughness:.55,metalness:0}),
              sts3215:opt.servo||new T.MeshStandardMaterial({color:0x141a33,roughness:.42,metalness:.2})};
  const links={},parts=[],joint={},limits={};
  const mk=name=>{const o=new T.Object3D();o.name=name;links[name]=o;
    (meta.links[name]||[]).forEach(v=>{const mesh=new T.Mesh(geos[v.mesh],mats[v.mat]||mats['3d_printed']);mesh.position.fromArray(v.xyz);rpy(mesh,v.rpy);
      mesh.userData.home=mesh.position.clone();mesh.userData.mat=v.mat;o.add(mesh);parts.push(mesh)});return o};
  const root=mk('base_link');
  meta.joints.forEach(j=>{const parent=links[j.parent]||mk(j.parent);const frame=new T.Object3D();frame.position.fromArray(j.xyz);rpy(frame,j.rpy);parent.add(frame);
    const rot=new T.Object3D();rot.userData.axis=new T.Vector3().fromArray(j.axis).normalize();frame.add(rot);
    const child=links[j.child]||mk(j.child);rot.add(child);
    if(j.type==='revolute'){joint[j.name]=rot;limits[j.name]=[j.lo,j.hi]}});
  /* joints are set by angle: rot.quaternion from axis */
  const set=(name,a)=>{const r=joint[name];if(!r)return;const [lo,hi]=limits[name];a=Math.min(hi,Math.max(lo,a));r.userData.q=a;r.quaternion.setFromAxisAngle(r.userData.axis,a)};
  Object.keys(joint).forEach(n=>set(n,0));
  return {root,joint,limits,parts,set,tip:links['gripper_frame_link'],links,credit:meta.credit}}
window.SO101={load};
})();
