/* Achievement medallions, shared by the lessons (ped.js) and the map (index.html).
   Each achievement has its own art (electronics/ach/*.webp, the level cards for whole levels);
   locked ones show the same art in grey behind a dashed ring.
   Progress lives in localStorage: ped_v1 (per lesson), book_v1 (problems), rev_v1 (reviews), ach_v1 (summary for the map). */
(function(){
const P={
stage:'<path d="M6 17V3.5M6 4h8.5l-2 3 2 3H6"/>',
surprise:'<path d="M11 2.5 4.5 11H9l-1 6.5L14.5 9H10z"/>',
review:'<path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.6 3.4v3.1h-3.1"/>',
solo:'<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r=".6" fill="currentColor"/>',
level:'<path d="M10 2.8l2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.6l-4.3 2.3.9-4.8-3.5-3.3 4.8-.6z"/>'};
const ART={surprise:'/electronics/ach/surprise.webp',solo:'/electronics/ach/solo.webp',review:'/electronics/ach/review.webp',spaced:'/electronics/ach/spaced.webp',half:'/electronics/levels/lvh.webp'};
const med=(kind,on,img)=>{const src=img||ART[kind];
  if(src)return `<span class="am pic k-${kind}${on===false?' off':''}" aria-hidden="true"><img src="${src}" alt="" loading="lazy" width="96" height="96"></span>`;
  return `<span class="am k-${kind}${on===false?' off':''}" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[kind]||P.stage}</svg></span>`};
const read=()=>{try{return JSON.parse(localStorage.getItem('ach_v1')||'{}')}catch(_){return{}}};
const css=`.am{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;color:#a9b6ff;background:radial-gradient(circle at 35% 30%,#1f2b6b,#0b1135 75%);border:1.5px solid rgba(138,155,255,.75);box-shadow:0 0 0 3px rgba(91,156,255,.08);overflow:hidden;position:relative}
.am.pic{padding:0;background:#0b1135;border:2px solid rgba(138,155,255,.85);box-shadow:0 0 0 3px rgba(91,156,255,.12),0 6px 18px rgba(0,0,0,.35)}
.am.pic img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.18)}
.am.pic.k-surprise,.am.pic.k-solo,.am.pic.k-review,.am.pic.k-spaced{border-color:rgba(255,178,107,.9);box-shadow:0 0 0 3px rgba(255,178,107,.12),0 6px 18px rgba(0,0,0,.35)}
.am.pic.k-level,.am.pic.k-half{border:2px solid transparent;background:linear-gradient(#0b1135,#0b1135) padding-box,linear-gradient(135deg,#5b9cff,#8a6bff) border-box}
.am.k-level:not(.pic){color:#fff;border-color:transparent;background:linear-gradient(135deg,#5b9cff,#8a6bff)}
.am.off{color:#7380b0;background:none;border:1.5px dashed rgba(143,155,196,.5);box-shadow:none}
.am.pic.off{border:2px dashed rgba(143,155,196,.55)!important;background:#0b1135!important;box-shadow:none!important}
.am.pic.off img{filter:grayscale(1) brightness(.45) contrast(.9);opacity:.8}
.al{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;text-align:left}
.al li{display:flex;align-items:center;gap:12px;min-width:0;font-size:13px;line-height:1.3;color:#dfe4fb}
.al li .am{width:52px;height:52px}
.al li.off{color:#8f9bc4}
.al li span:last-child{min-width:0}
.al .ad{display:block;margin-top:2px;font-size:13px;line-height:1.35;color:#8f9bc4}
.al .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media(max-width:420px){.al{grid-template-columns:1fr}}
@media(prefers-contrast:more){.am.pic.off img{filter:grayscale(1) brightness(.6)}}`;
const st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
/* course-wide achievements, computed from storage (no lesson needed) */
function course(){let R={},F={};try{R=JSON.parse(localStorage.getItem('rev_v1')||'{}');F=JSON.parse(localStorage.getItem('pfx_v1')||'{}')}catch(_){}
  return[{kind:'half',en:'Prefixes',d:'Finished Level ½.',lock:'Finish the prefixes drill.',got:Object.keys(F.a||{}).length>=12},
         {kind:'spaced',en:'Spaced out',d:'Reviews done on three different days.',lock:'Do a review on three different days.',got:(R.days||[]).length>=3}]}
window.ACH={med,read,course};
})();
