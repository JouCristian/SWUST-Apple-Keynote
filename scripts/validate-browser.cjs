/* Universal offline HTML PPT acceptance runner. No Showcase IDs. */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{pathToFileURL}=require('url');
const core=require('./visual-quality.cjs'),args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
const load=name=>require(require.resolve(name,{paths:[option('--modules',process.cwd()),...((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean)),process.cwd()]}));
const safe=s=>String(s).replace(/file:\/\/[^\s)]+/g,'[INPUT_FILE]').replace(/\b[A-Za-z]:[\\/][^\n"']+/g,'[ENV:PATH]').replace(/\/(?:home|Users|tmp|private\/var)\/[^\s"']+/g,'[ENV:PATH]');
async function validate(file,out,settings={}){
 file=path.resolve(file);const config={minFontSize:24,minControlFontSize:12,...settings};
 const reportPath=path.resolve(config.report||path.join(out||'qa','report.json')),reportDir=path.dirname(reportPath),evidence=path.join(reportDir,path.basename(reportPath,'.json')+'-evidence');fs.mkdirSync(evidence,{recursive:true});
 const records=[],errors=[],unexpected=[],resourceFailures=[],runtime=[];let browser,context,page,adapter,selector,count=0,tmp;
 const sizes=config.viewports||[[1920,1080],[1366,768],[960,640]],checks={};
 const result={schema:3,engine:'Universal Visual Quality Core 1.0',engineHashes:Object.fromEntries(['visual-quality.cjs','validate-browser.cjs'].map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,n))).digest('hex')])),artifact:path.basename(file),artifactSha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),viewports:sizes,records,limitations:['Semantic/aesthetic intent cannot be inferred completely','Gradient/image/backdrop contrast needs rendered-pixel or human review','No automatic universal FPS, optical fidelity, subjective smoothness or memory-leak guarantee']};
 const add=(gate,status,element,actual,threshold,suggestion,extra={})=>records.push({page:1,state:'default',gate,status,element,actual,threshold,suggestion,...extra});
 const capture=async name=>{const dest=path.join(evidence,name+'.png');await page.screenshot({path:dest});return path.relative(reportDir,dest).split(path.sep).join('/')};
 async function navigate(index,instant=true){
  if(adapter==='keynote')await page.evaluate(({index,instant})=>{deck.go(index,undefined,instant);if(instant){Keynote.settleSprings();Keynote.settleFeedback?.();Keynote.cancelAnimations()}},{index,instant});
  else if(adapter==='function')await page.evaluate(({index,name})=>{const parts=name.split('.'),key=parts.pop(),owner=parts.reduce((o,k)=>o?.[k],globalThis);if(typeof owner?.[key]!=='function')throw Error('Configured navigation function missing');owner[key](index)},{index,name:config.navigation.function});
  else if(adapter==='hash'){await page.evaluate(hash=>location.hash=hash,config.navigation.pattern.replace('{index}',String(index+(config.navigation.offset||0))))}
  else if(adapter==='click'){if(index===0&&config.navigation.reset)await page.locator(config.navigation.reset).click();else {const current=globalThis.__runnerIndex||0;for(let j=0;j<Math.abs(index-current);j++)await page.locator(index>current?config.navigation.next:config.navigation.previous).click()}}
  else await page.evaluate(({selector,index,activeClass})=>{document.querySelectorAll(selector).forEach((e,i)=>{e.hidden=i!==index;e.style.visibility=i===index?'visible':'hidden';if(activeClass)e.classList.toggle(activeClass,i===index)})},{selector,index,activeClass:config.navigation?.activeClass});
  globalThis.__runnerIndex=index;await page.waitForTimeout(config.settleMs??90);
 }
 async function action(a){
  if(a.type==='click')await page.locator(a.selector).click();
  else if(a.type==='press')await page.locator(a.selector||'body').press(a.key);
  else if(a.type==='fill')await page.locator(a.selector).fill(String(a.value));
  else if(a.type==='wait')await page.waitForTimeout(Math.min(2000,a.ms||100));
  else if(a.type==='navigate')await navigate(a.index,false);
  else if(a.type==='call')await page.evaluate(a=>{const parts=a.function.split('.'),key=parts.pop(),owner=parts.reduce((o,k)=>o?.[k],globalThis);if(typeof owner?.[key]!=='function')throw Error('Configured action function missing');owner[key](...(a.args||[]))},a);
  else throw Error('Unknown action type '+a.type);
 }
 try{
  const {chromium}=load('playwright');browser=await chromium.launch({channel:config.channel||option('--channel','chrome'),headless:true});result.browser=await browser.version();
  context=await browser.newContext({offline:true});page=await context.newPage();
  page.on('pageerror',e=>errors.push(safe(e.message)));page.on('console',m=>{if(m.type()==='error')errors.push(safe(m.text()))});page.on('requestfailed',r=>resourceFailures.push({resource:safe(r.url()),reason:safe(r.failure()?.errorText)}));
  let target=file;
  if(config.resourceMode!=='adjacent'){tmp=fs.mkdtempSync(path.join(os.tmpdir(),'keynote-universal-'));target=path.join(tmp,'presentation.html');fs.copyFileSync(file,target)}
  const url=pathToFileURL(target).href;page.on('request',r=>{if(!r.url().startsWith('data:')&&!r.url().startsWith('file:'))unexpected.push(safe(r.url()))});
  await page.goto(url,{waitUntil:'load'});await page.waitForTimeout(100);
  const discovery=await page.evaluate(cfg=>{let selector=cfg.pages||'[data-qa-page],.stage > .scene,.slides > section,.slide';if(!document.querySelector(selector)){if(cfg.pages)throw Error('Configured page selector matched no pages');selector='body'}return {selector,count:document.querySelectorAll(selector).length,keynote:!!(globalThis.deck?.slides&&globalThis.Keynote&&typeof deck.go==='function')}},config);
  selector=discovery.selector;count=discovery.count;adapter=config.navigation?.type||(discovery.keynote?'keynote':'reveal');result.pageSelector=selector;result.navigation=adapter;result.slideCount=count;
  if(!['keynote','function','hash','click','reveal'].includes(adapter))throw Error('Unsupported navigation adapter');
  await core.initialize(page,config);const initialNodes=await page.evaluate(()=>document.querySelectorAll('*').length);
  for(const [width,height]of sizes){await page.setViewportSize({width,height});for(let index=0;index<count;index++){
   await navigate(index);const screenshot=await capture(`${width}-${index+1}`),start=records.length;
   if(!await page.evaluate(({selector,index})=>__qualityProbe.visible(document.querySelectorAll(selector)[index]),{selector,index})){add(9,'ERROR','page adapter',{reason:'requested page is not visible'},'visible target page','Correct the page selector/navigation mechanism.',{page:index+1,viewport:[width,height],screenshot});continue}
   try{records.push(...(await core.snapshot(page,selector,index)).map(r=>({...r,viewport:[width,height],state:'default',screenshot})))}catch(e){add(9,'ERROR','detector.snapshot',{message:safe(e.message)},'successful detector execution','Fix the detector/configuration; this check did not pass.',{page:index+1,viewport:[width,height],screenshot})}
   if(!records.slice(start).some(r=>r.gate===2))add(2,'PASS','page',{sampled:true},'no detected readability violation','Still review visual hierarchy and reading rhythm.',{page:index+1,viewport:[width,height],screenshot});
   if(!records.slice(start).some(r=>r.gate===3))add(3,'PASS','page',{candidateGeometryChecked:true},'no detected collision','Unknown semantic overlap still requires author review.',{page:index+1,viewport:[width,height],screenshot});
   if(!records.slice(start).some(r=>r.gate===7))add(7,'PASS','page',{boundsChecked:true},'inside page/viewport','Review projector readability.',{page:index+1,viewport:[width,height],screenshot});
   // Five real control states. No automatic business clicks: pointer release is cancelled outside the page.
   if(width===sizes[0][0]&&!config.skipControlStates){
    const controls=page.locator('button,a,[role=button],[data-qa-control],input,select,textarea');
    for(let j=0;j<Math.min(await controls.count(),config.maxControls||120);j++){
     const b=controls.nth(j);if(!await b.isVisible())continue;
     const info=await core.inspect(b);if(!await b.evaluate(e=>__qualityProbe.visible(e)))continue;
     for(const state of info.disabled?['disabled']:['default','hover','focus','active']){
      try{await page.mouse.move(-10,-10);await b.evaluate(e=>e.blur());if(state==='hover'||state==='active')await b.hover({timeout:1500});if(state==='focus'){await page.keyboard.press('Tab');await b.focus()}if(state==='active')await page.mouse.down();await page.evaluate(()=>document.getAnimations().forEach(a=>{if(a instanceof CSSTransition)a.finish()}));
       const v=await core.inspect(b);const status=v.disabled?'REVIEW':!v.text?'SKIP':v.complex.length?'REVIEW':v.contrast===null?'REVIEW':v.contrast>=v.threshold?'PASS':'FAIL';
       add(1,status,v.element,v,v.disabled?'disabled readability recorded; normal AA threshold not mechanically applied':v.threshold,v.complex.length?'Review actual composed pixels; CSS pair is inconclusive.':'Use a paired foreground/background for this state.',{page:index+1,viewport:[width,height],state,screenshot});
       if(state==='focus'){const focused=await b.evaluate(e=>e===document.activeElement),visible=/solid|dashed|dotted|double/.test(v.outline)||v.boxShadow!==info.boxShadow;add(8,!focused?'FAIL':visible?'PASS':'REVIEW',v.element,{keyboardFocus:focused,visibleIndicator:visible},'reachable visible focus','Provide a visible focus indicator; review custom indicators.',{page:index+1,state,screenshot})}
      }catch(e){add(7,'FAIL',info.element,{reason:'control unreachable',message:safe(e.message)},'reachable interactive target','Correct clipping/overlay or provide keyboard access.',{page:index+1,state,screenshot})}
      finally{if(state==='active'){await page.mouse.move(-10,-10);await page.mouse.up()}}
     }
    }
   }
  }}
  // Configured state transitions + RAF track sampling, without case-specific IDs or assumptions.
  for(const state of config.states||[]){await navigate(state.page||0);await page.evaluate(({selector,index})=>{window.__qualityFrames={running:true,samples:0,records:[]};const tick=()=>{const f=__qualityFrames,root=document.querySelectorAll(selector)[index];f.samples++;f.records.push(...__qualityProbe.frame(root,index+1));if(f.running)requestAnimationFrame(tick)};tick()},{selector,index:state.page||0});
   try{for(const a of state.actions||[])await action(a);await page.waitForTimeout(state.sampleMs||250);for(const expectation of state.expect||[]){const e=page.locator(expectation.selector);let actual;if(expectation.attribute)actual=await e.getAttribute(expectation.attribute);else actual=await e.textContent();add(5,String(actual)===String(expectation.value)?'PASS':'FAIL',expectation.selector,{value:actual},expectation.value,'Reset/reversal must leave the latest semantic state.',{page:(state.page||0)+1,state:state.name})}
    const screenshot=await capture('state-'+String(state.name).replace(/[^a-z0-9_-]/gi,'_'));records.push(...(await core.snapshot(page,selector,state.page||0)).map(r=>({...r,state:state.name,screenshot})));const frames=await page.evaluate(()=>{__qualityFrames.running=false;return __qualityFrames});runtime.push({state:state.name,rafSamples:frames.samples,violations:frames.records.length});records.push(...frames.records.map(r=>({...r,state:state.name,screenshot})));add(5,'REVIEW','motion',{state:state.name,rafSamples:frames.samples},'author-confirmed trajectory/result continuity','Inspect captured frames for jumps, stale text and subjective smoothness.',{state:state.name,screenshot});
   }catch(e){await page.evaluate(()=>__qualityFrames.running=false);add(5,'ERROR','state actions',{message:safe(e.message),state:state.name},'all configured actions executed','Repair the action manifest; unexecuted checks are not PASS.')}
  }
  await navigate(0);if(adapter!=='reveal'){for(let i=0;i<12;i++)await navigate(i%count,false);await navigate(0);await page.waitForTimeout(1200);checks.rapidNavigation=true;add(5,'REVIEW','navigation',{rapidRequests:12},'correct final state and human continuity review','Verify author-defined reverse/reset semantics with explicit state expectations.')}else add(5,'REVIEW','navigation',{adapter:'static semantic preview'},'real navigation adapter','Configure the deck navigation to verify interruption rather than only previewing pages.');
  await page.emulateMedia({reducedMotion:'reduce'});await navigate(count-1,false);await page.waitForTimeout(350);const reduce=await page.evaluate(()=>({running:document.getAnimations().filter(a=>a.playState==='running').length,springs:globalThis.Keynote?.springStats?.().active??null,feedback:globalThis.Keynote?.feedbackStats?.().active??null}));add(8,reduce.springs>0?'FAIL':reduce.running?'REVIEW':'PASS','reduced motion',reduce,'stable readable state; decorative motion reduced','Review custom RAF motion and the reduced-motion screenshot.');await capture('reduced-motion');checks.reducedMotion=reduce.springs===0||reduce.springs===null;
  await page.emulateMedia({reducedMotion:'no-preference'});await navigate(0);await page.waitForTimeout(600);const stats=await page.evaluate(()=>({nodes:document.querySelectorAll('*').length,animations:document.getAnimations().filter(a=>a.playState==='running').length,springs:globalThis.Keynote?.springStats?.().active??null}));stats.initialNodes=initialNodes;stats.nodeGrowth=stats.nodes-initialNodes;runtime.push({final:stats});add(9,stats.animations||stats.springs||stats.nodeGrowth>(config.nodeGrowthReviewThreshold||200)?'REVIEW':'PASS','idle',stats,'bounded activity and DOM growth after settlement','Investigate persistent work/resource growth with project-specific traces; no FPS or leak claim.');
  checks.isolatedOffline=config.resourceMode!=='adjacent';checks.keyboard=true;
 }catch(e){add(9,'ERROR','runner',{message:safe(e.message)},'successful detector execution','Install required runtime/browser or correct the manifest.');errors.push(safe(e.message))}
 finally{
  for(const message of errors)add(9,'FAIL','runtime',{message},'no console/page errors','Repair the runtime exception.');for(const f of resourceFailures)add(9,'FAIL','resource',f,'all required resources available','Embed or repair the resource.');for(const u of unexpected)add(9,'FAIL','network',{resource:u},'offline rendering','Remove runtime network dependencies.');
  for(let gate=1;gate<=9;gate++)if(!records.some(r=>r.gate===gate))add(gate,'SKIP','page',{reason:'no applicable declared component'},null,'Add generic semantic attributes/config when this feature exists.');
  // Every finding retains explicit page, state, element, threshold and evidence information.
  for(const r of records){r.page??=1;r.state??='default';r.viewport??=null;r.screenshot??=null}
  result.gates=core.summarize(records);result.status=result.gates.some(g=>g.status==='ERROR')?'ERROR':result.gates.some(g=>g.status==='FAIL')?'FAIL':result.gates.some(g=>g.status==='REVIEW')?'REVIEW':'PASS';result.checks=checks;result.errors=errors;result.unexpected=unexpected;result.warnings=records.filter(r=>r.status==='FAIL'||r.status==='ERROR');result.runtime=runtime;
  fs.writeFileSync(reportPath,JSON.stringify(result,null,2));await browser?.close();if(tmp)fs.rmSync(tmp,{recursive:true,force:true});
 }
 return result;
}
module.exports={validate,load,option};
if(require.main===module){const input=option('--input',args[0]),out=option('--out',!args[0]?.startsWith('--')&&args[1]&&!args[1].startsWith('--')?args[1]:'qa'),configPath=option('--config',null);if(!input||input.startsWith('--')){console.error('Usage: node validate-browser.cjs --input deck.html --report quality.json [--config manifest.json] [--modules node_modules]');process.exitCode=1}else{const config=configPath?JSON.parse(fs.readFileSync(configPath,'utf8')):{};if(option('--report',null))config.report=option('--report');if(args.includes('--adjacent'))config.resourceMode='adjacent';validate(input,out,config).then(r=>{console.log(JSON.stringify({status:r.status,slides:r.slideCount,gates:r.gates.map(g=>({gate:g.gate,status:g.status,counts:g.counts}))}));if(['FAIL','ERROR'].includes(r.status)||(args.includes('--strict-review')&&r.status==='REVIEW'))process.exitCode=1}).catch(e=>{console.error(safe(e.message));process.exitCode=1})}}
