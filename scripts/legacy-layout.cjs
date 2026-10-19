/* Generic generated-deck validation. Requires Playwright, with optional --modules. */
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
const load=name=>require(require.resolve(name,{paths:[option('--modules',process.cwd()),process.cwd()]}));
async function validate(file,out){
  const {chromium}=load('playwright');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({channel:option('--channel','chrome'),headless:true});
  const context=await browser.newContext({offline:true});const page=await context.newPage();
  const errors=[],unexpected=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));
  const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'keynote-offline-'));const target=path.join(isolated,'deck.html');fs.copyFileSync(file,target);
  page.on('request',req=>{const url=req.url();if(!url.startsWith('data:')&&url!==pathToFileURL(target).href)unexpected.push(url)});
  const sizes=[[1920,1080],[1366,768],[960,640]];let count=0;
  try{
    await page.goto(pathToFileURL(target).href);await page.waitForFunction(()=>globalThis.deck?.slides?.length>0);count=await page.evaluate(()=>deck.slides.length);
    for(const [width,height]of sizes){await page.setViewportSize({width,height});for(let i=0;i<count;i++){
      await page.evaluate(i=>{deck.go(i,undefined,true);Keynote.settleSprings();Keynote.cancelAnimations()},i);await page.waitForTimeout(50);
      const problems=await page.evaluate(()=>{
        const slide=deck.slides[deck.current],box=slide.getBoundingClientRect(),bad=[];
        for(const el of slide.querySelectorAll('h1,h2,h3,p,button,pre')){
          if(el.closest('[data-shared]')||!el.getClientRects().length)continue;
          const r=el.getBoundingClientRect();
          if(r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom-45*(box.width/1920))bad.push({text:el.textContent.slice(0,60),reason:'outside slide safe frame'});
          if(el.scrollWidth>el.clientWidth+3&&el.clientWidth>0)bad.push({text:el.textContent.slice(0,60),reason:'text overflow'});
        }
        return bad;
      });warnings.push(...problems.map(p=>({...p,slide:i+1,width,height})));
      await page.screenshot({path:path.join(out,`${width}-${i+1}.png`)});
    }}
    await page.evaluate(()=>{document.activeElement.blur();deck.go(0,undefined,true)});await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>deck.current),Math.min(1,count-1));await page.keyboard.press('Shift+Space');assert.equal(await page.evaluate(()=>deck.current),0);
    await page.keyboard.press('End');assert.equal(await page.evaluate(()=>deck.current),count-1);await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>deck.current),0);
    await page.keyboard.press('t');assert(await page.locator('dialog[open]').count());await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
    await page.keyboard.press('n');assert(await page.locator('dialog[open]').count());await page.keyboard.press('Escape');await page.keyboard.press('p');await page.keyboard.press('n');assert.equal(await page.locator('dialog[open]').count(),0);
    await page.evaluate(()=>{for(let i=0;i<60;i++)deck.go(i%deck.slides.length);deck.go(0)});await page.waitForTimeout(2200);
    const stable=await page.evaluate(()=>({visible:deck.slides.filter(s=>getComputedStyle(s).visibility==='visible').length,current:deck.current,active:Keynote.springStats().active}));assert.equal(stable.visible,1);assert.equal(stable.current,0);assert.equal(stable.active,0);
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>deck.go(deck.slides.length-1));assert.equal(await page.evaluate(()=>Keynote.springStats().active),0);
    const report={file:path.basename(file),artifactSha256:require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex'),browser:await browser.version(),viewports:sizes,slideCount:count,checks:{isolatedOffline:true,keyboard:true,directory:true,notes:true,projection:true,rapidNavigation:true,reducedMotion:true},errors,unexpected,warnings};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);assert.deepEqual(warnings,[]);return report;
  }finally{await browser.close();fs.unlinkSync(target);fs.rmdirSync(isolated)}
}
module.exports={validate,load,option};
if(require.main===module)validate(path.resolve(args[0]),path.resolve(args[1]||'qa')).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1});
