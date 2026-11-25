/* Units and prefixes for the course.
   UNITS.parse   reads what a learner types: "4k7", "4,7 кОм", "1050 µF", "0.22mA", "2R2" → a value in base units.
   UNITS.grade   checks an answer and says what went wrong: a prefix slip (×1000), a known trap, or just off.
   UNITS.base    formats a value in base units ("0,0101 А") for the "in base units" line under a formula.
   Formulas in #wF and #formula get that line automatically, and any number in the HUD or a formula
   shows a prefix ladder on hover or tap: the same value one rung up and one rung down. */
(function(){
const T=function(s){if(window.I18N)return I18N.t.apply(null,arguments);const a=arguments;return String(s).replace(/\{(\d+)\}/g,(m,i)=>a[+i+1])};
const ru=()=>window.I18N&&I18N.lang==='ru';
/* prefixes: latin and cyrillic spellings */
const PF={'p':-12,'n':-9,'н':-9,'u':-6,'µ':-6,'μ':-6,'мк':-6,'m':-3,'м':-3,'':0,'k':3,'K':3,'к':3,'M':6,'М':6,'G':9,'Г':9};
/* units: symbol → base key */
const UN={'V':'V','В':'V','A':'A','А':'A','Ω':'Ω','Ohm':'Ω','ohm':'Ω','Ом':'Ω','ом':'Ω','R':'Ω','F':'F','Ф':'F','H':'H','Гн':'H','W':'W','Вт':'W','J':'J','Дж':'J','s':'s','с':'s','C':'C','Кл':'C','Hz':'Hz','Гц':'Hz','Wh':'Wh','Вт·ч':'Wh','Ah':'Ah','А·ч':'Ah'};
const UNIT_RX='(Вт·ч|А·ч|Wh|Ah|Ohm|ohm|Ом|ом|Гн|Вт|Дж|Кл|Гц|Hz|V|В|A|А|Ω|F|Ф|H|W|J|s|с|C)';
const PF_RX='(мк|[pnнuµμmмkKкMМGГ])';
const SYM={V:['V','В'],A:['A','А'],'Ω':['Ω','Ом'],F:['F','Ф'],H:['H','Гн'],W:['W','Вт'],J:['J','Дж'],s:['s','с'],C:['C','Кл'],Hz:['Hz','Гц']};
const PSYM={'-12':['p','п'],'-9':['n','н'],'-6':['µ','мк'],'-3':['m','м'],'0':['',''],'3':['k','к'],'6':['M','М'],'9':['G','Г']};
const sym=(u,e)=>{const i=ru()?1:0;return(PSYM[e]||['',''])[i]+(SYM[u]?SYM[u][i]:u)};
const nfx=(x,d)=>window.I18N?I18N.nf(x,d):x.toFixed(d);

/* a number as typed: "1 050", "1,05", "1.05", "4k7" (RKM), "2R2" */
function num(s){s=s.replace(/[\s\u00a0\u202f\u2009]/g,'');
  if(/^\d+,\d{3}(,\d{3})*(\.\d+)?$/.test(s)&&!ru())s=s.replace(/,/g,'');
  s=s.replace(',','.');const v=parseFloat(s);return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)?v:NaN}
function parse(str,def){if(str==null)return null;let s=String(str).trim().replace(/^[=≈~]\s*/,'');if(!s)return null;
  /* RKM: 4k7, 2R2, 1M5, 4u7, 4µ7, 4n7, 0R5 */
  let m=s.match(/^(\d+)\s*(R|r|к|k|K|M|М|m|м|u|µ|мк|n|н|p)\s*(\d+)\s*(.*)$/);
  if(m&&!/^[,.]/.test(m[3])){const e=m[2]==='R'||m[2]==='r'?0:PF[m[2]];const v=parseFloat(m[1]+'.'+m[3]);const u=m[4]?unitOf(m[4]):{e:0,u:def&&def.unit};if(u&&e!=null)return{v:v*Math.pow(10,e+(u.e||0)),u:u.u||(def&&def.unit),e}}
  m=s.match(/^(\d+(?:[.,]\d+)?)\s*[Rr]$/);if(m)return{v:num(m[1]),u:'Ω',e:0};
  m=s.match(/^([-+]?[\d\s\u00a0\u202f.,]*\d|[-+]?[.,]\d+)\s*(.*)$/);if(!m)return null;
  const v=num(m[1]);if(isNaN(v))return null;const rest=m[2].trim();
  if(!rest)return{v:v*Math.pow(10,(def&&def.e)||0),u:def&&def.unit,e:(def&&def.e)||0,bare:true};
  const u=unitOf(rest);if(!u)return null;return{v:v*Math.pow(10,u.e),u:u.u||(def&&def.unit),e:u.e}}
function unitOf(r){r=r.replace(/\s+/g,'');if(!r)return{e:0};
  let m=r.match(new RegExp('^'+PF_RX+'?'+UNIT_RX+'$'));
  if(m){/* "мс" could be milli-second; "Ом" is a unit, not a prefix */return{e:m[1]?PF[m[1]]:0,u:UN[m[2]]}}
  m=r.match(new RegExp('^'+PF_RX+'$'));if(m)return{e:PF[m[1]]};
  return null}

/* base-unit formatting: three significant figures, no trailing zeros */
function base(x,u){if(!isFinite(x))return'—';const a=Math.abs(x);const d=a===0?0:Math.min(9,Math.max(0,2-Math.floor(Math.log10(a)+1e-9)));
  let t=nfx(x,d);const dec=ru()?',':'.';if(t.includes(dec))t=t.replace(new RegExp('\\'+dec+'?0+$'),'');return t+(u?'\u00a0'+sym(u,0):'')}
/* engineering formatting with the best prefix */
function eng(x,u){if(!isFinite(x))return'—';if(x===0)return'0\u00a0'+sym(u,0);let e=Math.floor(Math.log10(Math.abs(x))/3)*3;e=Math.max(-12,Math.min(9,e));
  const v=x/Math.pow(10,e);const d=Math.abs(v)>=100?0:Math.abs(v)>=10?1:2;let t=nfx(v,d);const dec=ru()?',':'.';if(t.includes(dec))t=t.replace(new RegExp('\\'+dec+'?0+$'),'');return t+'\u00a0'+sym(u,e)}

/* grade an answer. spec: {ans (base units), unit, e (prefix of a bare number, default 0), tol (relative, default .1) or lo/hi,
   traps: [{v, msg, tol}] values a known slip produces, msgs: {ok, near, far} }
   → {ok, kind: ok|scale|trap|off|empty|unread, msg} */
function grade(input,spec){const p=parse(input,{unit:spec.unit,e:spec.e||0});
  if(input==null||!String(input).trim())return{ok:false,kind:'empty',msg:T('Type a number first.')};
  if(!p)return{ok:false,kind:'unread',msg:T('I can’t read that. Write a number, with a prefix if you like: 4700, 4.7k or 4k7.')};
  if(p.u&&spec.unit&&p.u!==spec.unit)return{ok:false,kind:'unit',msg:T('That’s a different unit. The answer is in {0}.',sym(spec.unit,0))};
  const v=p.v,a=spec.ans,tol=spec.tol==null?0.1:spec.tol;
  const near=(x,y,t)=>y===0?Math.abs(x)<1e-12:Math.abs(x-y)<=Math.abs(y)*t;
  const inside=spec.lo!=null?(v>=spec.lo&&v<=spec.hi):near(v,a,tol);
  if(inside)return{ok:true,kind:'ok',v};
  for(const tr of spec.traps||[]){if(near(v,tr.v,tr.tol==null?tol:tr.tol))return{ok:false,kind:'trap',v,msg:T(tr.msg)}}
  const r=v/a;
  for(const k of [3,6,9,-3,-6,-9]){if(near(r,Math.pow(10,k),tol*1.2)){
    const f=Math.pow(10,Math.abs(k)),big=k>0;
    return{ok:false,kind:'scale',v,msg:T(big?'That’s {0} times too big. A prefix slipped: convert everything to base units (A, Ω, F, H, s) before you divide or multiply.':'That’s {0} times too small. A prefix slipped: convert everything to base units (A, Ω, F, H, s) before you divide or multiply.',{1000:'1000',1000000:'1\u00a0000\u00a0000',1000000000:'1\u00a0000\u00a0000\u00a0000'}[f])}}}
  for(const k of [1,2,-1,-2]){if(near(r,Math.pow(10,k),tol*1.2))return{ok:false,kind:'scale',v,msg:T('Off by a factor of {0}: check where the decimal point went.',String(Math.pow(10,Math.abs(k))))}}
  return{ok:false,kind:'off',v,msg:T(spec.off||'Not quite. Check each step, and the units at each step.')}}

/* ---------- the "in base units" line under a formula ---------- */
const Q_RX=new RegExp('([-−]?\\d[\\d\\u00a0\\u202f\\s]*(?:[.,]\\d+)?)\\s?'+PF_RX+'?'+UNIT_RX+'(?![\\p{L}])','gu');
function qBase(seg){let any=false;const out=seg.replace(Q_RX,(m,n,p,u)=>{const e=p?PF[p]:0;if(e)any=true;const v=num(n.replace('−','-'))*Math.pow(10,e);return base(v,'')});return{any,out}}
function expandLine(line){
  if(/class="bx"/.test(line))return line;
  /* the working: what sits between the first "=" after the symbols and the bolded result */
  const m=line.match(/=\s*([^=<]*?\d[^=<]*?)\s*(?:=|≈)\s*<b>([^<]+)<\/b>/);if(!m)return line;
  const work=m[1],res=m[2];const W=qBase(work),R=parse(res.replace(/[×]$/,''));
  const resPrefixed=R&&R.e;if(!W.any&&!resPrefixed)return line;
  if(!R||!R.u)return line;
  const lhs=W.out.replace(/\s+/g,' ').trim();
  return line+'<span class="bx">'+T('in base units: {0} = {1}',lhs,base(R.v,R.u))+'</span>'}
function expand(html){html=html.replace(/&nbsp;/g,'\u00a0');const L=html.split(/<br\s*\/?>/).map(expandLine);return L.map((l,i)=>l+(i<L.length-1&&!/class="bx"[^]*<\/span>$/.test(l)?'<br>':'')).join('')}
let busy=false;
function watch(el){if(!el||el.dataset.bx)return;el.dataset.bx='1';
  const run=()=>{if(busy)return;const h=el.innerHTML;if(h.includes('class="bx"'))return;const x=expand(h);if(x.replace(/\u00a0/g,'&nbsp;')!==h){busy=true;el.innerHTML=x;busy=false}};
  new MutationObserver(run).observe(el,{childList:true,characterData:true,subtree:true});run()}

/* ---------- the prefix ladder ---------- */
let pop=null,cur=null;
function ladder(el){const p=parse(el.textContent);if(!p||!p.u||!SYM[p.u]||p.v===0)return null;
  const v=p.v,u=p.u;let e=Math.floor(Math.log10(Math.abs(v))/3)*3;e=Math.max(-9,Math.min(6,e));
  const rungs=[e+3,e,e-3].filter(k=>k>=-9&&k<=9);if(!rungs.includes(0)&&Math.abs(e)<=6){/* keep the base unit in view */rungs.push(0);rungs.sort((a,b)=>b-a)}
  return{u,rows:rungs.map(k=>{const x=v/Math.pow(10,k);const a=Math.abs(x);const d=a>=1000?0:a>=100?1:a>=1?2:Math.min(9,2-Math.floor(Math.log10(a)));
    let t=nfx(x,Math.max(0,d));const dec=ru()?',':'.';if(t.includes(dec))t=t.replace(new RegExp('\\'+dec+'?0+$'),'');return{k,t:t+'\u00a0'+sym(u,k),on:k===e}})}}
function show(el){if(document.body.classList.contains('ped-hide')&&el.closest('.hud,#wF,#formula'))return;const L=ladder(el);if(!L){hide();return}cur=el;
  if(!pop){pop=document.createElement('div');pop.className='lad';pop.setAttribute('aria-hidden','true');document.body.appendChild(pop)}
  pop.innerHTML=`<p class="lad-k">${T('The same value')}</p>`+L.rows.map(r=>`<span class="lad-r${r.on?' on':''}">${r.t}</span>`).join('')+`<p class="lad-n">${T('Each step is × 1000')}</p>`;
  pop.hidden=false;const r=el.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h-10;if(y<8)y=r.bottom+10;x=Math.max(8,Math.min(innerWidth-w-8,x));pop.style.left=x+'px';pop.style.top=y+'px'}
function hide(){if(pop)pop.hidden=true;cur=null}
const TARGET='.hud .num b,#wF b,#formula b,.lad-t';
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const t=e.target.closest&&e.target.closest(TARGET);if(t)show(t);else if(cur&&!e.target.closest('.lad'))hide()});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest(TARGET);if(t){if(cur===t)hide();else show(t)}else if(!e.target.closest('.lad'))hide()});
addEventListener('scroll',hide,true);addEventListener('keydown',e=>{if(e.key==='Escape')hide()});

const css=`.bx{display:block;margin-top:2px;font-size:var(--t-meta,13px);line-height:1.45;color:var(--mute,#8f9bc4);font-variant-numeric:tabular-nums}
.hud .num b,#wF b,#formula b,.lad-t{cursor:help;text-decoration:underline dotted rgba(143,155,196,.45);text-underline-offset:3px;text-decoration-thickness:1px}
.ped-hide .hud .num b,.ped-hide #wF b,.ped-hide #formula b{text-decoration:none!important;cursor:default}
.lad{position:fixed;z-index:1002;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:150px;padding:10px 14px 12px;border-radius:14px;background:rgba(10,15,40,.96);border:1px solid rgba(140,160,255,.25);box-shadow:0 14px 40px rgba(0,0,0,.45);pointer-events:none;font-variant-numeric:tabular-nums}
.lad[hidden]{display:none}
.lad-k{margin:0 0 6px;font:600 13px/1.3 Manrope,sans-serif;color:#8f9bc4}
.lad-r{font:600 15px/1.35 Manrope,sans-serif;color:#c9d2f5}.lad-r.on{color:#eef1ff;font-size:16px;font-weight:700}
.lad-n{margin:6px 0 0;font:500 13px/1.3 Manrope,sans-serif;color:#8f9bc4}
@media(prefers-contrast:more){.lad{background:#0a1230;border-color:#c9d2f5}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const boot=()=>{['wF','formula'].forEach(id=>watch(document.getElementById(id)))};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.UNITS={parse,grade,base,eng,expand,sym,watch};
})();
