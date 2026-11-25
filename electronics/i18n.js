/* Course i18n. English is the source text; another language is a dictionary keyed by the English string.
   t(s, ...args) translates and fills {0}, {1}…; nf() formats numbers with Intl for the current locale; u() localises units.
   Language: ?lang=xx, then the saved choice, then the browser's languages. Missing keys fall back to English. */
(function(){
const SUP={en:'en-US',ru:'ru-RU'};
let lang=null;
try{const q=new URLSearchParams(location.search).get('lang');if(SUP[q]){lang=q;localStorage.setItem('lang',q)}else{const s=localStorage.getItem('lang');if(SUP[s])lang=s}}catch(_){}
if(!lang)lang=(navigator.languages||[navigator.language||'en']).some(l=>/^ru\b/i.test(l))?'ru':'en';
const locale=SUP[lang];
document.documentElement.lang=lang;
const D={},miss=new Set();
const UNITS={ru:{V:'В',mV:'мВ',A:'А',mA:'мА','µA':'мкА','Ω':'Ом','kΩ':'кОм','MΩ':'МОм',W:'Вт',mW:'мВт',F:'Ф','µF':'мкФ',nF:'нФ',s:'с',ms:'мс','µs':'мкс',J:'Дж',C:'Кл',mC:'мКл',Wh:'Вт·ч',mAh:'мА·ч',H:'Гн',mH:'мГн','µH':'мкГн',mJ:'мДж','µJ':'мкДж'}};
const NF={};
function nf(x,d){const k=d|0;return(NF[k]||(NF[k]=new Intl.NumberFormat(locale,{minimumFractionDigits:k,maximumFractionDigits:k,useGrouping:lang==='ru'?'min2':true}))).format(x)}
/* typography: keep numbers with their units, formulas in one piece, and (in Russian) short words with the next one */
const NB=' ',UN='(?:(?:мк|[кмМµн])?(?:В|А|Ом|Ф|Гн|Вт|Дж|Гц|Кл)|мс|мкс|с|[kmMµn]?(?:V|A|Ω|F|H|W|J|Hz)|ms|µs|s|°C|%)';
const RX_U=new RegExp('(\\d) (?='+UN+'(?![\\p{L}]))','gu');
/* the last "= value" of an equation stays on the line with its value */
const RX_END=/ = (?=(?:<b>)?[^\s<]{1,12}(?: [^\s<]{1,8}){0,3}(?:<\/b>)?(?:[.,;:!?)](?=\s|$|<)|\s\(|<br>|\s*$))/g;
function typo(r){if(typeof r!=='string'||r.length<3)return r;
  r=r.replace(RX_U,'$1'+NB).replace(/ ([×\/·≈+−]) /g,NB+'$1'+NB)
   .replace(/(^|[ \n>(:;«])([^\s<>]{1,4}) = /gu,'$1$2'+NB+'='+NB)
   .replace(RX_END,NB+'='+NB).replace(/ = /g,NB+'= ').replace(/ (=|≈)$/,NB+'$1').replace(/ —/g,NB+'—')
   .replace(/(\d) (из|of) (?=\d)/g,'$1'+NB+'$2'+NB).replace(/: (?=\d+\u00a0(?:из|of)\u00a0)/g,':'+NB).replace(/(\d) (верно|right|в точку)/g,'$1'+NB+'$2').replace(/([\p{L}\d])–([\p{L}\d])/gu,'$1\u2060–\u2060$2').replace(/\((\p{L}+) (?=\d)/gu,'($1'+NB)
   .replace(/ ([^\s<>]{1,2}[.,;:!?])(?=\s|$|<)/g,NB+'$1');
  if(lang==='ru')r=r.replace(/(?<=^|[ \t\n>(«„]|[^\d\s]\u00a0)(в|к|с|у|о|я|и|а|не|из|на|по|за|до|от|во|ко|со|об|при|для|без|под|над|про|что|как|где) /giu,'$1'+NB);
  return r}
function t(s){let r=s;if(lang!=='en'&&typeof s==='string'){if(D[s]!=null)r=D[s];else{const k=s.trim();if(k!==s&&D[k]!=null)r=s.replace(k,D[k]);else if(/[A-Za-z]{2}/.test(s))miss.add(k)}}
  if(arguments.length>1){const a=arguments;r=String(r).replace(/\{(\d+)\}/g,(m,i)=>a[+i+1]!=null?a[+i+1]:m)}return typo(r)}
const u=x=>lang!=='en'&&UNITS[lang]&&UNITS[lang][x]||x;
const PR=new Intl.PluralRules(locale);
/* plural: pl(n,{one,few,many,other}) */
const pl=(n,f)=>f[PR.select(n)]||f.other;
/* deep-translate the strings of a data object (pedagogy data) */
function deep(o){if(typeof o==='string')return t(o);if(Array.isArray(o))return o.map(deep);if(o&&typeof o==='object'){const r={};for(const k in o)r[k]=k==='href'?o[k]:deep(o[k]);return r}return o}
/* translate the static page: text nodes and a few attributes whose trimmed English text is a key */
const ATTR=['aria-label','placeholder','title','alt'];
function apply(root){if(lang==='en')return;root=root||document.body;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode&&/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)?2:1});
  const ns=[];while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>{const s=n.nodeValue,k=s.trim();if(!k)return;const v=t(k);if(v!==k)n.nodeValue=s.replace(k,v)});
  root.querySelectorAll('['+ATTR.join('],[')+']').forEach(e=>ATTR.forEach(a=>{const v=e.getAttribute(a);if(v&&v.trim()){const r=t(v.trim());if(r!==v.trim())e.setAttribute(a,r)}}));
  document.title=t(document.title);
  document.querySelectorAll('meta[name=description],meta[property="og:title"],meta[property="og:description"]').forEach(m=>m.setAttribute('content',t(m.getAttribute('content'))))}
/* the EN / RU switch */
function setLang(l){try{localStorage.setItem('lang',l)}catch(_){}const q=new URLSearchParams(location.search);q.set('lang',l);location.search=q.toString()}
function switcher(){const w=document.createElement('div');w.className='langsw';w.setAttribute('role','group');w.setAttribute('aria-label',lang==='ru'?'Язык':'Language');
  Object.keys(SUP).forEach(l=>{const b=document.createElement('button');b.type='button';b.lang=l;b.textContent=l.toUpperCase();b.setAttribute('aria-pressed',l===lang);
    b.setAttribute('aria-label',l==='ru'?'Русский':'English');b.onclick=()=>{if(l!==lang)setLang(l)};w.appendChild(b)});return w}
window.I18N={lang,locale,t,nf,u,pl,deep,apply,switcher,setLang,add:o=>Object.assign(D,o),miss};
/* load the dictionaries for this page before the page scripts run */
if(lang!=='en'){const m=location.pathname.match(/(lesson\d+|prefixes)/),page=m?m[1]:'hub',v='?v=15';
  document.write('<script src="/electronics/i18n/'+lang+'.js'+v+'"><\/script><script src="/electronics/i18n/'+lang+'.'+page+'.js'+v+'"><\/script>')}
/* alternate-language links for search engines */
{const base=location.origin+location.pathname;Object.keys(SUP).forEach(l=>{const k=document.createElement('link');k.rel='alternate';k.hreflang=l;k.href=base+(l==='en'?'':'?lang='+l);document.head.appendChild(k)})}
const css=document.createElement('style');css.textContent=`.langsw{display:inline-flex;gap:2px;margin-left:auto;padding:2px;border-radius:999px;background:rgba(140,160,255,.08);border:1px solid rgba(140,160,255,.16)}
.langsw button{min-height:28px!important;min-width:36px;padding:0 10px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#8f9bc4!important;font:600 13px/1 Manrope,sans-serif!important;cursor:pointer;position:relative}
.langsw button::after{content:'';position:absolute;inset:-8px -2px}
.langsw button[aria-pressed=true]{background:rgba(91,156,255,.22)!important;color:#eef1ff!important}
.langsw button:hover{color:#eef1ff!important}`;document.head.appendChild(css);
})();
