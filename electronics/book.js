/* Problem book: one problem at a time, worked → completion → full → backwards → design → debug → sanity.
   BOOK.set(key, problems) registers a level's problems; a <div class="book" data-book="key"> in a step mounts them.
   Problems: {kind, q, given:[..], find, unit, e (prefix of the answer field), ans (base units), tol | lo/hi,
              traps:[{v,msg}], hints:[..], sol (shown once solved), steps:[..] (worked/completion lines),
              choices:[..], a (index, for choice problems), suffix (field label when the unit is not a quantity)}
   State: localStorage book_v1 {key:{i:{s:1 solved, h:hints used, t:tries, f:first try right}}}. Misses go to rev_v1 for the review on the map. */
(function(){
const T=function(s){if(window.I18N)return I18N.t.apply(null,arguments);const a=arguments;return String(s).replace(/\{(\d+)\}/g,(m,i)=>a[+i+1])};
const SK='book_v1',RK='rev_v1';let S={};try{S=JSON.parse(localStorage.getItem(SK)||'{}')}catch(_){}
const save=()=>{try{localStorage.setItem(SK,JSON.stringify(S))}catch(_){}};
const SETS={},cur={};
const KIND={worked:'Worked example',fill:'Fill the gap',full:'Your turn',back:'Backwards',design:'Design it',debug:'Find the slip',sanity:'Sanity check',mixed:'Mixed'};
/* spaced review: 1, 3, 7, 21 days, then every two months; a miss starts the ladder again */
const DAY=864e5,IV=[1,3,7,21,60];
const RL=()=>{try{return JSON.parse(localStorage.getItem(RK)||'{}')}catch(_){return{}}},RS=R=>{try{localStorage.setItem(RK,JSON.stringify(R))}catch(_){}};
function sched(id,ok,force){const R=RL();R.items=R.items||{};let it=R.items[id];if(it&&!force)return;it=it||{s:0};it.s=ok?Math.min((it.s||0)+(force?1:0),IV.length-1):0;it.due=Date.now()+IV[it.s]*DAY;R.items[id]=it;RS(R)}
function miss(key,i){if(key==='rv')return;const R=RL();R.items=R.items||{};R.items[key+':'+i]={s:0,due:Date.now()+DAY};RS(R)}
function due(now){now=now||Date.now();const R=RL(),it=R.items||{};return Object.keys(it).filter(id=>{const[k,i]=id.split(':');return SETS[k]&&SETS[k][+i]&&it[id].due<=now}).sort((a,b)=>it[a].due-it[b].due)}
function nextDue(){const it=RL().items||{},t=Object.keys(it).filter(id=>SETS[id.split(':')[0]]).map(id=>it[id].due);return t.length?Math.min(...t):null}
function review(el,n){const ids=due().slice(0,n||3);if(!ids.length)return 0;SETS.rv=ids.map(id=>{const[k,i]=id.split(':');return Object.assign({},SETS[k][+i],{_id:id})});delete S.rv;cur.rv=0;el.dataset.book='rv';delete el.dataset.on;mount(el);return ids.length}
function solvedHook(k,i,first){if(k==='rv'){const p=SETS.rv[i];sched(p._id,first,true);if(SETS.rv.every((_,j)=>S.rv&&S.rv[j]&&S.rv[j].s)){const R=RL();R.days=R.days||[];const d=new Date().toISOString().slice(0,10);if(!R.days.includes(d))R.days.push(d);R.lv=R.lv||{};SETS.rv.forEach(q=>{R.lv[q._id.split(':')[0]]=1});RS(R)}}
  else if(SETS[k][i].kind!=='worked')sched(k+':'+i,true,false)}
const st=(k,i)=>{S[k]=S[k]||{};S[k][i]=S[k][i]||{};return S[k][i]};
function solved(k){const P=SETS[k];return!!P&&P.every((_,i)=>S[k]&&S[k][i]&&S[k][i].s)}
function stats(k){const P=SETS[k]||[];let s=0,solo=0,nohint=0,n=0;P.forEach((p,i)=>{if(p.kind==='worked')return;n++;const x=S[k]&&S[k][i];if(x&&x.s){s++;if(!x.h)nohint++;if(!x.h&&x.f)solo++}});return{s,solo,nohint,n}}
function mount(el){const k=el.dataset.book,P=SETS[k];if(!P)return;el.dataset.on='1';if(cur[k]==null){const f=P.findIndex((_,i)=>!(S[k]&&S[k][i]&&S[k][i].s));cur[k]=f<0?0:f}draw(el)}
function draw(el){const k=el.dataset.book,P=SETS[k],i=cur[k],p=P[i],x=st(k,i);
  const dots=P.map((_,j)=>`<button type="button" class="${j===i?'on ':''}${S[k]&&S[k][j]&&S[k][j].s?'ok':''}" data-j="${j}" aria-label="${T('Problem {0}',j+1)}"${j===i?' aria-current="step"':''}></button>`).join('');
  const given=p.given&&p.given.length?`<p class="bk-g"><b>${T('Given')}:</b> ${p.given.join(', ')}</p>`:'',find=p.find?`<p class="bk-g"><b>${T('Find')}:</b> ${p.find}</p>`:'';
  let body='';
  if(p.kind==='worked')body=`<ol class="bk-s">${p.steps.map(s=>`<li>${s}</li>`).join('')}</ol>`+(x.s?`<p class="bk-fb ok"><span class="v">${T('Read through.')}</span> ${p.sol||''}</p>`:`<button type="button" class="bk-btn" data-act="got">${T('Got it')}</button>`);
  else{const fill=p.kind==='fill'&&p.steps?`<ol class="bk-s">${p.steps.map(s=>`<li>${s}</li>`).join('')}</ol>`:'';
    const inp=p.choices?`<div class="bk-ch" role="group" aria-label="${T('Answers')}">${p.choices.map((c,j)=>`<button type="button" data-c="${j}"${x.s?' disabled':''} class="${x.s&&j===p.a?'right':x.last===j&&!x.s?'no':''}">${x.s&&j===p.a?'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="#59f3a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> ':''}${c}</button>`).join('')}</div>`
      :`<div class="bk-row"><label class="bk-fld"><input inputmode="decimal" autocomplete="off" aria-label="${T('Your answer')}" placeholder="${T('Your answer')}"${x.s?` value="${x.val||''}" readonly`:''}><span class="u">${p.suffix||(window.UNITS?UNITS.sym(p.unit,p.e||0):'')}</span></label>${x.s?'':`<button type="button" class="bk-btn" data-act="check">${T('Check')}</button>`}</div>`;
    const hints=(p.hints||[]).slice(0,x.h||0).map((h,j)=>`<p class="bk-h"><b>${T('Hint {0}',j+1)}.</b> ${h}</p>`).join('');
    const more=!x.s&&p.hints&&(x.h||0)<p.hints.length?`<button type="button" class="bk-ln" data-act="hint">${(x.h||0)?T('Another hint'):T('A hint')}</button>`:'';
    body=fill+inp+hints+`<p class="bk-fb${x.s?' ok':''}" aria-live="polite">${x.s?`<span class="v">${T('Right.')}</span> ${p.sol||''}`:x.msg?`<span class="v">${T('Not yet.')}</span> ${x.msg}`:''}</p>`+more}
  const nav=`<div class="bk-nav">${i>0?`<button type="button" class="bk-ln" data-go="-1">${T('← Previous')}</button>`:'<span></span>'}${i<P.length-1?`<button type="button" class="bk-ln" data-go="1">${T('Next problem →')}</button>`:''}</div>`;
  el.innerHTML=`<div class="bk-top"><p class="bk-k">${T('Problem {0} of {1}',i+1,P.length)} · <span>${T(KIND[p.kind]||'')}</span></p><div class="bk-dots">${dots}</div></div><p class="bk-q">${p.q}</p>${given}${find}${body}${nav}`;
  el.querySelectorAll('.bk-dots button').forEach(b=>b.onclick=()=>{cur[k]=+b.dataset.j;draw(el)});
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{cur[k]+=+b.dataset.go;draw(el);el.querySelector('.bk-q').focus&&el.scrollIntoView({block:'nearest'})});
  const g=el.querySelector('[data-act=got]');if(g)g.onclick=()=>{x.s=1;x.f=1;save();changed(el)};
  const h=el.querySelector('[data-act=hint]');if(h)h.onclick=()=>{x.h=(x.h||0)+1;save();draw(el);const l=el.querySelectorAll('.bk-h');l.length&&l[l.length-1].setAttribute('tabindex','-1')};
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const j=+b.dataset.c;x.t=(x.t||0)+1;x.last=j;if(j===p.a){x.s=1;x.f=x.t===1?1:0;solvedHook(k,i,x.f===1)}else{x.msg=p.no&&p.no[j]?p.no[j]:T('Not that one. Work it through, then pick again.');miss(k,i)}save();changed(el)});
  const c=el.querySelector('[data-act=check]'),inpEl=el.querySelector('.bk-fld input');
  if(c){const go=()=>{const v=inpEl.value;const r=UNITS.grade(v,{ans:p.ans,unit:p.unit,e:p.e||0,tol:p.tol,lo:p.lo,hi:p.hi,traps:p.traps,off:p.off});
      if(r.kind==='empty'||r.kind==='unread'||r.kind==='unit'){x.msg=r.msg;draw(el);el.querySelector('.bk-fld input').focus();return}
      x.t=(x.t||0)+1;if(r.ok){x.s=1;x.f=x.t===1?1:0;x.val=v;x.msg='';solvedHook(k,i,x.f===1)}else{x.msg=r.msg;miss(k,i)}save();changed(el);const n=el.querySelector('.bk-fld input:not([readonly])');if(n){n.value=v;n.select()}};
    c.onclick=go;inpEl.onkeydown=e=>{if(e.key==='Enter')go()}}}
function changed(el){draw(el);const k=el.dataset.book;if(k==='rv'&&SETS.rv.every((_,j)=>S.rv&&S.rv[j]&&S.rv[j].s)){const n=nextDue(),d=n?Math.max(1,Math.round((n-Date.now())/DAY)):0;const p=document.createElement('p');p.className='bk-fb ok';p.innerHTML=`<span class="v">${T('Review done.')}</span> `+(n?T('The next one is due in {0} d.',d):'');el.querySelector('.bk-nav').before(p)}if(BOOK.onchange)try{BOOK.onchange()}catch(_){}}
new MutationObserver(()=>{document.querySelectorAll('.book[data-book]:not([data-on])').forEach(mount)}).observe(document.documentElement,{childList:true,subtree:true});
const css=`.book{display:flex;flex-direction:column;gap:10px;margin:4px 0 0}
.bk-top{display:flex;flex-direction:column;gap:8px}
.book .bk-k{margin:0!important;font:600 13px/1.3 Manrope,sans-serif;color:#8f9bc4}.bk-k span{color:#ffb26b}
.bk-dots{display:flex;gap:4px}.book .bk-dots button{flex:1;min-height:0!important;max-height:24px!important;height:24px;padding:0!important;border:0!important;border-radius:0!important;cursor:pointer;background:linear-gradient(#1d2752,#1d2752) center/100% 3px no-repeat!important}
.bk-dots button.ok{background-image:linear-gradient(#4b5fc8,#4b5fc8)!important}.bk-dots button.on{background-image:linear-gradient(90deg,#5b9cff,#8a6bff)!important}
.book .bk-q{margin:4px 0 0!important;font:600 16px/1.5 Manrope,sans-serif;color:#eef1ff}
.book .bk-g{margin:0!important;font-size:15px;line-height:1.5;color:#c9d2f5;font-variant-numeric:tabular-nums}.bk-g b{color:#8f9bc4;font-weight:600}
.bk-s{margin:2px 0 0;padding-left:22px;display:grid;gap:4px;font-size:15px;line-height:1.5;color:#c9d2f5;font-variant-numeric:tabular-nums}.bk-s li::marker{color:#8f9bc4}
.bk-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.bk-fld{display:flex;align-items:center;flex:1 1 160px;min-height:44px;border-radius:12px;border:1px solid rgba(140,160,255,.3);background:rgba(5,8,23,.6);padding:0 12px}
.bk-fld:focus-within{border-color:#8a9bff;box-shadow:0 0 0 3px rgba(138,155,255,.25)}
.bk-fld input{flex:1;min-width:0;border:0!important;background:none!important;color:#eef1ff;font:700 16px/1 Manrope,sans-serif!important;outline:none;padding:10px 0!important;min-height:0!important;font-variant-numeric:tabular-nums}
.bk-fld input::placeholder{color:#8f9bc4;font-weight:500}
.bk-fld .u{font:600 15px/1 Manrope,sans-serif;color:#ffb26b;white-space:nowrap}
.bk-btn{min-height:44px;padding:0 20px;border-radius:999px;border:0;background:#eef1ff;color:#0a1030;font:700 15px/1 Manrope,sans-serif;cursor:pointer;align-self:flex-start}.bk-btn:hover{background:#fff}
.bk-ch{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.bk-ch button{min-height:44px;padding:10px 16px;border-radius:999px;border:1px solid rgba(91,156,255,.22);background:rgba(91,156,255,.06);color:#dfe4fb;font:600 15px/1.3 Manrope,sans-serif;cursor:pointer;text-align:left}
.bk-ch button:hover:not(:disabled){background:rgba(91,156,255,.14)}.bk-ch button.right{opacity:1!important;border-color:rgba(140,160,255,.35)!important;background:rgba(91,156,255,.1)!important;color:#eef1ff!important}.bk-ch button.no{border-color:#ffb26b}.bk-ch button:disabled:not(.right){opacity:.55;cursor:default}
.bk-fb{position:relative;margin:0;padding-left:22px;font-size:15px;line-height:1.55;color:#c9d2f5}.bk-fb:empty{display:none}
.bk-fb .v{font-weight:700;color:#eef1ff}.bk-fb .v::before{content:'';position:absolute;left:2px;top:.5em;width:10px;height:10px;border-radius:50%;background:#ffb26b;box-shadow:0 0 0 4px rgba(255,178,107,.15)}.bk-fb.ok .v::before{background:#59f3a8;box-shadow:0 0 0 4px rgba(89,243,168,.15)}
.bk-h{margin:0;font-size:15px;line-height:1.55;color:#c9d2f5}.bk-h b{color:#8a9bff}
.bk-ln{appearance:none;border:0;background:none;padding:0;min-height:44px;font:600 15px/1.3 Manrope,sans-serif;color:#8a9bff;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(138,155,255,.4);align-self:flex-start}.bk-ln:hover{color:#b7c2ff}
.bk-nav{display:flex;justify-content:space-between;gap:12px;margin-top:2px;padding-top:8px;border-top:1px solid rgba(140,160,255,.1)}`;
const e=document.createElement('style');e.textContent=css;document.head.appendChild(e);
const TX=['q','find','sol','suffix'],TA=['given','steps','hints','choices'];
function tr(p){if(!window.I18N)return p;const t=I18N.t,o=Object.assign({},p);TX.forEach(f=>{if(o[f]!=null)o[f]=t(o[f])});TA.forEach(f=>{if(o[f])o[f]=o[f].map(x=>t(x))});
  if(o.no){const n={};for(const i in o.no)n[i]=t(o.no[i]);o.no=n}if(o.traps)o.traps=o.traps.map(x=>Object.assign({},x,{msg:x.msg}));return o}
window.BOOK={set(k,p){SETS[k]=p.map(tr)},due,nextDue,review,reviews:RL,solved,stats,onchange:null,state:()=>S};
})();
