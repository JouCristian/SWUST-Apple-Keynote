/* Universal visual-quality core. Case-specific assertions live in showcase-visual-fixtures.cjs. */
'use strict';
const gates=['Interactive Contrast','Text Readability','Spatial Collision','Geometric Alignment','Motion Continuity','Material Fidelity','Responsive Safety','Accessibility','Runtime & Performance'];
function install(config){
 const cfg=config,probe=window.__qualityProbe={};
 const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom});
 const sel=e=>{if(e.id)return '#'+CSS.escape(e.id);const bits=[];for(let n=e;n&&n!==document.body&&bits.length<5;n=n.parentElement){const siblings=[...n.parentElement?.children||[]].filter(x=>x.tagName===n.tagName);bits.unshift(n.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(n)+1)+')')}return bits.join(' > ')||'body'};
 const visible=e=>{if(!e||!e.getClientRects().length)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.025)return false}return true};
 const rgb=s=>{const v=s.match(/[\d.]+/g)?.map(Number);return v&&v.length>=3?v:null};
 const luminance=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
 probe.describe=sel;probe.visible=visible;
 probe.inspect=e=>{const s=getComputedStyle(e),foreground=rgb(s.color);let bg=[255,255,255],complex=[],chain=[];
  for(let n=e;n;n=n.parentElement)chain.unshift(n);
  for(const n of chain){const t=getComputedStyle(n);if(t.backgroundImage!=='none')complex.push('image/gradient');if(t.backdropFilter&&t.backdropFilter!=='none')complex.push('backdrop-filter');if(t.filter!=='none')complex.push('filter');if(Number(t.opacity)<.999)complex.push('group-opacity');const c=rgb(t.backgroundColor);if(c){const alpha=c[3]??1;bg=bg.map((v,i)=>v*(1-alpha)+c[i]*alpha)}}
  // Nearby canvas/video/SVG behind translucent text cannot be reconstructed from two CSS colors.
  if(e.closest('[data-renderer],.glass,.optical-surface,[data-qa-material]'))complex.push('material');
  const er=e.getBoundingClientRect();if([...document.querySelectorAll('canvas,svg,img,video')].some(n=>{if(!visible(n)||e.contains(n))return false;const r=n.getBoundingClientRect();return Math.min(er.right,r.right)>Math.max(er.left,r.left)&&Math.min(er.bottom,r.bottom)>Math.max(er.top,r.top)}))complex.push('overlapping image/vector pixels');
  const c=foreground?contrast(foreground,bg):null,large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700),disabled=!!e.closest(':disabled,[aria-disabled=true]');
  return {element:sel(e),text:(e.getAttribute('aria-label')||e.innerText||e.value||'').trim().slice(0,100),foreground:s.color,composedBackground:bg,complex:[...new Set(complex)],contrast:c,threshold:disabled?null:large?3:4.5,disabled,fontSize:parseFloat(s.fontSize),outline:s.outline,boxShadow:s.boxShadow,rect:rect(e.getBoundingClientRect()),tabIndex:e.tabIndex};
 };
 probe.snapshot=(root,page)=>{
  const records=[],box=root.getBoundingClientRect(),viewport={width:innerWidth,height:innerHeight};
  const add=(gate,status,element,actual,threshold,suggestion)=>records.push({page,gate,status,element,actual,threshold,suggestion});
  const outside=(a,b,t=2)=>a.left<b.left-t||a.top<b.top-t||a.right>b.right+t||a.bottom>b.bottom+t;
  const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
  const ignored=e=>e.closest('[data-qa-ignore]');
  const leaves=[...root.querySelectorAll('h1,h2,h3,h4,p,li,pre,code,label,small,span,button,a,[data-qa-text]')].filter(e=>visible(e)&&!ignored(e)&&[...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
  for(const e of leaves){const s=getComputedStyle(e),r=e.getBoundingClientRect(),id=sel(e),range=document.createRange();range.selectNodeContents(e);const lines=[...range.getClientRects()].filter(r=>r.width&&r.height);
   if(outside(r,box)&&root!==document.body)add(2,'FAIL',id,{reason:'outside page',rect:rect(r),pageBounds:rect(box)},'within page bounds','Reflow or move content into the page safe area.');
   if(e.scrollWidth>e.clientWidth+3&&e.clientWidth&&s.whiteSpace!=='nowrap')add(2,'FAIL',id,{reason:'horizontal overflow',scroll:e.scrollWidth,client:e.clientWidth},'no unintended overflow','Wrap/split content or enlarge the content area.');
   for(let parent=e.parentElement;parent&&parent!==root;parent=parent.parentElement){const p=getComputedStyle(parent);if(['hidden','clip'].includes(p.overflow)||['hidden','clip'].includes(p.overflowY)){if(lines.some(line=>outside(line,parent.getBoundingClientRect(),3))){add(2,e.closest('[data-qa-truncate]')?'REVIEW':'FAIL',id,{reason:'text clipped by ancestor',ancestor:sel(parent)},'readable text bounds','Reserve enough space or explicitly document intentional truncation.');break}}}
   const min=e.closest('button,a,label,.deck-controls,[data-qa-ui]')?(cfg.minControlFontSize||12):(cfg.minFontSize||24);
   if(parseFloat(s.fontSize)<min)add(2,'REVIEW',id,{reason:'projection font size',logicalFontSize:parseFloat(s.fontSize)},min,'Review readability at the intended projector distance.');
   const occupied=[];for(const line of lines)if(!occupied.some(other=>Math.min(line.bottom,other.bottom)-Math.max(line.top,other.top)>Math.min(line.height,other.height)*.5))occupied.push(line);
   const expected=e.dataset.qaLines;if(expected&&occupied.length>Number(expected))add(2,'FAIL',id,{reason:'unexpected line wrap',lines:occupied.length},Number(expected),'Adjust layout or the declared line budget.');
   if(e.dataset.qaUnoccluded==='true'){const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(top&&!e.contains(top)&&!top.contains(e))add(2,'FAIL',id,{reason:'declared text obscured',cover:sel(top)},'unoccluded','Separate the covering region.');}
   if(!e.matches('button,a,[role=button],[data-qa-control]')){const v=probe.inspect(e);if(v.complex.length)add(2,'REVIEW',id,{reason:'contrast requires rendered backdrop review',...v},v.threshold,'Inspect the screenshot/composited background; CSS-only contrast is inconclusive.');else if(v.contrast!==null&&v.contrast<v.threshold)add(2,'FAIL',id,{reason:'text contrast',...v},v.threshold,'Choose a readable foreground/background pair.');}
  }
  const boxes=[...root.querySelectorAll('article,.card,[data-qa-card],[data-qa-collision]')].filter(e=>visible(e)&&!ignored(e));
  const candidates=[...new Set([...boxes,...leaves.filter(e=>!e.matches('span,small,code,label,button,a'))])];
  for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
   const a=candidates[i],b=candidates[j];if(a.contains(b)||b.contains(a))continue;
   if(a.closest('svg,dialog[open],[role=dialog]')||b.closest('svg,dialog[open],[role=dialog]'))continue;
   if(a.closest('[data-qa-allow-overlap]')||b.closest('[data-qa-allow-overlap]'))continue;
   if((cfg.allowOverlap||[]).some(rule=>(a.matches(rule.a)&&b.matches(rule.b))||(a.matches(rule.b)&&b.matches(rule.a))))continue;
   const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();if(!overlaps(ar,br))continue;
   // Multiple leaves inside the same declared card are legitimate unless explicitly exclusive.
   const exclusive=a.dataset.qaCollision==='deny'&&b.dataset.qaCollision==='deny';if(!exclusive&&a.closest('article,.card,[data-qa-card]')===b.closest('article,.card,[data-qa-card]')&&a.closest('article,.card,[data-qa-card]'))continue;
   add(3,exclusive?'FAIL':'REVIEW',sel(a)+' <> '+sel(b),{a:rect(ar),b:rect(br),declaredExclusive:exclusive},'no unintended overlap','Reserve separate tracks or declare an intentional overlap with a reason.');
  }
  const alignments=[...(cfg.alignments||[]),...[...root.querySelectorAll('[data-qa-align]')].map(e=>({container:sel(e),child:e.dataset.qaAlignChild||':scope > button',axis:e.dataset.qaAlign||'both',tolerance:Number(e.dataset.qaTolerance||2)}))];
  for(const rule of alignments){const parent=document.querySelector(rule.container),child=parent?.querySelector(rule.child);if(!parent||!child){add(4,'ERROR',rule.container,{reason:'alignment selector not found'},rule,'Correct the declared semantic selectors.');continue}if(!root.contains(parent)||!visible(parent)||!visible(child))continue;const a=parent.getBoundingClientRect(),b=child.getBoundingClientRect(),scale=parent.offsetWidth?a.width/parent.offsetWidth:1,dx=Math.abs((b.left-a.left)-(a.right-b.right))/scale,dy=Math.abs((b.top-a.top)-(a.bottom-b.bottom))/scale,t=rule.tolerance??2,fail=(rule.axis!=='y'&&dx>t)||(rule.axis!=='x'&&dy>t);add(4,fail?'FAIL':'PASS',sel(child),{horizontalGapDifference:dx,verticalGapDifference:dy,logicalScale:scale},t,'Use a coherent control slot/flex alignment; do not patch with arbitrary top offsets.');}
  for(const e of root.querySelectorAll('.capsule,.segments,[role=toolbar],[role=dialog]'))if(visible(e)&&!e.hasAttribute('data-qa-align'))add(4,'REVIEW',sel(e),{reason:'centering intent undeclared'},'data-qa-align or alignment config','Declare the intended control slot and axis before judging geometric centering.');
  for(const e of root.querySelectorAll('[data-renderer],[data-qa-material]')){if(!visible(e))continue;const renderer=e.dataset.renderer||'undeclared',bg=e.dataset.qaBackground,missing=bg&&!document.querySelector(bg);const actual={renderer,backgroundDeclared:bg||null,canvas:!!e.querySelector('canvas'),svg:!!e.querySelector('svg')};add(6,missing?'FAIL':renderer==='WebGL'&&!actual.canvas?'FAIL':'REVIEW',sel(e),actual,'honest renderer/input/fallback','Confirm actual pixel displacement and fallback with project-specific states; aesthetics are reviewed by a human.');}
  const images=[...root.querySelectorAll('img')].filter(visible);for(const e of images)if(!e.complete||!e.naturalWidth)add(9,'FAIL',sel(e),{reason:'image unavailable'},'loaded resource','Embed or repair the required asset.');
  if(root!==document.body&&outside(box,{left:0,top:0,right:innerWidth,bottom:innerHeight},2))add(7,'FAIL',sel(root),{pageBounds:rect(box),viewport},'page inside viewport','Use equal-scale fitting or a suitable responsive layout.');
  if(document.documentElement.scrollWidth>innerWidth+3)add(7,'FAIL','html',{scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth},'no unintended horizontal scroll','Correct fixed-width overflow.');
  for(const e of root.querySelectorAll('button,a,input,select,textarea,[role=button],[data-qa-control]')){if(!visible(e)||e.disabled)continue;const label=(e.getAttribute('aria-label')||e.textContent||e.title||e.getAttribute('placeholder')||'').trim(),labels=e.labels&&[...e.labels].map(x=>x.textContent).join('');if(!label&&!labels)add(8,'FAIL',sel(e),{reason:'missing accessible name'},'accessible label','Add a visible label or aria-label.');if(e.matches('[role=button],[data-qa-control]')&&e.tabIndex<0)add(8,'FAIL',sel(e),{reason:'custom control unreachable by keyboard'},'tabIndex >= 0','Provide keyboard reachability and activation semantics.');}
  return records;
 };
 probe.frame=(root,page)=>{const records=[],parentBoxes=[...root.querySelectorAll('[data-qa-track]')];for(const p of parentBoxes){const a=p.getBoundingClientRect();for(const e of p.querySelectorAll('[data-qa-moving]')){const b=e.getBoundingClientRect();if(visible(e)&&(b.left<a.left-2||b.right>a.right+2||b.top<a.top-2||b.bottom>a.bottom+2))records.push({page,gate:3,status:'FAIL',element:sel(e),actual:{reason:'motion exceeds declared track',track:rect(a),moving:rect(b)},threshold:'inside track each sampled RAF',suggestion:'Clamp rendered geometry or reserve a larger motion-safe track.'})}}return records};
}
async function initialize(page,config){await page.evaluate(install,config)}
async function snapshot(page,selector,index){return page.evaluate(({selector,index})=>{const root=document.querySelectorAll(selector)[index];if(!root)throw Error('Page selector/index missing');return __qualityProbe.snapshot(root,index+1)},{selector,index})}
async function inspect(locator){return locator.evaluate(e=>__qualityProbe.inspect(e))}
function summarize(records){const priority=['ERROR','FAIL','REVIEW','PASS','SKIP'];return gates.map((name,i)=>{const items=records.filter(r=>r.gate===i+1),counts=Object.fromEntries(priority.map(s=>[s,items.filter(r=>r.status===s).length]));return {gate:i+1,name,status:priority.find(s=>counts[s])||'SKIP',counts}})}
module.exports={gates,initialize,snapshot,inspect,summarize};
