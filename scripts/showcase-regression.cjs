/* Incremental real-behavior acceptance. Existing regression.cjs remains separate. */
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const {pathToFileURL}=require('url'),{load,option}=require('./validate-browser.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa/showcase');fs.mkdirSync(out,{recursive:true});
const checks={},errors=[],unexpected=[],supported=[];
(async()=>{
 const {chromium}=load('playwright'),browser=await chromium.launch({channel:option('--channel','chrome'),headless:true});
 const context=await browser.newContext({offline:true,viewport:{width:1366,height:768}}),page=await context.newPage();
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'keynote-showcase-')),target=path.join(tmp,'showcase.html');fs.copyFileSync(path.join(root,'dist/swust-keynote-showcase.html'),target);const url=pathToFileURL(target).href;
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url()!==url&&!r.url().startsWith('data:'))unexpected.push(r.url())});
 const rest=()=>page.waitForFunction(()=>Keynote.springStats().active===0&&Keynote.feedbackStats().active===0&&document.getAnimations().every(a=>a.playState!=='running'),{},{timeout:8000});
 const go=async n=>{await page.evaluate(n=>{deck.go(n,undefined,true);showcase.settle()},n);await rest()};
 const check=async(id,fn)=>{await fn();checks[id]=true;supported.push(id);console.log('PASS '+id)};
 try{
 await page.goto(url);await page.waitForFunction(()=>globalThis.showcase&&globalThis.deck);await rest();
 await check('meaning',async()=>{
  assert.equal(await page.locator('.stage > .scene').count(),15);
  const r=await page.evaluate(()=>{window.ideaNode=deck.motion.shared.objects.get('lab-idea').node;window.ideaChild=ideaNode.firstElementChild;return ideaNode.offsetWidth});
  await page.locator('#intro-focus').click();await page.waitForTimeout(100);
  const w=await page.evaluate(()=>ideaNode.getBoundingClientRect().width/(innerHeight/1080));assert(w>r&&w<621);
  await page.locator('#intro-focus').click();await rest();assert(await page.evaluate(()=>ideaNode===deck.motion.shared.objects.get('lab-idea').node&&ideaChild===ideaNode.firstElementChild));
 });
 await check('content',async()=>{await go(1);for(let i=0;i<3;i++){await page.locator('#content-modes button').nth(i).click();await rest();assert.equal(await page.evaluate(()=>showcase.content.selected),i);assert.equal(await page.locator('[data-content-mode]').evaluateAll(xs=>xs.filter(n=>!n.inert&&Number(getComputedStyle(n).opacity)>.99).length),1)}});
 await check('clarity',async()=>{await go(2);for(let i=0;i<2;i++){await page.locator('#type-modes button').nth(i).click();await rest();assert.equal(await page.locator(i?'#type-after':'#type-before').evaluate(n=>Number(getComputedStyle(n).opacity)),1)}assert.deepEqual(await page.locator('.typographic-content').allTextContents(),[await page.locator('.typographic-content').first().textContent(),await page.locator('.typographic-content').first().textContent()])});
 await check('material',async()=>{
  await go(3);await page.locator('#material-modes button').nth(1).click();assert.equal(await page.locator('#material-sample').getAttribute('data-renderer'),'SVG');
  await page.locator('#material-blur').fill('10');await page.locator('#material-opacity').fill('0.75');assert.equal(await page.locator('#material-sample').evaluate(n=>n.style.getPropertyValue('--material-blur')),'10px');
  const available=await page.evaluate(()=>showcase.refraction.available);if(available){await page.locator('#material-modes button').nth(2).click();assert(await page.locator('#material-canvas').isVisible());await page.evaluate(()=>document.querySelector('#material-canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert(await page.locator('#material-canvas').isHidden());assert.equal(await page.evaluate(()=>showcase.material.selected),0)}else assert(await page.locator('#material-modes button').nth(2).isDisabled());
 });
 await check('physics',async()=>{
  await go(4);await page.locator('#physics-k').fill('350');await page.locator('#physics-c').fill('34');await page.locator('#physics-m').fill('1.5');assert.deepEqual(await page.evaluate(()=>[showcase.physics.spring.stiffness,showcase.physics.spring.damping,showcase.physics.spring.mass]),[350,34,1.5]);
  const effect=await page.evaluate(()=>{const s=showcase.physics.spring,simulate=k=>{s.jump(0);s.configure({stiffness:k,damping:24,mass:1});s.target=800;for(let i=0;i<20;i++)s.integrate(1/120);return s.x};const d=Math.abs(simulate(60)-simulate(450));s.jump(0);return d});assert(effect>100);
  const b=await page.locator('#physics-object').boundingBox(),scale=await page.locator('#physics-track').evaluate(n=>n.getBoundingClientRect().width/n.offsetWidth);
  await page.mouse.move(b.x+30,b.y+30);await page.mouse.down();await page.mouse.move(b.x+180,b.y+30,{steps:10});const x=await page.evaluate(()=>showcase.physics.spring.x);assert(Math.abs(x-150/scale)<4);await page.mouse.up();await rest();
 });
 await check('timing',async()=>{
  await go(5);await page.locator('#bezier-y1').fill('0.3');await page.locator('#bezier-y2').fill('0.8');await page.locator('#timing-replay').click();await page.waitForTimeout(180);
  const xs=await page.locator('.timing-dot').evaluateAll(nodes=>nodes.map(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m41));assert(new Set(xs.map(Math.round)).size>=3);await page.screenshot({path:path.join(out,'timing-middle.png')});await rest();
  const end=await page.locator('.timing-dot').evaluateAll(nodes=>nodes.map(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m41));assert(Math.max(...end)-Math.min(...end)<1);assert.equal(end.length,4);
 });
 await check('identity',async()=>{
  await go(6);await page.evaluate(()=>{window.morphNode=document.querySelector('#identity-object');window.morphChild=morphNode.firstElementChild});await page.locator('#identity-object button').click();await page.waitForTimeout(140);
  const middle=await page.evaluate(()=>({w:showcase.morph.values.w.x,r:showcase.morph.values.r.x}));assert(middle.w>440&&middle.w<1421);await page.screenshot({path:path.join(out,'morph-middle.png')});
  await page.locator('#identity-object button').click();await page.waitForTimeout(70);await page.locator('#identity-object button').click();await rest();assert(await page.evaluate(()=>morphNode===document.querySelector('#identity-object')&&morphChild===morphNode.firstElementChild));assert.equal(await page.evaluate(()=>Math.round(showcase.morph.values.w.x)),await page.locator('#identity-host').evaluate(n=>n.clientWidth));
 });
 await check('camera',async()=>{
  await go(7);await page.evaluate(()=>{window.cameraNode=showcase.camera.shared.objects.get('camera-a').node;window.cameraChild=cameraNode.firstElementChild});await page.locator('#camera-detail').click();assert.equal(await page.evaluate(()=>showcase.camera.lastRecipe),'push-in');await page.waitForTimeout(130);
  const continuous=await page.evaluate(()=>{const s=showcase.camera.shared.objects.get('camera-a').values.x,x=s.x,v=s.v;showcase.camera.go(0,'detail-overview');return s.x===x&&s.v===v});assert(continuous);await rest();
  await page.locator('#camera-focus').click();await rest();assert.equal(await page.evaluate(()=>showcase.camera.shared.objects.get('camera-a').values.a.x),.22);assert.equal(await page.evaluate(()=>showcase.camera.shared.objects.get('camera-b').values.a.x),1);
  assert(await page.evaluate(()=>cameraNode===showcase.camera.shared.objects.get('camera-a').node&&cameraChild===cameraNode.firstElementChild));assert.equal(await page.locator('[data-identity="camera-a"]').count(),1);assert.equal(await page.locator('[data-identity="camera-b"]').count(),1);assert.equal(await page.evaluate(()=>deck.motion.shared.objects.has('camera-a')),false);await page.screenshot({path:path.join(out,'camera-focus.png')});
  await page.locator('#camera-chapter').click();await rest();assert.equal(await page.evaluate(()=>showcase.camera.lastRecipe),'scene-reset');assert.equal(await page.locator('.camera-scene').evaluateAll(xs=>xs.filter(n=>getComputedStyle(n).visibility==='visible').length),1);
  const signatures=await page.evaluate(()=>{const c=showcase.camera;return ['overview-detail','focus-transfer','chapter-boundary'].map((r,i)=>{c.go(0,'soft-fade',true);c.go(i+1,r);const v=c.items[i+1].values;return [v.x.x,v.y.x,v.s.x]})});assert.equal(new Set(signatures.map(JSON.stringify)).size,3);await rest();
 });
 await check('growth',async()=>{await go(8);await page.locator('#growth-next').click();await page.locator('#growth-next').click();await page.waitForTimeout(90);assert(await page.evaluate(()=>showcase.growth.spring.x>0));await page.locator('#growth-prev').click();await page.locator('#growth-reset').click();assert.equal(await page.evaluate(()=>showcase.growth.spring.x),0);assert(await page.locator('#growth-prev').isDisabled())});
 await check('settlement',async()=>{
  await go(9);
  await page.exposeFunction('saveSettlementMiddle',()=>page.screenshot({path:path.join(out,'settlement-middle.png')}));
  const frames=await page.evaluate(async()=>{
   showcase.arrival.play();await new Promise(resolve=>{const wait=()=>showcase.arrival.after.semantic==='Arrived'?resolve():requestAnimationFrame(wait);wait()});
   const start=performance.now(),samples=[];let captured=false;
   await new Promise(resolve=>{const frame=()=>{const a=showcase.arrival.after,b=showcase.arrival.before,r=a.root,record={ms:performance.now()-start,semantic:a.semantic,beforeSemantic:b.semantic,phase:a.phase,p:a.progress.x,beforeP:b.progress.x,line:getComputedStyle(r.querySelector('[data-edge]')).stroke,arrow:getComputedStyle(r.querySelector('[data-arrow]')).stroke,beforeLine:getComputedStyle(b.root.querySelector('[data-edge]')).stroke,newAlpha:Number(getComputedStyle(a.feedback.text.current).opacity),oldAlpha:Number(getComputedStyle(a.feedback.text.previous).opacity),result:Number(getComputedStyle(r.querySelector('[data-result]')).opacity)};samples.push(record);if(!captured&&record.ms>35){captured=true;globalThis.settlementCapture=globalThis.saveSettlementMiddle()}if(record.ms<700)requestAnimationFrame(frame);else resolve()};frame()});return samples;
  });
  assert(frames.some(f=>f.line!=='rgb(0, 122, 255)'&&f.line!=='rgb(157, 189, 227)'));assert(frames.every(f=>f.line===f.arrow));assert(frames.some(f=>f.newAlpha>0&&f.newAlpha<1&&f.oldAlpha>0));assert(frames.some(f=>f.result>0&&f.result<1));assert(frames.every(f=>f.semantic==='Arrived'&&f.beforeSemantic==='Arrived'&&Math.abs(f.p-f.beforeP)<.000001));assert(frames.every(f=>f.beforeLine==='rgb(157, 189, 227)'));
  assert(frames.every(f=>['Visual Settlement','Stable State'].includes(f.phase)));
  await page.evaluate(()=>globalThis.settlementCapture);fs.writeFileSync(path.join(out,'settlement-frames.json'),JSON.stringify(frames,null,2));await rest();await page.screenshot({path:path.join(out,'settlement-stable.png')});
  await page.locator('#arrival-reverse').click();await page.waitForTimeout(100);const continuity=await page.evaluate(()=>{const s=showcase.arrival.after.progress,x=s.x,v=s.v;showcase.arrival.interrupt();return x===s.x&&v===s.v});assert(continuity);await page.locator('#arrival-reset').click();assert.equal(await page.evaluate(()=>showcase.arrival.after.progress.x),0);assert.equal(await page.evaluate(()=>showcase.arrival.after.semantic),'Ready');assert.equal(await page.evaluate(()=>showcase.arrival.after.feedback.active),false);
 });
 await check('response',async()=>{
  await go(10);await page.locator('#micro-press').click();assert.equal(await page.locator('#micro-feedback').getAttribute('data-value'),'Pressed 1');await page.locator('#micro-segments button').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>showcase.microSegments.selected),1);assert.equal(await page.evaluate(()=>deck.current),10);
  await page.locator('#micro-range').fill('80');assert.equal(await page.locator('#micro-value').textContent(),'80%');await page.locator('#micro-capsule button').click();await page.locator('#micro-card button').click();await rest();assert(await page.evaluate(()=>showcase.capsule.open&&showcase.card.open));
 });
 await check('state',async()=>{
  await go(11);assert.equal(await page.evaluate(()=>showcase.machine.dispatch('complete')),false);assert(await page.locator('#fsm-start').isDisabled());await page.locator('#fsm-ready').click();await page.locator('#fsm-start').click();await page.locator('#fsm-complete').click();assert.equal(await page.evaluate(()=>showcase.machine.state),'Completed');assert(await page.locator('#fsm-complete').isDisabled());await page.locator('#fsm-reset').click();assert.equal(await page.evaluate(()=>showcase.machine.state),'Idle');await rest();
 });
 await check('pressure',async()=>{
  await go(12);await page.locator('#target-3').click();await page.waitForTimeout(100);assert(await page.evaluate(()=>{const s=showcase.pressure.spring,x=s.x,v=s.v;showcase.pressure.target(0);return s.x===x&&s.v===v}));
  await page.locator('#pressure-burst').click();await page.waitForTimeout(1000);await rest();assert(await page.evaluate(()=>Math.abs(showcase.pressure.spring.x-(document.querySelector('#pressure-track').clientWidth-document.querySelector('#pressure-object').offsetWidth))<1));await page.locator('#pressure-reset').click();assert.equal(await page.evaluate(()=>showcase.pressure.spring.x),0);
 });
 await check('access',async()=>{
  await go(13);await page.locator('#access-move').click();await page.waitForTimeout(80);await page.locator('#access-reduce').click();assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);assert.equal(await page.evaluate(()=>Keynote.feedbackStats().active),0);await page.locator('#access-reduce').click();await page.locator('#access-static').click();await page.locator('#access-move').click();assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);await page.locator('#access-static').click();await page.locator('#access-opaque').click();assert.equal(await page.locator('.deck-controls').evaluate(n=>getComputedStyle(n).backdropFilter),'none');await page.locator('#access-sample').click();assert.match(await page.locator('#access-readout').textContent(),/0/);
 });
 await check('evolve',async()=>{await go(14);await page.locator('#workflow-replay').click();await rest();assert.equal(await page.evaluate(()=>showcase.workflow.spring.x),1);assert.equal(await page.locator('#release-label').textContent(),await page.evaluate(()=>'SWUST Apple Keynote v'+showcase.release.version));await page.locator('#workflow-settlement').click();assert.equal(await page.evaluate(()=>deck.current),9);await rest()});
 await check('lifecycleAndPressure',async()=>{
  await page.evaluate(()=>{for(let i=0;i<150;i++)deck.go(i%15);deck.go(9);showcase.arrival.play()});await page.waitForTimeout(80);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);assert.equal(await page.evaluate(()=>Keynote.feedbackStats().active),0);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{showcase.arrival.reset();showcase.arrival.play();showcase.morph.set(true);showcase.pressure.target(3)});assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);assert.equal(await page.evaluate(()=>showcase.arrival.after.semantic),'Arrived');await page.emulateMedia({reducedMotion:'no-preference'});await go(0);
  assert.equal(await page.locator('.stage > .scene').evaluateAll(xs=>xs.filter(s=>getComputedStyle(s).visibility==='visible').length),1);
 });
 assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 }finally{
  const report={artifact:'swust-keynote-showcase.html',artifactSha256:require('crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex'),browser:await browser.version(),offlineIsolated:true,checks,verifiedSlides:supported.filter(k=>k!=='lifecycleAndPressure'),errors,unexpected,limitations:['Chrome headless only','Synthetic hidden-document event','Advanced refraction remains experimental; no physical optical-accuracy or universal FPS claim']};
  fs.writeFileSync(path.join(out,'behavior-report.json'),JSON.stringify(report,null,2));await browser.close();fs.unlinkSync(target);fs.rmdirSync(tmp);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
