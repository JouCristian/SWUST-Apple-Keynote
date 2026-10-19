/* Real offline browser captures for public documentation. */
'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {load,option}=require('./validate-browser.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/screenshots');fs.mkdirSync(out,{recursive:true});
 const browser=await load('playwright').chromium.launch({channel:option('--channel','chrome'),headless:true});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1920,height:1080}}),page=await context.newPage();
  await page.goto(pathToFileURL(path.join(root,'dist/swust-keynote-showcase.html')).href);
  await page.waitForFunction(()=>globalThis.showcase&&globalThis.deck);
  for(const [index,name] of [[0,'intro'],[6,'identity'],[9,'settlement']]){
   await page.evaluate(index=>{deck.go(index,undefined,true);showcase.settle()},index);
   if(index===6)await page.evaluate(()=>{showcase.morph.set(true,true);showcase.morph.settle()});
   if(index===9){await page.locator('#arrival-replay').click();await page.waitForTimeout(1600)}
   await page.waitForTimeout(250);
   await page.screenshot({path:path.join(out,'showcase-'+name+'.png')});
  }
  console.log('Captured three actual Showcase scenes in offline Chrome '+await browser.version());
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
