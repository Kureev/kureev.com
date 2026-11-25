/* Schematics: the board you built, in the symbols engineers draw (IEC 60617).
   Concreteness fading: the 3D part's info card shows its symbol; on board steps a "Schematic" button docks
   the circuit beside the scene; on the wrap-up step it opens by itself. Never during the water model.
   Two-way: click a symbol and its part's card opens; click a part in 3D and its symbol lights up.
   A lesson calls SCHEM.def(key, () => state) and sets #info[data-part] when a part's card opens. */
(function(){
const T=function(s){if(window.I18N)return I18N.t.apply(null,arguments);const a=arguments;return String(s).replace(/\{(\d+)\}/g,(m,i)=>a[+i+1])};
const W='#8f9bc4',INK='#dfe4fb';
/* symbols, drawn horizontally between x=-20 and x=20, current flowing left to right */
const SY={
res:'<rect x="-13" y="-5" width="26" height="10" rx="1"/><path d="M-20 0h7M13 0h7"/>',
led:'<path d="M-20 0h8M8 0h12M-8 -8v16l14-8z" /><path d="M6 -8v16"/><path d="M2 -11l5 -6M7 -10l5 -6" /><path d="M7 -17l0 3.2M7 -17l-3 1.2M12 -16l0 3.2M12 -16l-3 1.2"/>',
diode:'<path d="M-20 0h10M8 0h12M-10 -8v16l15-8z"/><path d="M5 -8v16"/>',
schottky:'<path d="M-20 0h10M5 0h15M-10 -8v16l15-8z"/><path d="M8 -5v-3h-3v16h-3v-3"/>',
sw:'<path d="M-20 0h8M12 0h8"/><circle cx="-10" cy="0" r="2" fill="currentColor"/><circle cx="10" cy="0" r="2" fill="currentColor"/><path class="lever" d="M-10 0L10 -9"/>',
swc:'<path d="M-20 0h8M12 0h8"/><circle cx="-10" cy="0" r="2" fill="currentColor"/><circle cx="10" cy="0" r="2" fill="currentColor"/><path d="M-10 0L10 -2"/>',
fuse:'<rect x="-13" y="-5" width="26" height="10" rx="1"/><path d="M-20 0h40"/>',
cap:'<path d="M-20 0h17M3 0h17M-3 -10v20"/><rect x="2" y="-10" width="4" height="20" fill="currentColor"/><path d="M-9 13h4M-7 11v4"/>',
coil:'<path d="M-20 0h4a4 4 0 0 1 8 0a4 4 0 0 1 8 0a4 4 0 0 1 8 0a4 4 0 0 1 8 0h4"/>',
lamp:'<path d="M-20 0h10M10 0h10"/><circle r="10"/><path d="M-7 -7l14 14M7 -7l-14 14"/>',
motor:'<path d="M-20 0h10M10 0h10"/><circle r="10"/><text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="700" stroke="none" fill="currentColor" font-family="Manrope,sans-serif">M</text>',
volt:'<path d="M-20 0h10M10 0h10"/><circle r="10"/><text x="0" y="4.5" text-anchor="middle" font-size="12" font-weight="700" stroke="none" fill="currentColor" font-family="Manrope,sans-serif">V</text>',
src:'<path d="M-20 0h17M5 0h15M-3 -12v24"/><path d="M3 -6v12" stroke-width="4"/><path d="M-12 12h5M-9.5 9.5v5"/>',
/* P-channel MOSFET for reverse protection: drain on the left (input), source on the right (rail), gate below */
pmos:'<path d="M-20 0h8v-10M20 0h-8v-10"/><path d="M-14 -10h7M-3 -10h6M7 -10h7"/><path d="M-8 -4h16M0 -4v12"/><path d="M0 -10l-3 4h6z" fill="currentColor"/>',
term:'<path d="M-20 0h20M0 0h20"/><circle cx="0" cy="0" r="3"/>',
gnd:'<path d="M0 -8v8M-9 0h18M-6 4h12M-3 8h6"/>'};
const G=(x,y)=>`<g transform="translate(${x} ${y})" stroke="${W}"><path d="M0 0v6M-9 6h18M-6 10h12M-3 14h6" fill="none" stroke-width="1.6" stroke-linecap="round"/></g>`;
function part(p,kind,x,y,rot,lab,sub){const sym=SY[kind]||SY.res;
  return `<g class="sp" data-p="${p}" transform="translate(${x} ${y}) rotate(${rot||0})" tabindex="0" role="button" aria-label="${lab}"><rect class="hit" x="-22" y="-18" width="44" height="36" rx="8"/><g class="ss" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${sym}</g></g>`+
    (lab?`<text class="sl" x="${x+(rot?16:0)}" y="${y+(rot?-2:-17)}" text-anchor="${rot?'start':'middle'}">${lab}</text>`+(sub?`<text class="sv" x="${x+(rot?16:0)}" y="${y+(rot?13:28)}" text-anchor="${rot?'start':'middle'}">${sub}</text>`:''):'')}
const wire=(d)=>`<path class="sw" d="${d}"/>`;
const dot=(x,y)=>`<circle class="sd" cx="${x}" cy="${y}" r="2.6"/>`;
const node=(x,y,t)=>`<text class="sn" x="${x}" y="${y}">${t}</text>`;
/* layout: a source on the left, series parts along the top rail, shunt branches hanging down to ground */
const TOP=46,BOT=160,MID=103;
function draw(L){const x0=34;let svg='',cx=x0;const xs=[];let extraW=40;
  svg+=wire(`M${x0} ${TOP}V${MID-20}M${x0} ${MID+20}V${BOT}`)+part(L.src.p,'src',x0,MID,90,L.src.l,L.src.v);
  L.series.forEach(it=>{const nx=cx+66;svg+=wire(`M${cx} ${TOP}H${nx-20}`)+part(it.p,it.k,nx,TOP,0,it.l,it.v);
    if(it.k==='pmos')svg+=G(nx,TOP+8);if(it.node){svg+=node(nx+24,TOP-8,it.node);xs.sw=nx+20}cx=nx+20});
  L.shunt.forEach((b,i)=>{const nx=cx+(i?64:40);svg+=wire(`M${cx} ${TOP}H${nx}`);if(i<L.shunt.length-1||L.after)svg+=dot(nx,TOP);
    if(b.chain){const c1=b.chain[0],c2=b.chain[1],y1=TOP+30,y2=BOT-30,ty=(y1+20+y2-20)/2;
      svg+=wire(`M${nx} ${TOP}V${y1-20}M${nx} ${y1+20}V${y2-20}M${nx} ${y2+20}V${BOT}`)+part(c1.p,c1.k,nx,y1,90,c1.l,c1.v)+part(c2.p,c2.k,nx,y2,90,c2.l,c2.v);
      if(c1.tap){svg+=dot(nx,ty)+wire(`M${nx} ${ty}H${nx+22}M${nx+62} ${ty}H${nx+72}V${BOT}`)+part(c1.tap.p,'volt',nx+42,ty,0,'','')+G(nx+72,BOT);extraW=Math.max(extraW,86)}}
    else svg+=wire(`M${nx} ${TOP}V${MID-20}M${nx} ${MID+20}V${BOT}`)+part(b.p,b.k,nx,MID,90,b.l,b.v);
    xs.push(nx);cx=nx});
  if(L.gndRail)svg+=wire(`M${x0} ${BOT}H${xs[xs.length-1]}`)+G(x0,BOT);else{svg+=G(x0,BOT);xs.forEach(x=>{svg+=G(x,BOT)})}
  if(L.after)svg+=L.after(xs);
  const lb=L.shunt.length?L.shunt[L.shunt.length-1]:null,ln=lb?Math.max(...(lb.chain||[lb]).map(c=>String(c.l||'').length+String(c.v||'').length*0)):0;
  return{svg,w:Math.max(cx+Math.max(extraW,24+ln*8),280),h:BOT+26}}
/* one builder per level, from the lesson's build state */
const U=(x,u)=>window.UNITS?UNITS.eng(x,u):x+' '+u;
const LV={
l0:s=>{const ser=[];if(s.sw)ser.push({p:'sw',k:s.closed?'swc':'sw',l:'S'});
  const R={p:'res',k:'res',l:'R',v:s.R?U(s.R,'Ω'):''},D={p:'led',k:'led',l:'LED'};
  if(s.res){if(s.swap){ser.push(D);return{src:{p:'src',l:'12 V'},series:ser,shunt:[R]}}ser.push(R)}
  return{src:{p:'src',l:'12 V'},series:ser,shunt:[D],gndRail:true}},
l1:s=>{const ser=[{p:'conn',k:'term',l:''}];if(s.f)ser.push({p:'fuse',k:'fuse',l:'F'});if(s.prot==='diode')ser.push({p:'diode',k:'schottky',l:'D'});if(s.prot==='fet')ser.push({p:'fet',k:'pmos',l:'Q'});
  const sh=[{p:'servo',k:'motor',l:'× 6'}];if(s.led)sh.push({chain:[{p:'res',k:'res',l:'R'},{p:'led',k:'led',l:'LED'}]});if(s.div)sh.push({chain:[{p:'r1',k:'res',l:'R1',tap:{p:'meter'}},{p:'r2',k:'res',l:'R2'}]});
  return{src:{p:'psu',l:'12 V'},series:ser,shunt:sh}},
l2:s=>{const ser=[{p:'conn',k:'term',l:''},{p:'fuse',k:'fuse',l:'F'},{p:'fet',k:'pmos',l:'Q'}];const sh=[];
  if(s.cap)sh.push({p:'cap',k:'cap',l:s.cn>1?'C × '+s.cn:'C',v:s.C?(window.I18N?I18N.nf(s.C*1e6,0):Math.round(s.C*1e6))+'\u00a0'+(window.UNITS?UNITS.sym('F',-6):'µF'):''});sh.push({p:'servo',k:'motor',l:'× 6'});sh.push({chain:[{p:'res',k:'res',l:'R'},{p:'led',k:'led',l:'LED'}]});sh.push({chain:[{p:'r1',k:'res',l:'R1',tap:{p:'meter'}},{p:'r2',k:'res',l:'R2'}]});
  return{src:{p:'psu',l:'12 V'},series:ser,shunt:sh}},
l3:s=>{const ser=[{p:'fuse',k:'fuse',l:'F'},{p:'sw',k:s.closed?'swc':'sw',l:'S',node:'SW'},{p:'coil',k:'coil',l:'L',v:s.L?U(s.L,'H'):''}];
  const sh=[{p:'lamp',k:'lamp',l:T('Lamp')}];
  const d=s.diode&&s.diode!=='none'?s.diode:null;
  return{src:{p:'psu',l:'12 V'},series:ser,shunt:sh,after:d?(xs=>{const x=xs.sw;return dot(x,TOP)+wire(`M${x} ${TOP}V${MID-20}M${x} ${MID+20}V${BOT}`)+part('diode','schottky',x,MID,d==='rev'?90:-90,'D','')+G(x,BOT)}):null}}};
let key=null,get=null,open=false,box=null,btn=null,last='',hl=null,user=false;
function render(){if(!box||!get)return;const s=get();const show=s.sc==='b';btn.hidden=!show;if(!show){box.hidden=true;return}
  if(s.auto&&!user)open=true;box.hidden=!open;btn.setAttribute('aria-pressed',open);if(!open)return;
  const sig=JSON.stringify(s);if(sig===last)return;last=sig;
  const L=LV[key](s);const {svg,w,h}=draw(L);
  box.querySelector('.sc-svg').innerHTML=`<svg viewBox="0 0 ${w} ${h}" style="width:${Math.round(w*1.3)}px" role="img" aria-label="${T('Schematic of the board')}">${svg}</svg>`;
  box.querySelectorAll('.sp').forEach(g=>{const p=g.dataset.p;const go=()=>{if(window.SHOWINFO&&INFOK(p))SHOWINFO(INFOK(p));mark(p)};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  if(hl)mark(hl)}
const INFOK=p=>({r1:'res',r2:'res',src:'src'}[p]||p);
function mark(p){hl=p;if(!box)return;box.querySelectorAll('.sp').forEach(g=>g.classList.toggle('on',INFOK(g.dataset.p)===INFOK(p)))}
function mount(){if(box)return;const stage=document.getElementById('stage');if(!stage)return;
  btn=document.createElement('button');btn.type='button';btn.className='sc-btn';btn.hidden=true;btn.setAttribute('aria-pressed','false');
  btn.innerHTML=`<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 10h4M14 10h4"/><rect x="6" y="7" width="8" height="6" rx="1"/><path d="M10 3v4M10 13v4M6 17h8"/></svg><span>${T('Schematic')}</span>`;
  btn.onclick=()=>{open=!open;user=true;last='';render()};
  box=document.createElement('section');box.className='sc-box';box.hidden=true;box.setAttribute('aria-label',T('Schematic'));
  box.innerHTML=`<div class="sc-h"><h2>${T('Schematic')}</h2><button type="button" class="sc-x" aria-label="${T('Close')}"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div><div class="sc-svg"></div><p class="sc-n">${T('The same board, as engineers draw it. Click a symbol to see its part. Every ⏚ is one node: ground, 0 V.')}</p>`;
  box.querySelector('.sc-x').onclick=()=>{open=false;user=true;render();btn.focus()};
  const tools=document.querySelector('.tools')||stage;tools.appendChild(btn);stage.appendChild(box);
  /* the part's card shows its symbol, and the schematic marks it */
  const info=document.getElementById('info');if(info)new MutationObserver(()=>{const p=info.dataset.part;if(info.hidden||!p)return;mark(p);
    let s=info.querySelector('.sc-sym');const k=SYMK[p];if(!k){s&&s.remove();return}
    if(!s){s=document.createElement('div');s.className='sc-sym';info.appendChild(s)}
    s.innerHTML=`<svg width="64" height="40" viewBox="-26 -22 52 44" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SY[k]}</g></svg><span>${T('On a schematic')}</span>`}).observe(info,{attributes:true,childList:true,subtree:false});
  setInterval(render,300)}
const SYMK={res:'res',led:'led',sw:'sw',src:'src',psu:'src',fuse:'fuse',diode:'schottky',fet:'pmos',cap:'cap',coil:'coil',lamp:'lamp',meter:'volt',servo:'motor'};
const css=`.sc-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(140,160,255,.25);background:rgba(10,15,40,.84);color:#dfe4fb;font:600 15px/1 Manrope,sans-serif;cursor:pointer;pointer-events:auto;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.sc-btn:hover{border-color:rgba(140,160,255,.45)}.sc-btn[aria-pressed=true]{border-color:#8a9bff;background:rgba(40,55,130,.85);color:#fff}
.sc-box{position:absolute;left:16px;top:72px;z-index:6;width:max-content;max-width:calc(100% - 32px - var(--pw,0px));padding:12px 14px 12px;border-radius:16px;background:rgba(10,15,40,.88);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid rgba(140,160,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.4);pointer-events:auto}
.sc-h{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 2px}
.sc-h h2{margin:0;font:600 15px/1.3 Manrope,sans-serif;color:#eef1ff;letter-spacing:0}
.sc-x{display:grid;place-items:center;width:44px;height:44px;margin:-8px -8px -8px 0;border:0;border-radius:12px;background:none;color:#c9d2f5;cursor:pointer}.sc-x:hover{background:rgba(140,160,255,.1);color:#fff}
.sc-svg svg{display:block;max-width:100%;height:auto}
.sc-svg .sw{fill:none;stroke:${W};stroke-width:1.6;stroke-linecap:round}
.sc-svg .sd{fill:${W}}
.sc-svg .sp{color:${INK};cursor:pointer;outline:none}
.sc-svg .sp .hit{fill:transparent;stroke:none}
.sc-svg .sp:hover .hit,.sc-svg .sp:focus-visible .hit{fill:rgba(91,156,255,.12)}
.sc-svg .sp:focus-visible .hit{stroke:#8a9bff;stroke-width:1.5}
.sc-svg .sp.on{color:#ffb26b}.sc-svg .sp.on .hit{fill:rgba(255,178,107,.12)}
.sc-svg .sl{font:600 12px/1 Manrope,sans-serif;fill:#c9d2f5}.sc-svg .sv,.sc-svg .sn{font:600 12px/1 Manrope,sans-serif;fill:#8f9bc4}
.sc-n{max-width:44ch;margin:6px 0 0;font-size:13px;line-height:1.45;color:#8f9bc4}
.sc-sym{grid-column:1/-1;display:flex;align-items:center;gap:10px;margin:10px 0 0;padding-top:10px;border-top:1px solid rgba(140,160,255,.12);color:#dfe4fb;font:600 13px/1.3 Manrope,sans-serif}.sc-sym span{color:#8f9bc4}
@media(max-width:900px){.sc-box{top:auto;bottom:12px;left:12px}.sc-btn span{display:none}.sc-btn{padding:0 12px}}
@media(prefers-contrast:more){.sc-box{background:#0a1230;border-color:#c9d2f5}}`;
const e=document.createElement('style');e.textContent=css;document.head.appendChild(e);
window.SCHEM={def(k,fn){key=k;get=fn;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount()},mark,render:()=>{last='';render()}};
})();
