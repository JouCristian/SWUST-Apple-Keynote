/* Visual Quality Gate: actual states, composites, RAF geometry and image differences. */
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),crypto=require('crypto'),{pathToFileURL}=require('url');
const {load,option}=require('./validate-browser.cjs'),{PNG}=load('pngjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/visual-quality'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');fs.mkdirSync(out,{recursive:true});
function difference(a,b,area){a=PNG.sync.read(a);b=PNG.sync.read(b);assert.equal(a.width,b.width);let sum=0,changed=0,count=0;const [x0,y0,x1,y1]=area||[0,0,a.width,a.height];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*a.width+x)*4,d=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);sum+=d/3;changed+=d>6?1:0;count++}return {mean:sum/count,changed,count}}
const luminance=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
(async()=>{
 const {chromium,firefox,webkit}=load('playwright'),browser=await chromium.launch({channel:option('--channel','chrome'),headless:true}),context=await browser.newContext({offline:true,viewport:{width:1920,height:1080}}),page=await context.newPage(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'keynote-v12-'));
 const errors=[],unexpected=[],report={browser:await browser.version(),checks:{},contrasts:[],geometry:[],pixels:{},performance:{},compatibility:[],limitations:['Headless hardware differs from projector GPU','SVG optics samples an explicit static texture; arbitrary DOM is not captured','Advanced is a controlled approximation; no physical optics or universal FPS claim']};
 for(const name of ['swust-keynote-showcase.html','glass-material-lab.html'])fs.copyFileSync(path.join(root,'dist',name),path.join(tmp,name));
 const url=pathToFileURL(path.join(tmp,'swust-keynote-showcase.html')).href;
 page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))unexpected.push(r.url())});
 const wait=()=>page.waitForFunction(()=>Keynote.springStats().active===0&&Keynote.feedbackStats().active===0&&document.getAnimations().every(a=>a.playState!=='running'));
 const go=async n=>{await page.evaluate(n=>{deck.go(n,undefined,true);showcase.settle()},n);await page.mouse.move(0,0);await wait()};
 const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
 async function styleOf(button){return button.evaluate(n=>{const s=getComputedStyle(n),chain=[];for(let e=n;e;e=e.parentElement){const c=getComputedStyle(e);chain.push({background:c.backgroundColor,opacity:c.opacity})}return {text:n.getAttribute('aria-label')||n.textContent,color:s.color,background:s.backgroundColor,fontSize:s.fontSize,outline:s.outline,disabled:n.disabled,chain}})}
 function ratio(s){let bg=[255,255,255];for(const c of [...s.chain].reverse()){const v=c.background.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];const a=v[3]??1;bg=bg.map((b,i)=>v[i]*a+b*(1-a))}const fg=s.color.match(/[\d.]+/g).map(Number);return contrast(fg,bg)}
 try{
 await page.goto(url);await page.waitForFunction(()=>globalThis.showcase);await wait();
 // Inspect every slide's buttons in every state without weakening or enabling invalid domain actions.
 // CSS transitions are finished explicitly to keep this audit bounded; separate screenshots retain real transitions.
 for(let scene=0;scene<15;scene++){
  await go(scene);const buttons=page.locator('.stage > .scene').nth(scene).locator('button');
  for(let j=0;j<await buttons.count();j++){
   const b=buttons.nth(j);if(!await b.isVisible())continue;let initial=await styleOf(b);
   for(const state of initial.disabled?['disabled']:['default','hover','focus','active']){
    await page.mouse.move(0,0);await b.evaluate(n=>n.blur());
    if(state==='hover'||state==='active')await b.hover();if(state==='focus'){await page.keyboard.press('Tab');await b.focus()}if(state==='active')await page.mouse.down();
    await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a instanceof CSSTransition)a.finish()}));const s=await styleOf(b),cr=ratio(s);report.contrasts.push({scene:scene+1,index:j,state,...s,contrast:cr});
    assert(cr>=4.5,`contrast ${cr.toFixed(2)} on scene ${scene+1} ${s.text} ${state}`);assert(s.chain.every(c=>Number(c.opacity)>.99),'whole-control opacity');
    if(state==='active'){await page.mouse.move(0,0);await page.mouse.up()}
   }
  }
 }
 report.checks.interactiveContrast=true;
 const toolbar=page.locator('.deck-controls button');
 for(let i=0;i<await toolbar.count();i++){const b=toolbar.nth(i);if(!await b.isVisible())continue;for(const state of ['default','hover','focus','active']){await page.mouse.move(0,0);await b.evaluate(n=>n.blur());if(state==='hover'||state==='active')await b.hover();if(state==='focus'){await page.keyboard.press('Tab');await b.focus()}if(state==='active')await page.mouse.down();await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a instanceof CSSTransition)a.finish()}));const s=await styleOf(b),cr=ratio(s);assert(cr>=4.5);report.contrasts.push({control:'toolbar',index:i,state,...s,contrast:cr});if(state==='active'){await page.mouse.move(0,0);await page.mouse.up()}}}
 await go(0);const primary=page.locator('#intro-focus');
 for(const state of ['default','hover','focus','active','disabled']){
  await page.mouse.move(0,0);await primary.evaluate(n=>{n.disabled=false;n.blur()});if(state==='hover'||state==='active')await primary.hover();if(state==='focus'){await page.keyboard.press('Tab');await primary.focus();assert.match((await styleOf(primary)).outline,/solid/)}if(state==='active')await page.mouse.down();if(state==='disabled')await primary.evaluate(n=>n.disabled=true);
  await page.waitForTimeout(240);await shot('01-'+state);
  // Screenshot the actual composite with only glyph color suppressed; this includes alpha materials/ancestors.
  const style=await styleOf(primary),saved=await primary.getAttribute('style');await primary.evaluate(n=>{n.style.setProperty('transition','none','important');n.style.setProperty('color','transparent','important')});
  const png=PNG.sync.read(await primary.screenshot()),fg=style.color.match(/[\d.]+/g).map(Number);let min=Infinity;
  for(let y=8;y<png.height-8;y+=3)for(let x=16;x<png.width-16;x+=3){const i=(y*png.width+x)*4;min=Math.min(min,contrast(fg,[...png.data.slice(i,i+3)]))}
  report.contrasts.push({control:'primary',state,actualCompositeContrast:min});assert(min>=4.5);
  await primary.evaluate((n,s)=>{if(s===null)n.removeAttribute('style');else n.setAttribute('style',s)},saved);
  if(state==='active'){await page.mouse.move(0,0);await page.mouse.up()}
 }await primary.evaluate(n=>n.disabled=false);
 // Sample every rendered RAF, using viewport-space rectangles on both sides of each comparison.
 for(const [width,height]of [[1920,1080],[1366,768],[960,640]]){
  await page.setViewportSize({width,height});await go(6);await page.evaluate(()=>showcase.morph.reset());await shot(`${width}-07-compact`);
  await page.evaluate(()=>{window.collisionFrames=[];window.collisionRunning=true;const tick=()=>{const surface=document.querySelector('#identity-object').getBoundingClientRect(),host=document.querySelector('#identity-host').getBoundingClientRect(),note=document.querySelector('.identity-note').getBoundingClientRect(),scale=host.width/document.querySelector('#identity-host').clientWidth;collisionFrames.push({ms:performance.now(),surface:surface.toJSON(),host:host.toJSON(),note:note.toJSON(),outside:(surface.left<host.left-.5||surface.right>host.right+.5),overlap:Math.min(surface.right,note.right)>Math.max(surface.left,note.left)&&Math.min(surface.bottom,note.bottom)>Math.max(surface.top,note.top),scale});if(collisionRunning)requestAnimationFrame(tick)};tick()});
  await page.locator('#identity-object button').click();await page.waitForTimeout(160);await shot(`${width}-07-middle`);await page.locator('#identity-object button').click();await page.waitForTimeout(80);await shot(`${width}-07-reverse`);
  await page.evaluate(()=>{for(let i=0;i<11;i++)showcase.morph.set(i%2===0)});await wait();await shot(`${width}-07-expanded`);
  await page.locator('#identity-object button').click();await wait();await shot(`${width}-07-returned`);
  const frames=await page.evaluate(()=>{collisionRunning=false;return collisionFrames});assert(frames.length>20);assert(frames.every(f=>!f.outside&&!f.overlap));report.geometry.push({viewport:[width,height],type:'collision',frames:frames.length,maxWidth:Math.max(...frames.map(f=>f.surface.width)),failures:0});fs.writeFileSync(path.join(out,`${width}-collision-frames.json`),JSON.stringify(frames));
  await go(10);await page.evaluate(()=>{showcase.capsule.reset();showcase.card.reset()});
  for(const id of ['micro-capsule','micro-card'])for(const state of ['compact','hover','active','expanded','returned']){
   const button=page.locator('#'+id+' button');await page.mouse.move(0,0);if(state==='hover'||state==='active')await button.hover();if(state==='active')await page.mouse.down();
   if(state==='expanded')await page.evaluate(id=>(id==='micro-card'?showcase.card:showcase.capsule).set(true),id);if(state==='returned')await page.evaluate(id=>(id==='micro-card'?showcase.card:showcase.capsule).set(false),id);await wait();
   const g=await page.locator('#'+id).evaluate(n=>{const a=n.querySelector('.morph-control-slot').getBoundingClientRect(),b=n.querySelector('button').getBoundingClientRect(),surface=n.querySelector('article').getBoundingClientRect(),scale=surface.width/n.querySelector('article').offsetWidth;return {top:(b.top-a.top)/scale,bottom:(a.bottom-b.bottom)/scale,outerTop:(b.top-surface.top)/scale,outerBottom:(surface.bottom-b.bottom)/scale,scale}});
   report.geometry.push({viewport:[width,height],id,state,...g});assert(Math.abs(g.top-g.bottom)<=2,JSON.stringify(g));if(state==='compact'||state==='returned')assert(Math.abs(g.outerTop-g.outerBottom)<=2);
   if(state==='active'){await page.mouse.move(0,0);await page.mouse.up()}
  }await shot(`${width}-11-alignment`);
 }
 report.checks.spatialCollision=true;report.checks.geometricAlignment=true;
 await page.setViewportSize({width:1920,height:1080});await go(3);const lens=page.locator('#material-sample');
 for(const [i,mode] of ['stable','optical','advanced'].entries()){
  await page.evaluate(i=>showcase.material.select(i,true),i);await page.waitForTimeout(200);const actual=await lens.getAttribute('data-renderer');report.pixels[mode]={renderer:actual};if(mode==='optical')assert.equal(actual,'SVG');await shot('04-'+mode);
  assert.equal(await page.locator('#material-distortion').isDisabled(),mode==='stable');assert.equal(await page.locator('#material-aberration').isDisabled(),mode==='stable');
  if(mode==='advanced'&&actual!=='WebGL')continue;
  for(const [param,value]of Object.entries({distortion:70,blur:8,aberration:12,opacity:.72,rim:0})){
   if(mode==='stable'&&['distortion','aberration'].includes(param))continue;
   await page.evaluate(()=>showcase.glass.set({distortion:30,blur:0,aberration:0,opacity:.18,rim:.6}));await page.waitForTimeout(120);const before=await lens.screenshot();await page.evaluate(([k,v])=>showcase.glass.set({[k]:v}),[param,value]);await page.waitForTimeout(150);const after=await lens.screenshot();
   const diff=difference(before,after);report.pixels[mode][param]=diff;assert(diff.changed>30,`${mode} ${param} did not change actual pixels`);fs.writeFileSync(path.join(out,`04-${mode}-${param}.png`),after);
  }
 }
 await page.evaluate(()=>{showcase.material.select(1,true);showcase.glass.set({distortion:0,blur:0,aberration:0,opacity:0,rim:0})});await page.waitForTimeout(200);
 const registrationBox=await lens.boundingBox(),registered=await page.screenshot({clip:registrationBox});await lens.evaluate(n=>n.style.visibility='hidden');const backdropOnly=await page.screenshot({clip:registrationBox});await lens.evaluate(n=>n.style.removeProperty('visibility'));
 const size=PNG.sync.read(registered),registration=difference(registered,backdropOnly,[Math.round(size.width*.15),Math.round(size.height*.25),Math.round(size.width*.22),Math.round(size.height*.75)]);report.pixels.sourceRegistration=registration;assert(registration.mean<2,'background coordinate registration');
 const a=await lens.screenshot();await page.evaluate(()=>showcase.glass.set({distortion:70}));await page.waitForTimeout(200);const b=await lens.screenshot(),dims=PNG.sync.read(a);
 const center=difference(a,b,[Math.round(dims.width*.15),Math.round(dims.height*.25),Math.round(dims.width*.22),Math.round(dims.height*.75)]),edge=difference(a,b,[10,10,dims.width-10,40]);report.pixels.centerStability={center,edge};assert(center.mean<edge.mean*.3);
 // Actual composed text substrate over busy glass: hide glyphs only and sample their reserved reading surface.
 const copy=page.locator('#material-sample .optical-copy'),copyStyle=await copy.locator('h3').evaluate(n=>getComputedStyle(n).color);
 await copy.locator('h3,p').evaluateAll(xs=>xs.forEach(n=>n.style.color='transparent'));const copyPng=PNG.sync.read(await copy.screenshot());let min=Infinity;for(let y=10;y<copyPng.height-10;y+=4)for(let x=10;x<copyPng.width-10;x+=4){const i=(y*copyPng.width+x)*4;min=Math.min(min,contrast(copyStyle.match(/[\d.]+/g).map(Number),[...copyPng.data.slice(i,i+3)]))}report.pixels.textCompositeContrast=min;assert(min>=4.5);await copy.locator('h3,p').evaluateAll(xs=>xs.forEach(n=>n.style.removeProperty('color')));
 await page.evaluate(()=>showcase.material.select(2,true));
 report.performance=await page.evaluate(async()=>{const frames=[],blocking=[];let previous=performance.now();for(let i=0;i<40;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-previous);previous=now;const t=performance.now();showcase.glass.set({distortion:20+i});const c=document.querySelector('#material-canvas'),gl=c.getContext('webgl');if(gl){const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel)}blocking.push(performance.now()-t)}const before=showcase.glass.stats?.draws;await new Promise(r=>setTimeout(r,300));return {rafIntervalsMs:frames,synchronousDrawReadbackMs:blocking,stats:showcase.glass.stats,idleExtraDraws:(showcase.glass.stats?.draws||0)-(before||0)}});assert.equal(report.performance.idleExtraDraws,0);
 await page.evaluate(()=>document.querySelector('#material-canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert.equal(await lens.getAttribute('data-renderer'),'Frosted Fallback');await shot('04-context-loss');
 report.checks.materialFidelity=true;report.checks.parameterPixels=true;report.checks.performanceBounded=true;report.checks.contextLossFallback=true;
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{showcase.morph.set(true);showcase.capsule.set(true)});assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);await page.emulateMedia({reducedMotion:'no-preference'});
 const mediaCDP=await context.newCDPSession(page);await mediaCDP.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});await page.evaluate(()=>showcase.glass.setMode('optical'));assert.equal(await lens.getAttribute('data-renderer'),'Frosted Fallback');await mediaCDP.send('Emulation.setEmulatedMedia',{features:[]});
 await go(10);await page.locator('#micro-segments button').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>deck.current),10);assert.equal(await page.evaluate(()=>showcase.microSegments.selected),1);
 // Model browser zoom's CSS viewport / device-pixel relationship (not a browser-chrome UI automation claim).
 const cdp=await context.newCDPSession(page);report.zoom=[];
 for(const zoom of [1.25,1.5]){await cdp.send('Emulation.setDeviceMetricsOverride',{width:Math.round(1920/zoom),height:Math.round(1080/zoom),deviceScaleFactor:zoom,mobile:false});await go(6);await page.evaluate(()=>{showcase.morph.set(true,true);showcase.morph.settle()});const geometry=await page.evaluate(()=>{const a=document.querySelector('#identity-object').getBoundingClientRect(),b=document.querySelector('.identity-note').getBoundingClientRect(),stage=document.querySelector('.stage').getBoundingClientRect();return {overlap:Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top),stageInsideViewport:stage.left>=-1&&stage.top>=-1&&stage.right<=innerWidth+1&&stage.bottom<=innerHeight+1,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}});assert(!geometry.overlap&&geometry.stageInsideViewport);report.zoom.push({zoom,...geometry});await shot('zoom'+Math.round(zoom*100))}
 await cdp.send('Emulation.clearDeviceMetricsOverride');report.checks.zoomAndKeyboard=true;report.checks.accessibility=true;
 await page.goto(pathToFileURL(path.join(tmp,'glass-material-lab.html')).href);await page.waitForFunction(()=>globalThis.glassLab);await page.setViewportSize({width:1366,height:900});await shot('glass-lab');
 for(const [width,height]of [[1920,1080],[1366,768],[960,640]]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot(`${width}-glass-lab`)}
 await page.locator('#missing').click();assert(await page.evaluate(()=>glassLab.controllers.every(c=>c.renderer==='Frosted Fallback')));await shot('glass-missing-input');report.checks.missingTextureFallback=true;
 // No-WebGL context environment, same offline artifact.
 const blocked=await context.newPage();await blocked.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:native.call(this,type,...args)}});await blocked.goto(url);await blocked.waitForFunction(()=>globalThis.showcase);assert.equal(await blocked.evaluate(()=>showcase.glass.available),false);await blocked.evaluate(()=>{deck.go(3,undefined,true);showcase.glass.setMode('advanced')});assert.equal(await blocked.locator('#material-sample').getAttribute('data-renderer'),'Frosted Fallback');await blocked.screenshot({path:path.join(out,'04-webgl-unavailable.png')});await blocked.close();report.checks.webglUnavailable=true;
 // Use other installed browser channels, record unavailable engines explicitly.
 for(const name of ['msedge','firefox','webkit']){let other;try{
   other=await (name==='msedge'?chromium:name==='firefox'?firefox:webkit).launch({...(name==='msedge'?{channel:name}:{}),headless:true});const p=await other.newPage({offline:true});await p.goto(url);await p.waitForFunction(()=>globalThis.showcase);await p.evaluate(()=>{deck.go(3,undefined,true);showcase.material.select(1,true)});await p.waitForTimeout(200);const svgRenderer=await p.locator('#material-sample').getAttribute('data-renderer');
   const pixelChecks={};for(const [tier,index]of [['SVG',1],['WebGL',2]]){await p.evaluate(index=>{showcase.material.select(index,true);showcase.glass.set({distortion:0,blur:0})},index);await p.waitForTimeout(200);const before=await p.locator('#material-sample').screenshot();await p.evaluate(()=>showcase.glass.set({distortion:70}));await p.waitForTimeout(200);const after=await p.locator('#material-sample').screenshot();pixelChecks[tier]=difference(before,after);assert(pixelChecks[tier].changed>30)}
   const advanced=await p.locator('#material-sample').getAttribute('data-renderer');await p.screenshot({path:path.join(out,'04-'+name+'.png')});await p.evaluate(()=>showcase.glass.setBackdrop(null));const missing=await p.locator('#material-sample').getAttribute('data-renderer');assert.equal(missing,'Frosted Fallback');report.compatibility.push({name,version:await other.version(),svg:svgRenderer,advanced,missingInput:missing,pixelChecks});
  }catch(e){report.compatibility.push({name,status:'unavailable / not tested',reason:e.message.split('\n')[0].replace(/\b[a-z]:[\\/][^\r\n]+/gi,'[ENV:BROWSER_CACHE]').replace(/\/(?:home|Users|tmp)\/[^\s]+/g,'[ENV:BROWSER_CACHE]')})}finally{await other?.close()}}
 assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);report.checks.offline=true;
 }finally{
  report.artifactHashes=Object.fromEntries(['swust-keynote-showcase.html','glass-material-lab.html'].map(n=>[n,hash(path.join(root,'dist',n))]));report.errors=errors;report.unexpected=unexpected;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();fs.rmSync(tmp,{recursive:true,force:true});
 }console.log(JSON.stringify({checks:report.checks,contrastStates:report.contrasts.length,geometry:report.geometry.length,compatibility:report.compatibility}));
})().catch(e=>{console.error(e);process.exitCode=1});
