/* Achievement medallions, shared by the lessons (ped.js) and the map (index.html).
   Progress itself lives in localStorage: ped_v1 (per lesson) and ach_v1 (summary for the map). */
(function(){
const P={
stage:'<path d="M6 17V3.5M6 4h8.5l-2 3 2 3H6"/>',
intuition:'<path d="M11 2.5 4.5 11H9l-1 6.5L14.5 9H10z"/>',
memory:'<path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.6 3.4v3.1h-3.1"/>',
check:'<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r=".6" fill="currentColor"/>',
level:'<path d="M10 2.8l2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.6l-4.3 2.3.9-4.8-3.5-3.3 4.8-.6z"/>',
streak:'<path d="M10 17.5c-3 0-5-2-5-4.8 0-2.6 2-4.2 2.6-6.7.9 1 1.3 2 1.3 3 1-1.4 1.7-3.4 1.4-6 3 1.8 4.7 5.3 4.7 8.6 0 3.3-2 5.9-5 5.9z"/>'};
const med=(kind,on)=>`<span class="am k-${kind}${on===false?' off':''}" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[kind]||P.stage}</svg></span>`;
const read=()=>{try{return JSON.parse(localStorage.getItem('ach_v1')||'{}')}catch(_){return{}}};
const css=`.am{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;color:#a9b6ff;background:radial-gradient(circle at 35% 30%,#1f2b6b,#0b1135 75%);border:1.5px solid rgba(138,155,255,.75);box-shadow:0 0 0 3px rgba(91,156,255,.08)}
.am.k-intuition,.am.k-memory,.am.k-check,.am.k-streak{color:#ffc58f;border-color:rgba(255,178,107,.8);box-shadow:0 0 0 3px rgba(255,178,107,.08)}
.am.k-level{color:#fff;border-color:transparent;background:linear-gradient(135deg,#5b9cff,#8a6bff)}
.am.off{color:#7380b0;background:none;border:1.5px dashed rgba(143,155,196,.5);box-shadow:none}
.al{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;text-align:left}
.al li{display:flex;align-items:center;gap:10px;min-width:0;font-size:13px;line-height:1.3;color:#dfe4fb}
.al li.off{color:#8f9bc4}
.al li span:last-child{min-width:0}
.al .ad{display:block;margin-top:2px;font-size:13px;line-height:1.35;color:#8f9bc4}
.al .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media(max-width:420px){.al{grid-template-columns:1fr}}`;
const st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
window.ACH={med,read};
})();
