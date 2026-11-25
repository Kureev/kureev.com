/* Pedagogy layer for the course lessons.
   Merrill's first principles: a real problem up front (brief), activation (warm-up recall),
   predict → observe → explain before each key experiment, worked example → faded practice
   (in the lesson content), and integration at the end (mixed retrieval + "I can" self-check).
   Data comes from PED.init(lessonKey, {brief, pr, recall, end}). State lives in localStorage. */
(function(){
const KEY='ped_v1';let L='',D={},st={};
const T=function(s){if(window.I18N)return I18N.t.apply(null,arguments);const a=arguments;return String(s).replace(/\{(\d+)\}/g,(m,i)=>a[+i+1])};
const load=()=>{try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){st={}}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(_){}};
const g=k=>st[L+':'+k],s=(k,v)=>{if(v==null)delete st[L+':'+k];else st[L+':'+k]=v;save()};
const again=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='pq-again';b.textContent=label;b.onclick=fn;return b};
const esc=t=>String(t);
let box,ctl,note,cur=-1,doneShown={},seg=null,briefBox,parts=[],busy=false,fresh=-1,primed=false;
const MED=(k,on)=>window.ACH?ACH.med(k,on):'';
const ICK='<svg class="pq-i" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',IX='<svg class="pq-i" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
/* the side panel as standalone blocks, one per intention: where am I · think · try · do · read more */
function layout(){const step=document.querySelector('.panel .step');if(!step)return;
  if(!seg){seg={};['orient','think','try','goal','more'].forEach(k=>{const d=document.createElement('div');d.className='seg seg-'+k;seg[k]=d});
    const ph=document.querySelector('.panel .ph');step.prepend(seg.orient,seg.think,seg.try,seg.goal,seg.more);
    [ph,step.querySelector('.prog'),document.getElementById('stepT'),document.getElementById('stepS')].forEach(e=>e&&seg.orient.appendChild(e));
    briefBox=document.createElement('div');briefBox.className='ped-briefbox';seg.orient.appendChild(briefBox)}
  [ctl,note,step.querySelector('.side')].forEach(e=>e&&e.parentNode!==seg.try&&seg.try.appendChild(e));
  ['task','stepX','after'].forEach(id=>{const e=document.getElementById(id);if(e&&e.parentNode!==seg.goal)seg.goal.appendChild(e)});
  const m=document.getElementById('more');if(m&&m.parentNode!==seg.more)seg.more.appendChild(m);
}
/* collapse button rows and blocks with nothing visible this step; re-run whenever the lesson changes the panel */
function tidy(){if(!seg)return;
  const shown=c=>!c.hidden&&getComputedStyle(c).display!=='none';
  if(ctl)ctl.querySelectorAll('.row').forEach(r=>{const v=[...r.children].some(shown),want=v?'':'none';if(r.style.display!==want)r.style.display=want});
  const sd=seg.try.querySelector('.side');if(sd){const v=[...sd.children].some(c=>shown(c)&&c.textContent.trim()),want=v?'':'none';if(sd.style.display!==want)sd.style.display=want;const kids=[...seg.try.children],lead=!kids.slice(0,kids.indexOf(sd)).some(c=>shown(c)&&c.offsetHeight>0);if(sd.classList.contains('lead')!==lead)sd.classList.toggle('lead',lead)}
  Object.values(seg).forEach(d=>{const v=[...d.children].some(c=>shown(c)&&c.offsetHeight>0);if(d.classList.contains('empty')===v)d.classList.toggle('empty',!v)})}
let tq=0;const queue=()=>{if(tq)return;tq=requestAnimationFrame(()=>{tq=0;layout();tidy();syncNext()})};

function chips(id,q,opts,ans,picked,onPick){
  const w=document.createElement('div');w.className='pq';
  w.innerHTML=`<p class="pq-q" id="${id}q">${esc(q)}</p><div class="pq-o" role="group" aria-labelledby="${id}q" aria-label="${esc(q).replace(/<[^>]+>/g,'').replace(/"/g,'')}">`+
    opts.map((o,i)=>`<button type="button" data-i="${i}" aria-pressed="${picked===i}" class="${picked==null?'':i===picked?(ans==null?'pick':i===ans?'pick yes':'pick no'):(ans!=null&&picked!=null&&i===ans?'right':'')}" ${picked!=null?'disabled':''}>${ans!=null&&picked!=null?(i===ans?ICK:i===picked?IX:''):''}${esc(o)}</button>`).join('')+'</div>';
  w.querySelectorAll('button').forEach(b=>b.onclick=()=>onPick(+b.dataset.i));return w}

function render(step){
  if(!box)return;cur=step;box.innerHTML='';layout();if(briefBox)briefBox.innerHTML='';
  const pr=D.pr&&D.pr[step],rc=D.recall&&D.recall[step],br=step===0&&D.brief,end=D.end&&D.end.step===step;
  if(br){const c=document.createElement('details');c.className='ped brief';
    c.innerHTML=`<summary><span class="brief-s">${D.brief.short}</span><span class="brief-t">${T('Goals')}</span></summary><p class="brief-p">${D.brief.problem}</p><ul>${D.brief.goals.map(x=>`<li>${x}</li>`).join('')}</ul>`;(briefBox||box).appendChild(c)}
  const quiz=(items,key,title,note)=>{const c=document.createElement('section');c.className='ped recall';
    const n=items.filter((_,i)=>g(key+i)!=null).length,ok=items.filter((q,i)=>g(key+i)===q.a).length;
    c.innerHTML=`<p class="ped-k">${title}<span>${n===items.length?ok+' / '+items.length:note}</span></p>`;
    /* one question at a time: answered ones shrink to a line, the next waits its turn */
    const u=items.findIndex((_,i)=>g(key+i)==null);
    items.forEach((q,i)=>{const p=g(key+i);
      if(p!=null){const d=document.createElement('p');d.className='pq-done'+(p===q.a?' ok':'');
        d.innerHTML=`<span>${q.q}</span> <b>${p===q.a?q.o[q.a]:T('“{0}”, not right',q.o[p]).replace(/, not right$/,',\u00a0not\u00a0right').replace(/— неверно$/,'—\u00a0неверно')}</b>`+(p!==q.a?'':(i===u-1||u<0&&i===items.length-1)&&q.ex?`<em>${q.ex}</em>`:'');
        if(p!==q.a)d.appendChild(again(T('Try again'),()=>{s(key+i,null);render(cur)}));c.appendChild(d);return}
      if(i===u)c.appendChild(chips(key+i,q.q,q.o,q.a,null,v=>{s(key+i,v);if(g('F'+key+i)==null)s('F'+key+i,v);render(cur);check()}))});
    c.querySelector('.ped-k span').textContent=u<0?T('{0} / {1} right',ok,items.length):T('{0} of {1}',u+1,items.length);
    if(u<0){const r=again(T('Start over'),()=>{items.forEach((_,i)=>s(key+i,null));render(cur)});r.classList.add('k');c.querySelector('.ped-k').appendChild(r)}
    box.appendChild(c)};
  const warm=rc&&rc.some((_,i)=>g('r'+step+'_'+i)==null);
  if(rc)quiz(rc,'r'+step+'_',T('Warm-up from memory'),T('No peeking'));
  if(pr&&!warm)box.appendChild(predSec(step));
  if(end){const t=document.getElementById('stepX')||document.getElementById('task');t.insertAdjacentElement('afterend',box);quiz(D.end.items,'e_',T('Check yourself'),T('Mixed, from the whole level'));
    const c=document.createElement('section');c.className='ped cando';
    c.innerHTML=`<p class="ped-k">${T('I can')}</p>`+D.brief.goals.map((x,i)=>`<label><input type="checkbox" data-i="${i}" ${g('c'+i)?'checked':''}> ${x}</label>`).join('');
    c.querySelectorAll('input').forEach(b=>b.onchange=()=>s('c'+b.dataset.i,b.checked));box.appendChild(c)}
  if(!end){if(seg&&box.parentNode!==seg.think)seg.think.appendChild(box);else if(!seg){const lead=document.getElementById('stepS');if(box.previousElementSibling!==lead)lead.insertAdjacentElement('afterend',box)}}
  if(seg)queue();setTimeout(syncNext,0);
  const lock=!!(pr&&g('p'+step)==null);if(ctl){ctl.classList.toggle('ped-lock',lock);ctl.inert=lock;if(lock)ctl.setAttribute('aria-disabled','true');else ctl.removeAttribute('aria-disabled');note.hidden=!lock||!!warm;if(lock&&warm)note.hidden=false,note.textContent=T('Warm up, then make a prediction');else note.textContent=T('Pick a prediction first')}
  doneShown[step]=false;
  const tk=document.getElementById('task');if(tk&&tk.classList.contains('ok'))after(true);
}
/* the prediction block: pick → try it → a clear verdict, scored once per prediction (the first reveal counts) */
function predSec(step){const pr=D.pr[step],p=g('p'+step),rev=p!=null&&doneShown[step],hit=p===pr.a;
  const c=document.createElement('section');c.className='ped predict'+(rev?(hit?' hit':' miss'):'')+(rev&&fresh===step?' fresh':'');c.id='pedPr';
  const sc=score();
  c.innerHTML=`<p class="ped-k">${p==null?T('Predict first'):rev?`<span class="pv">${hit?T('Intuition on target'):T('Intuition missed')}</span>`:T('Your prediction')}<span class="pq-sc">${rev&&hit&&fresh===step?'<i class="pq-plus" aria-hidden="true">+1</i>':''}${sc.n?T('{0} of {1} on target',sc.h,sc.n)+(st.streak>1?T(' · streak {0}',st.streak):''):''}</span></p>`;
  c.appendChild(chips('p'+step,pr.q,pr.o,rev?pr.a:null,p,v=>{s('p'+step,v);render(cur)}));
  if(p!=null){const f=document.createElement('p');f.className='pq-f'+(rev&&hit?' ok':'');f.id='pedEx';
    f.innerHTML=rev?'<b class="wh">'+(hit?T('Your prediction held.'):T('What happened: {0}.',pr.o[pr.a]))+'</b> '+pr.ex:T('Now try it and see.');c.appendChild(f);
    const r=again(T('Change'),()=>{s('p'+step,null);doneShown[step]=false;render(cur)});if(rev){r.classList.add('pq-ch');f.append(' ');f.appendChild(r)}else{r.classList.add('k');c.querySelector('.ped-k .pq-sc').insertAdjacentElement('beforebegin',r)}}
  if(fresh===step)fresh=-1;return c}
function score(){let h=0,n=0;Object.keys(D.pr||{}).forEach(k=>{const v=g('v'+k);if(v!=null){n++;h+=v}});return{h,n}}
function ready(step){const pr=D.pr&&D.pr[step];return!pr||g('p'+step)!=null}
function after(ok){if(busy)return;const pr=D.pr&&D.pr[cur];if(!pr||!ok||doneShown[cur])return;const p=g('p'+cur);if(p==null)return;
  const old=document.getElementById('pedPr');if(!old)return;doneShown[cur]=true;
  if(g('v'+cur)==null){const hit=p===pr.a?1:0;s('v'+cur,hit);st.streak=hit?(st.streak||0)+1:0;st.streakMax=Math.max(st.streakMax||0,st.streak);save();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)fresh=cur}
  old.replaceWith(predSec(cur));queue();check()}
function wrap(fn,step){return function(){busy=true;try{fn.apply(this,arguments)}finally{busy=false}render(step())}}

/* achievements: one per cleared stage, plus intuition, memory, a clean check, the level, and a streak across the course */
function stages(){const out=[];parts.forEach((n,i)=>{const l=out[out.length-1];if(l&&l.n===n)l.s.push(i);else out.push({n,s:[i]})});return out.slice(0,-1)}
function quest(){try{return JSON.parse(localStorage.getItem('quest_v1')||'{}')}catch(_){return{}}}
const allFirst=(items,key)=>items.length&&items.every((q,i)=>g('F'+key+i)===q.a);
function achList(){const lv=D.win?D.win.lv:0,q=quest(),done=new Set(((q.steps||{})[lv])||[]),A=[];
  stages().forEach((x,k)=>A.push({id:'s'+k,kind:'stage',en:'Stage: '+x.n,d:'Every step of this stage is done.',ok:x.s.every(i=>done.has(i))}));
  const pk=Object.keys(D.pr||{});if(pk.length)A.push({id:'int',kind:'intuition',en:'Sharp intuition',d:'Every prediction on this level right the first time.',ok:pk.every(k=>g('v'+k)===1)});
  const rc=[];Object.keys(D.recall||{}).forEach(k=>D.recall[k].forEach((q,i)=>rc.push([q,'r'+k+'_'+i])));
  if(rc.length)A.push({id:'mem',kind:'memory',en:'Good memory',d:'Every warm-up answer right on the first try.',ok:rc.every(([q,k])=>g('F'+k)===q.a)});
  if(D.end)A.push({id:'chk',kind:'check',en:'Clean check',d:'The end check without a single mistake.',ok:allFirst(D.end.items,'e_')});
  A.push({id:'lv',kind:'level',en:'Level complete',d:'Every task on this level done.',ok:!!(q.done||{})[lv]});
  const got=new Set(g('ach')||[]);A.forEach(a=>{a.got=got.has(a.id)||a.ok});return A}
function check(silent){if(!D.win)return;const A=achList(),had=new Set(g('ach')||[]),fresh=A.filter(a=>a.got&&!had.has(a.id));
  const cs=st['ach:course']||[];let fc=[];if((st.streakMax||0)>=5&&!cs.includes('streak5')){cs.push('streak5');st['ach:course']=cs;fc.push({id:'streak5',kind:'streak',en:'Five in a row',d:'Five predictions in a row right.'})}
  if(fresh.length||fc.length){s('ach',A.filter(a=>a.got).map(a=>a.id));if(!silent&&primed)fresh.concat(fc).filter(a=>a.kind!=='level').forEach(toast)}
  /* a summary for the map */
  try{const S=JSON.parse(localStorage.getItem('ach_v1')||'{}'),sc=score();S[L]={lv:D.win.lv,list:A.map(a=>({kind:a.kind,en:a.en,d:a.d,got:a.got})),h:sc.h,n:sc.n};S.course=[{kind:'streak',en:'Five in a row',d:'Five predictions in a row right.',got:cs.includes('streak5')}];localStorage.setItem('ach_v1',JSON.stringify(S))}catch(_){}}
let tbox=null,tq2=[],tbusy=false;
function toast(a){tq2.push(a);if(!tbusy)nextToast()}
function nextToast(){const a=tq2.shift();if(!a){tbusy=false;return}tbusy=true;
  if(!tbox){tbox=document.createElement('div');tbox.className='ped-toast';tbox.setAttribute('role','status');tbox.setAttribute('aria-live','polite');document.body.appendChild(tbox);if(tbox.showPopover)tbox.popover='manual'}
  tbox.style.left=innerWidth>900?Math.round((innerWidth-(window.PW?PW():0))/2)+'px':'50%';
  tbox.innerHTML=`<div class="pt-c">${MED(a.kind,true)}<span class="pt-t"><span class="pt-k">${T('Achievement')}</span><b>${T(a.en)}</b><span class="pt-d">${T(a.d)}</span></span></div>`;
  if(tbox.showPopover){try{tbox.hidePopover()}catch(_){}try{tbox.showPopover()}catch(_){}}
  tbox.classList.remove('on');void tbox.offsetWidth;tbox.classList.add('on');
  setTimeout(()=>{tbox.classList.remove('on');setTimeout(nextToast,400)},4200)}

/* finishing a level: confetti in the course palette and a dialog that says what you can do now */
let fin=false;
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('canvas');c.className='ped-confetti';c.setAttribute('aria-hidden','true');document.body.appendChild(c);
  /* above the modal: open it as a popover so it joins the top layer after the dialog */
  if(c.showPopover){c.popover='manual';try{c.showPopover()}catch(_){}}
  const x=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.scale(dpr,dpr);
  const col=['#5b9cff','#8a6bff','#ffb26b','#eef1ff','#9fe8c4','#7d8cff'],P=[];
  const burst=(ox,oy,ang,n,sp)=>{for(let i=0;i<n;i++){const a=ang+(Math.random()-.5)*1.1,v=sp*(.55+Math.random()*.6);P.push({x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:Math.random()*6.28,vr:(Math.random()-.5)*.35,w:6+Math.random()*7,h:3+Math.random()*5,c:col[i%col.length],t:Math.random()*6.28,round:Math.random()<.25})}};
  burst(0,H*.9,-Math.PI/3,90,19);burst(W,H*.9,-Math.PI*2/3,90,19);setTimeout(()=>{for(let i=0;i<70;i++)P.push({x:Math.random()*W,y:-20-Math.random()*H*.3,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,w:6+Math.random()*7,h:3+Math.random()*5,c:col[i%col.length],t:Math.random()*6.28,round:Math.random()<.25})},250);
  const t0=performance.now();(function f(now){const k=(now-t0)/1000;x.clearRect(0,0,W,H);
    P.forEach(p=>{p.vy+=.32;p.vx*=.985;p.vy*=.985;p.x+=p.vx+Math.sin(p.t+k*3)*.6;p.y+=p.vy;p.r+=p.vr;
      x.save();x.globalAlpha=Math.max(0,Math.min(1,4.2-k));x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;
      if(p.round){x.beginPath();x.arc(0,0,p.h*.7,0,6.28);x.fill()}else{x.scale(1,Math.cos(p.t+k*6));x.fillRect(-p.w/2,-p.h/2,p.w,p.h)}x.restore()});
    if(k<4.4)requestAnimationFrame(f);else c.remove()})(t0)}
function celebrate(){const W=D.win;if(!W)return;let d=document.getElementById('pedWin');
  if(!d){d=document.createElement('dialog');d.id='pedWin';d.className='ped-win';d.setAttribute('aria-labelledby','pedWinT');document.body.appendChild(d);
    d.addEventListener('click',e=>{if(e.target===d)d.close()})}
  const ei=D.end?D.end.items:[],ea=ei.filter((_,i)=>g('e_'+i)!=null).length,eo=ei.filter((q,i)=>g('e_'+i)===q.a).length;
  const nx=W.next?(W.next.soon?`<p class="pw-next">${T('Next up: <b>{0}</b>, in the works.',W.next.t)}</p>`:`<a class="pw-btn ghost" href="${W.next.href}">${T('Next: {0}',W.next.t)}</a>`):'';
  d.innerHTML=`<button class="pw-x" type="button" aria-label="${T('Close')}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    <div class="pw-art"><img src="/electronics/levels/lv${W.lv}.webp" alt="" width="320" height="320"></div>
    <p class="pw-k">${T('Level {0} complete',W.lv)}</p><h2 id="pedWinT">${W.title}</h2><p class="pw-l">${W.line}</p>
    <ul class="pw-g">${D.brief.goals.map(x=>`<li>${x}</li>`).join('')}</ul>
    ${achStrip()}
    ${ea?`<p class="pw-s">${T('Check yourself: <b>{0} of {1}</b> right',eo,ei.length)}${eo<ei.length?T(' · worth another look'):''}</p>`:''}
    <div class="pw-a"><a class="pw-btn" href="/electronics">${T('Back to the map')}</a>${nx}</div>`;
  d.querySelector('.pw-x').onclick=()=>d.close();
  if(!d.open)d.showModal();d.tabIndex=-1;d.focus();confetti()}
function achStrip(){if(!window.ACH)return'';const A=achList(),n=A.filter(a=>a.got).length;
  return `<div class="pw-ach"><p class="pw-ak">${T('Achievements: {0} of {1}',n,A.length)}</p><ul class="pw-row">${A.map(a=>`<li class="${a.got?'':'off'}" title="${T(a.en).replace(/"/g,'')}">${MED(a.kind,a.got)}<span class="sr">${T(a.en)}${a.got?'':' · '+T('not yet')}</span></li>`).join('')}</ul><p class="pw-an">${T('All achievements are on the map.')}</p></div>`}
function complete(ok,was){fin=ok;check(!primed);primed=true;if(ok&&!was)setTimeout(celebrate,350)}
document.addEventListener('click',e=>{const n=e.target.closest&&e.target.closest('#next');if(n&&n.dataset.fin==='1'){e.preventDefault();e.stopImmediatePropagation();celebrate()}},true);
function syncNext(){const n=document.getElementById('next'),sc=document.getElementById('stepC');if(!n||!sc)return;const m=sc.textContent.match(/(\d+)\s*\/\s*(\d+)/),last=!!m&&m[1]===m[2];
  if(fin&&last){if(n.dataset.fin!=='1'||n.disabled){n.dataset.fin='1';n.disabled=false;n.textContent=T('Finish')}}else if(n.dataset.fin==='1'){delete n.dataset.fin;n.textContent=T('Next')}}
window.PW=()=>{if(innerWidth<=900)return 0;const p=document.querySelector('.panel');return p?p.offsetWidth+12:0};
window.PED={init(k,data){L=k;D=window.I18N?I18N.deep(data):data;load();try{fin=!!(D.win&&(JSON.parse(localStorage.getItem('quest_v1')||'{}').done||{})[D.win.lv])}catch(_){}
  const mount=()=>{const lead=document.getElementById('stepS');ctl=document.querySelector('.card.ctl');
    box=document.createElement('div');box.id='ped';lead.insertAdjacentElement('afterend',box);note=document.createElement('p');note.className='ped-note';note.hidden=true;ctl.insertAdjacentElement('afterend',note);
    const pv=document.getElementById('prev');if(pv)pv.innerHTML='<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 4L6 9l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const pn=document.querySelector('.panel');if(pn&&window.MutationObserver)new MutationObserver(queue).observe(pn,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});queue()};
  if(document.getElementById('stepS'))mount();else document.addEventListener('DOMContentLoaded',mount)},
  render,ready,after,wrap,complete(ok,was){complete(ok,was);syncNext()},celebrate,parts(p){parts=p||[]}};
const css=`#ped{display:flex;flex-direction:column;gap:14px;margin:4px 0 16px}
#ped:empty{display:none}
.panel{background:#040716;border-left:0!important;padding:12px 12px 0!important;gap:0}
.panel .step{display:flex!important;flex-direction:column;gap:10px;padding:0!important;margin:0!important;background:none!important;border:0!important}
.seg{background:rgba(10,15,40,.84);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);pointer-events:auto;border:1px solid rgba(140,160,255,.13);border-radius:16px;padding:16px 18px;box-shadow:0 1px 0 rgba(140,160,255,.06) inset}
.seg.empty{height:0;padding:0;border:0;margin-top:-10px;overflow:hidden}
.seg>*:last-child{margin-bottom:0!important}
.seg-orient .ph{padding:0!important;margin:0 0 14px}
.seg-orient #stepS{margin-bottom:0}
.ped-briefbox:empty{display:none}.ped-briefbox{margin-top:12px;padding-top:12px;border-top:1px solid rgba(140,160,255,.1)}
.seg-think #ped{margin:0;gap:0}
.seg-think .ped.recall,.seg-think .ped.predict{background:none;padding:0;border-radius:0}
.seg-think .ped+.ped{margin-top:14px;padding-top:14px;border-top:1px solid rgba(140,160,255,.1)}
.seg-try .card.ctl{margin:0!important;padding:0!important;border:0!important;background:none!important}
.seg-try .side{margin:6px 0 0!important;padding-top:12px;border-top:1px solid rgba(140,160,255,.1)}
.seg-try .side:empty{display:none}.seg-try .side.lead{border-top:0;padding-top:0;margin-top:0!important}
.seg-try .ped-note{margin:10px 0 0}
.seg-goal .task{margin:0;background:none!important;border:0!important;padding:0!important}.seg-goal .after:not([hidden]),.seg-goal .stepx:not(:empty){margin-top:14px}
.seg-goal #ped{margin:14px 0 0}
.seg-more{padding:4px 18px}.seg-more .more{margin:0!important;border:0!important;padding:10px 0!important}
.panel .nav{margin:auto -12px 0!important;padding:12px!important;background:linear-gradient(180deg,rgba(4,7,22,0),#040716 35%)!important;border-top:0!important}
.ped{padding:0}
.ped.recall,.ped.predict{padding:14px 16px;border-radius:12px;background:rgba(91,156,255,.05)}
.ped-k{display:flex;align-items:baseline;gap:12px;margin:0 0 8px;font:600 13px/1.3 Manrope,sans-serif;color:#8f9bc4}
.ped-k>span{margin-left:auto;font-weight:500;color:#8f9bc4;font-variant-numeric:tabular-nums}
.ped.brief{padding:0}
.ped.brief summary{display:flex;gap:12px;align-items:baseline;cursor:pointer;list-style:none;font-size:15px;line-height:1.5;color:#a9b3da}
.ped.brief summary::-webkit-details-marker{display:none}
.brief-s{flex:1}.brief-t{flex:none;font-size:13px;font-weight:600;color:#8a9bff}.brief-t::after{content:' +'}.ped.brief[open] .brief-t::after{content:' –'}
.ped.brief .brief-p{margin:10px 0 10px;color:#c9d2f5;font-size:15px;line-height:1.5}
.ped.brief ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.ped.brief li{position:relative;padding-left:16px;font-size:15px;line-height:1.45;color:#c9d2f5}
.ped.brief li::before{content:'';position:absolute;left:2px;top:.55em;width:5px;height:5px;border-radius:50%;background:#7d8cff}
.pq-again{appearance:none;border:0;background:none;padding:0 0 0 10px;font:600 13px/1.3 Manrope,sans-serif;color:#8a9bff;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(138,155,255,.4)}
.pq-done .pq-again{display:block;padding:0;margin:3px 0 0}.pq-again:hover{color:#b7c2ff}.pq-again.k{padding:0;margin-left:0}
.pq-again{position:relative}.pq-again::after{content:'';position:absolute;inset:-13px -6px}
.pq-done{margin:0 0 12px;font-size:13px;line-height:1.45;color:#8f9bc4}.pq-done b{font-weight:600;color:#ffb08a}.pq-done.ok b{color:#9fe8c4}.pq-done em{display:block;font-style:normal;color:#a3acd0;margin-top:2px}
.pq-q{margin:0 0 8px;font-size:15px;line-height:1.45;color:#eef1ff;font-weight:600}
.pq-o{display:flex;flex-wrap:wrap;gap:6px}
.pq-o button{min-height:36px;padding:6px 14px;border-radius:999px;font:600 14px/1.25 Manrope,sans-serif;color:#dfe4fb;background:rgba(91,156,255,.06);border:1px solid rgba(91,156,255,.22);cursor:pointer;text-align:left;transition:background .2s,border-color .2s}
.pq-o button:hover:not(:disabled){background:rgba(91,156,255,.14)}
.pq-o button:disabled{cursor:default;opacity:.5}
.pq-o button.pick{opacity:1;border-color:#8a9bff;background:rgba(91,156,255,.18);color:#fff}
.pq-o button.pick.yes,.pq-o button.right{opacity:1;border-color:#59f3a8;background:rgba(89,243,168,.1);color:#eef1ff}
.pq-o button.right{border-style:dashed;background:none}
.pq-o button.pick.no{opacity:1;border-color:#ffb26b;background:rgba(255,178,107,.1);color:#eef1ff}
.pq-o button{display:inline-flex;align-items:flex-start;gap:6px}.pq-i{flex:none;margin:3px 0 0 -3px}.pick.yes .pq-i,.right .pq-i{color:#59f3a8}.pick.no .pq-i{color:#ffb26b}
.ped-k>.pv{margin-left:0;display:inline-flex;align-items:center;gap:9px;font:700 16px/1.3 Manrope,sans-serif!important;color:#9fe8c4!important}.miss .ped-k>.pv{color:#ffc58f!important}.ped-k .pq-sc{white-space:nowrap}.ped-k:has(.pv){align-items:center;margin-bottom:12px}.pv::before{content:'';flex:none;width:10px;height:10px;border-radius:50%;background:#59f3a8;box-shadow:0 0 0 4px rgba(89,243,168,.15)}
.miss .pv::before{background:#ffb26b;box-shadow:0 0 0 4px rgba(255,178,107,.15)}
.pq-plus{display:inline-block;margin-right:6px;font:800 13px/1 Manrope,sans-serif;font-style:normal;color:#59f3a8;opacity:0;animation:pq-plus 1.6s ease-out}
@keyframes pq-plus{0%{opacity:0;transform:translateY(6px)}20%,70%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
.fresh .pv{animation:pv-pop .5s cubic-bezier(.3,1.6,.5,1)}@keyframes pv-pop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
.fresh.hit .pick.yes{animation:pq-ring 1s ease-out}@keyframes pq-ring{from{box-shadow:0 0 0 0 rgba(89,243,168,.55)}to{box-shadow:0 0 0 14px rgba(89,243,168,0)}}
.fresh.miss .pick.no{animation:pq-shake .45s}@keyframes pq-shake{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
.pq-f.ok .wh{color:#9fe8c4}.pq-again.pq-ch{display:inline;padding:0;margin:0;min-height:0!important;font-size:inherit!important}
.ped-toast{position:fixed;inset:auto;top:16px;left:50%;margin:0;padding:0;border:0;background:none;overflow:visible;transform:translate(-50%,-16px);opacity:0;pointer-events:none;transition:opacity .35s,transform .45s cubic-bezier(.22,1,.36,1);z-index:1001}
.ped-toast.on{opacity:1;transform:translate(-50%,0)}
.pt-c{display:flex;align-items:center;gap:14px;min-width:260px;max-width:min(420px,calc(100vw - 32px));padding:12px 18px 12px 12px;border-radius:16px;background:rgba(10,15,40,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,178,107,.35);box-shadow:0 18px 50px rgba(0,0,0,.45)}
.pt-c .am{width:48px;height:48px}.pt-c .am svg{width:24px;height:24px}
.pt-t{display:flex;flex-direction:column;gap:2px;text-align:left}.pt-k{font:600 13px/1.3 Manrope,sans-serif;color:#ffb26b}.pt-t b{font:600 15px/1.3 Manrope,sans-serif;color:#eef1ff}.pt-d{font-size:13px;line-height:1.35;color:#a3acd0}
.pw-ach .am{width:36px;height:36px}.pw-ach .am svg{width:18px;height:18px}.ped-win:has(.pw-ach) .pw-art{width:140px;height:140px}.pw-row{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.pw-row li{position:relative}.pw-an{margin:10px 0 0;font-size:13px;color:#8f9bc4}.pw-ach{margin:0 0 18px}.pw-ak{margin:0 0 10px;font:600 13px/1.3 Manrope,sans-serif;color:#ffb26b}.pw-row .sr,.pw-g .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.seg-goal .ped.recall{background:none!important;padding:14px 0 0!important;border-radius:0!important;border-top:1px solid rgba(140,160,255,.1)}
body:has(.ped-toast.on) .tools .hint{opacity:0}.tools .hint{transition:opacity .3s}
#prev svg{display:block;margin:auto}
@media(prefers-reduced-motion:reduce){.ped-toast{transition:none}.pq-plus,.fresh .pv,.fresh .pick{animation:none!important}}
.pq-f{margin:10px 0 0;font-size:14px;line-height:1.5;color:#8f9bc4}
.pq-f .wh{color:#eef1ff;font-weight:600}
.ped.cando label{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:#c9d2f5;padding:5px 0;cursor:pointer}
.ped.cando input,.hw input{appearance:none;-webkit-appearance:none;flex:none;width:18px;height:18px;margin:1px 0 0;border-radius:5px;border:1px solid rgba(143,155,196,.4);background:transparent;cursor:pointer;display:grid;place-items:center}
.ped.cando input:checked,.hw input:checked{border-color:transparent;background:linear-gradient(135deg,#5b9cff,#8a6bff) }
.ped.cando input:checked::after,.hw input:checked::after{content:'';width:8px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:translateY(-1px) rotate(-45deg)}
.card.ctl{transition:opacity .3s}
.card.ctl.ped-lock{opacity:.4;pointer-events:none}
.ped-note{margin:-4px 0 10px;font-size:12px;color:#8f9bc4}

.ped-confetti{position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:1000}
.ped-win:focus,.ped-win:focus-visible{outline:none}
.ped-win{width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;padding:0 28px 28px;border:1px solid rgba(140,160,255,.3);border-radius:22px;background:radial-gradient(120% 70% at 50% 0%,#17235a 0%,#0b1233 55%,#080d26 100%);color:#eef1ff;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(91,156,255,.06) inset;text-align:center}
.ped-win::backdrop{background:rgba(3,5,16,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.ped-win[open]{animation:pw-in .5s cubic-bezier(.22,1,.36,1)}
@keyframes pw-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
.pw-x{position:absolute;top:12px;right:12px;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:12px;background:rgba(140,160,255,.08);color:#c9d2f5;cursor:pointer}
.pw-x:hover{background:rgba(140,160,255,.12);color:#eef1ff}
.pw-art{margin:8px auto 0;width:220px;height:220px;-webkit-mask-image:radial-gradient(closest-side,#000 62%,transparent);mask-image:radial-gradient(closest-side,#000 62%,transparent)}
.pw-art img{width:100%;height:100%;object-fit:cover;display:block}
.pw-k{margin:0 0 6px;font:600 13px/1.3 Manrope,sans-serif;color:#ffb26b}
.ped-win h2{margin:0 0 10px;font:600 28px/1.15 Unbounded,Manrope,sans-serif;letter-spacing:-.015em}
.pw-l{margin:0 auto 18px;max-width:34ch;font-size:16px;line-height:1.55;color:#c9d2f5}
.pw-g{list-style:none;margin:0 0 18px;padding:14px 16px;display:grid;gap:8px;text-align:left;border-radius:14px;background:rgba(91,156,255,.06)}
.pw-g li{position:relative;padding-left:26px;font-size:15px;line-height:1.45;color:#dfe4fb}
.pw-g li::before{content:'';position:absolute;left:0;top:2px;width:16px;height:16px;border-radius:5px;background:linear-gradient(135deg,#5b9cff,#8a6bff)}
.pw-g li::after{content:'';position:absolute;left:5px;top:6px;width:6px;height:3px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg)}
.pw-s{margin:0 0 18px;font-size:15px;color:#a3acd0}.pw-s b{color:#eef1ff}
.pw-next{margin:4px 0 0;font-size:15px;color:#8f9bc4}.pw-next b{color:#c9d2f5}
.pw-a{display:flex;flex-direction:column;gap:10px;align-items:stretch}
.pw-btn{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:999px;font:700 16px/1 Manrope,sans-serif;text-decoration:none;color:#0a1030;background:#eef1ff}
.pw-btn:hover{background:#fff}.pw-btn.ghost{color:#dfe4fb;background:rgba(91,156,255,.08);border:1px solid rgba(91,156,255,.3)}
.pw-btn:focus-visible,.pw-x:focus-visible{outline:2px solid #8a9bff;outline-offset:3px}
@media(prefers-reduced-motion:reduce){.ped-win[open]{animation:none}}
@media(max-width:600px){.ped-win{padding:0 20px 0}.ped-win:has(.pw-ach) .pw-art{width:110px;height:110px}.ped-win h2{font-size:24px}.pw-row{flex-wrap:nowrap;gap:6px}.pw-ach .am{width:34px;height:34px}.pw-a{position:sticky;bottom:0;margin:0 -20px;padding:16px 20px 20px;background:linear-gradient(180deg,rgba(8,13,38,0),#080d26 30%)}}
#dots button{position:relative}#dots button::after{content:'';position:absolute;inset:-14px 0}
@media(prefers-reduced-motion:reduce){.card.ctl{transition:none}}
@media(min-width:901px){
.app{display:block!important;position:relative;height:100%;--pw:calc(clamp(420px,31vw,500px) + 12px)}
.app>.stage{position:absolute!important;inset:0}
.app>.panel{position:absolute!important;z-index:5;top:0;right:12px;bottom:0;width:clamp(420px,31vw,500px);background:none!important;border:0!important;box-shadow:none!important;pointer-events:none;padding:12px 0 0!important;scrollbar-width:none}
.app>.panel::-webkit-scrollbar{display:none}
.app>.panel .step{pointer-events:none}
.app>.panel .nav{pointer-events:auto;margin:auto 0 0!important;padding:28px 0 12px!important;background:linear-gradient(180deg,rgba(5,8,23,0),#050817 42%)!important}
.app>.panel .nav #prev{background:#0a1230!important}
.hud{right:calc(var(--pw) + 12px)!important}.info{right:calc(var(--pw) + 4px)!important}}
.blk table{font-size:13.5px;table-layout:auto}.blk table th,.blk table td{padding:7px 8px 7px 0;vertical-align:top}.blk table td:nth-child(-n+3),.blk table th{white-space:nowrap}
.dots button,.dots button:hover{background:linear-gradient(#1d2752,#1d2752) center/100% 4px no-repeat!important;border-radius:0!important}
.dots button.done{background-image:linear-gradient(#4b5fc8,#4b5fc8)!important}
.dots button.on,.dots button.on.done{background-image:linear-gradient(90deg,#5b9cff,#8a6bff)!important;background-size:100% 4px!important;filter:drop-shadow(0 0 4px rgba(91,156,255,.6))}
.dots button:hover:not(.on){background-image:linear-gradient(#33407a,#33407a)!important}`;
const el=document.createElement('style');el.textContent=css;document.head.appendChild(el);
})();
