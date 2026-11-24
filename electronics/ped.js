/* Pedagogy layer for the course lessons.
   Merrill's first principles: a real problem up front (brief), activation (warm-up recall),
   predict → observe → explain before each key experiment, worked example → faded practice
   (in the lesson content), and integration at the end (mixed retrieval + "I can" self-check).
   Data comes from PED.init(lessonKey, {brief, pr, recall, end}). State lives in localStorage. */
(function(){
const KEY='ped_v1';let L='',D={},st={};
const load=()=>{try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){st={}}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(_){}};
const g=k=>st[L+':'+k],s=(k,v)=>{if(v==null)delete st[L+':'+k];else st[L+':'+k]=v;save()};
const again=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='pq-again';b.textContent=label;b.onclick=fn;return b};
const esc=t=>String(t);
let box,ctl,note,cur=-1,doneShown={},seg=null,briefBox;
/* the side panel as standalone blocks, one per intention: where am I · think · try · do · read more */
function layout(){const step=document.querySelector('.panel .step');if(!step)return;
  if(!seg){seg={};['orient','think','try','goal','more'].forEach(k=>{const d=document.createElement('div');d.className='seg seg-'+k;seg[k]=d});
    const ph=document.querySelector('.panel .ph');step.prepend(seg.orient,seg.think,seg.try,seg.goal,seg.more);
    [ph,step.querySelector('.prog'),document.getElementById('stepT'),document.getElementById('stepS')].forEach(e=>e&&seg.orient.appendChild(e));
    briefBox=document.createElement('div');briefBox.className='ped-briefbox';seg.orient.appendChild(briefBox)}
  [ctl,note,step.querySelector('.side')].forEach(e=>e&&e.parentNode!==seg.try&&seg.try.appendChild(e));
  ['task','after','stepX'].forEach(id=>{const e=document.getElementById(id);if(e&&e.parentNode!==seg.goal)seg.goal.appendChild(e)});
  const m=document.getElementById('more');if(m&&m.parentNode!==seg.more)seg.more.appendChild(m);
}
/* collapse button rows and blocks with nothing visible this step; re-run whenever the lesson changes the panel */
function tidy(){if(!seg)return;
  const shown=c=>!c.hidden&&getComputedStyle(c).display!=='none';
  if(ctl)ctl.querySelectorAll('.row').forEach(r=>{const v=[...r.children].some(shown),want=v?'':'none';if(r.style.display!==want)r.style.display=want});
  const sd=seg.try.querySelector('.side');if(sd){const v=[...sd.children].some(c=>shown(c)&&c.textContent.trim()),want=v?'':'none';if(sd.style.display!==want)sd.style.display=want}
  Object.values(seg).forEach(d=>{const v=[...d.children].some(c=>shown(c)&&c.offsetHeight>0);if(d.classList.contains('empty')===v)d.classList.toggle('empty',!v)})}
let tq=0;const queue=()=>{if(tq)return;tq=requestAnimationFrame(()=>{tq=0;layout();tidy()})};

function chips(id,q,opts,ans,picked,onPick){
  const w=document.createElement('div');w.className='pq';
  w.innerHTML=`<p class="pq-q" id="${id}q">${esc(q)}</p><div class="pq-o" role="group" aria-labelledby="${id}q" aria-label="${esc(q).replace(/<[^>]+>/g,'').replace(/"/g,'')}">`+
    opts.map((o,i)=>`<button type="button" data-i="${i}" aria-pressed="${picked===i}" class="${picked==null?'':i===picked?(ans==null||i===ans?'pick':'pick no'):(ans!=null&&picked!=null&&i===ans?'right':'')}" ${picked!=null?'disabled':''}>${esc(o)}</button>`).join('')+'</div>';
  w.querySelectorAll('button').forEach(b=>b.onclick=()=>onPick(+b.dataset.i));return w}

function render(step){
  if(!box)return;cur=step;box.innerHTML='';layout();if(briefBox)briefBox.innerHTML='';
  const pr=D.pr&&D.pr[step],rc=D.recall&&D.recall[step],br=step===0&&D.brief,end=D.end&&D.end.step===step;
  if(br){const c=document.createElement('details');c.className='ped brief';
    c.innerHTML=`<summary><span class="brief-s">${D.brief.short}</span><span class="brief-t">Goals</span></summary><p class="brief-p">${D.brief.problem}</p><ul>${D.brief.goals.map(x=>`<li>${x}</li>`).join('')}</ul>`;(briefBox||box).appendChild(c)}
  const quiz=(items,key,title,note)=>{const c=document.createElement('section');c.className='ped recall';
    const n=items.filter((_,i)=>g(key+i)!=null).length,ok=items.filter((q,i)=>g(key+i)===q.a).length;
    c.innerHTML=`<p class="ped-k">${title}<span>${n===items.length?ok+' / '+items.length:note}</span></p>`;
    /* one question at a time: answered ones shrink to a line, the next waits its turn */
    const u=items.findIndex((_,i)=>g(key+i)==null);
    items.forEach((q,i)=>{const p=g(key+i);
      if(p!=null){const d=document.createElement('p');d.className='pq-done'+(p===q.a?' ok':'');
        d.innerHTML=`<span>${q.q}</span> <b>${p===q.a?q.o[q.a]:'Not '+q.o[p]}</b>`+(p!==q.a?'':(i===u-1||u<0&&i===items.length-1)&&q.ex?`<em>${q.ex}</em>`:'');
        if(p!==q.a)d.appendChild(again('Try again',()=>{s(key+i,null);render(cur)}));c.appendChild(d);return}
      if(i===u)c.appendChild(chips(key+i,q.q,q.o,q.a,null,v=>{s(key+i,v);render(cur)}))});
    c.querySelector('.ped-k span').textContent=u<0?ok+' / '+items.length+' right':(u+1)+' of '+items.length;
    if(u<0){const r=again('Start over',()=>{items.forEach((_,i)=>s(key+i,null));render(cur)});r.classList.add('k');c.querySelector('.ped-k').appendChild(r)}
    box.appendChild(c)};
  const warm=rc&&rc.some((_,i)=>g('r'+step+'_'+i)==null);
  if(rc)quiz(rc,'r'+step+'_','Warm-up from memory','No peeking');
  if(pr&&!warm){const c=document.createElement('section');c.className='ped predict';const p=g('p'+step);
    c.innerHTML=`<p class="ped-k">${p==null?'Predict first':'Your prediction'}</p>`;
    c.appendChild(chips('p'+step,pr.q,pr.o,null,p,v=>{s('p'+step,v);render(cur)}));
    if(p!=null){const f=document.createElement('p');f.className='pq-f';f.id='pedEx';f.textContent='Now try it and see.';c.appendChild(f);
      const r=again('Change',()=>{s('p'+step,null);doneShown[step]=false;render(cur)});r.classList.add('k');c.querySelector('.ped-k').appendChild(r)}
    box.appendChild(c)}
  if(end){const t=document.getElementById('stepX')||document.getElementById('task');t.insertAdjacentElement('afterend',box);quiz(D.end.items,'e_','Check yourself','Mixed, from the whole level');
    const c=document.createElement('section');c.className='ped cando';
    c.innerHTML=`<p class="ped-k">I can</p>`+D.brief.goals.map((x,i)=>`<label><input type="checkbox" data-i="${i}" ${g('c'+i)?'checked':''}> ${x}</label>`).join('');
    c.querySelectorAll('input').forEach(b=>b.onchange=()=>s('c'+b.dataset.i,b.checked));box.appendChild(c)}
  if(!end){if(seg&&box.parentNode!==seg.think)seg.think.appendChild(box);else if(!seg){const lead=document.getElementById('stepS');if(box.previousElementSibling!==lead)lead.insertAdjacentElement('afterend',box)}}
  if(seg)queue();
  const lock=!!(pr&&g('p'+step)==null);if(ctl){ctl.classList.toggle('ped-lock',lock);ctl.inert=lock;if(lock)ctl.setAttribute('aria-disabled','true');else ctl.removeAttribute('aria-disabled');note.hidden=!lock||!!warm;if(lock&&warm)note.hidden=false,note.textContent='Warm up, then make a prediction';else note.textContent='Pick a prediction first'}
  doneShown[step]=false;
}
function ready(step){const pr=D.pr&&D.pr[step];return!pr||g('p'+step)!=null}
function after(ok){const pr=D.pr&&D.pr[cur];if(!pr||!ok||doneShown[cur])return;const p=g('p'+cur);if(p==null)return;
  const f=document.getElementById('pedEx');if(!f)return;doneShown[cur]=true;
  f.className='pq-f'+(p===pr.a?' ok':'');f.innerHTML='<b class="wh">'+(p===pr.a?'Your prediction held.':'What happened: '+pr.o[pr.a]+'.')+'</b> '+pr.ex}
function wrap(fn,step){return function(){fn.apply(this,arguments);render(step())}}
window.PW=()=>{if(innerWidth<=900)return 0;const p=document.querySelector('.panel');return p?p.offsetWidth+12:0};
window.PED={init(k,data){L=k;D=data;load();
  const mount=()=>{const lead=document.getElementById('stepS');ctl=document.querySelector('.card.ctl');
    box=document.createElement('div');box.id='ped';lead.insertAdjacentElement('afterend',box);note=document.createElement('p');note.className='ped-note';note.hidden=true;ctl.insertAdjacentElement('afterend',note);
    const pn=document.querySelector('.panel');if(pn&&window.MutationObserver)new MutationObserver(queue).observe(pn,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','style','class']});queue()};
  if(document.getElementById('stepS'))mount();else document.addEventListener('DOMContentLoaded',mount)},
  render,ready,after,wrap};
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
.seg-try .side:empty{display:none}
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
.ped.brief .brief-p{margin:10px 0 10px;color:#b4bde0;font-size:14px;line-height:1.5}
.ped.brief ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.ped.brief li{position:relative;padding-left:16px;font-size:14px;line-height:1.45;color:#c9d2f5}
.ped.brief li::before{content:'';position:absolute;left:2px;top:.55em;width:5px;height:5px;border-radius:50%;background:#7d8cff}
.pq-again{appearance:none;border:0;background:none;padding:0 0 0 10px;font:600 13px/1.3 Manrope,sans-serif;color:#8a9bff;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(138,155,255,.4)}
.pq-done .pq-again{display:block;padding:0;margin:3px 0 0}.pq-again:hover{color:#b7c2ff}.pq-again.k{padding:0;margin-left:12px}
.pq-done{margin:0 0 6px;font-size:13px;line-height:1.45;color:#8f9bc4}.pq-done b{font-weight:600;color:#ffb08a}.pq-done.ok b{color:#9fe8c4}.pq-done em{display:block;font-style:normal;color:#a3acd0;margin-top:2px}
.pq-q{margin:0 0 8px;font-size:15px;line-height:1.45;color:#eef1ff;font-weight:600}
.pq-o{display:flex;flex-wrap:wrap;gap:6px}
.pq-o button{min-height:36px;padding:6px 14px;border-radius:999px;font:600 14px/1.25 Manrope,sans-serif;color:#dfe4fb;background:rgba(91,156,255,.06);border:1px solid rgba(91,156,255,.22);cursor:pointer;text-align:left;transition:background .2s,border-color .2s}
.pq-o button:hover:not(:disabled){background:rgba(91,156,255,.14)}
.pq-o button:disabled{cursor:default;opacity:.5}
.pq-o button.pick{opacity:1;border-color:#8a9bff;background:rgba(91,156,255,.18);color:#fff}
.pq-f{margin:10px 0 0;font-size:14px;line-height:1.5;color:#8f9bc4}
.pq-f .wh{color:#eef1ff;font-weight:600}
.ped.cando label{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:#c9d2f5;padding:5px 0;cursor:pointer}
.ped.cando input,.hw input{appearance:none;-webkit-appearance:none;flex:none;width:18px;height:18px;margin:1px 0 0;border-radius:5px;border:1px solid rgba(143,155,196,.4);background:transparent;cursor:pointer;display:grid;place-items:center}
.ped.cando input:checked,.hw input:checked{border-color:transparent;background:linear-gradient(135deg,#5b9cff,#8a6bff) }
.ped.cando input:checked::after,.hw input:checked::after{content:'';width:8px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:translateY(-1px) rotate(-45deg)}
.card.ctl{transition:opacity .3s}
.card.ctl.ped-lock{opacity:.4;pointer-events:none}
.ped-note{margin:-4px 0 10px;font-size:12px;color:#8f9bc4}
@media(prefers-reduced-motion:reduce){.card.ctl{transition:none}}
@media(min-width:901px){
.app{display:block!important;position:relative;height:100%;--pw:calc(clamp(420px,31vw,500px) + 12px)}
.app>.stage{position:absolute!important;inset:0}
.app>.panel{position:absolute!important;z-index:5;top:0;right:12px;bottom:0;width:clamp(420px,31vw,500px);background:none!important;border:0!important;box-shadow:none!important;pointer-events:none;padding:12px 0 0!important;scrollbar-width:none}
.app>.panel::-webkit-scrollbar{display:none}
.app>.panel .step{pointer-events:none}
.app>.panel .nav{pointer-events:auto;margin:auto 0 0!important;padding:12px 0!important;background:none!important}
.hud{right:calc(var(--pw) + 12px)!important}.info{right:calc(var(--pw) + 4px)!important}}
.blk table{font-size:13.5px;table-layout:auto}.blk table th,.blk table td{padding:7px 8px 7px 0;vertical-align:top}.blk table td:nth-child(-n+3),.blk table th{white-space:nowrap}
.dots button,.dots button:hover{background:linear-gradient(#1d2752,#1d2752) center/100% 4px no-repeat!important;border-radius:0!important}
.dots button.done{background-image:linear-gradient(#4b5fc8,#4b5fc8)!important}
.dots button.on,.dots button.on.done{background-image:linear-gradient(90deg,#5b9cff,#8a6bff)!important;background-size:100% 4px!important;filter:drop-shadow(0 0 4px rgba(91,156,255,.6))}
.dots button:hover:not(.on){background-image:linear-gradient(#33407a,#33407a)!important}`;
const el=document.createElement('style');el.textContent=css;document.head.appendChild(el);
})();
