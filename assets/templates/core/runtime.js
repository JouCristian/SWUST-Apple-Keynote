(() => {
  const K=globalThis.Keynote;
  class Presentation {
    constructor({stage=document.querySelector('.stage'),slides=[...stage.querySelectorAll(':scope > .scene')],notes=[],onReset=()=>{}}={}){
      this.stage=stage;this.slides=slides;this.notes=notes;this.onReset=onReset;this.current=0;this.projection=false;
      const nav=document.createElement('nav');nav.className='deck-controls glass';nav.setAttribute('aria-label','演示控制');
      nav.innerHTML='<button data-action="directory" title="T 目录">目录</button><button data-action="notes" title="N 备注">备注</button><button data-action="projection" class="secondary" aria-pressed="false" title="P 投影锁定备注">投影</button><button data-action="reset" title="R 重置交互">重置</button><button data-action="static" class="secondary" aria-pressed="false" title="B 减少动态效果">静态</button><button data-action="full" title="F 全屏">全屏</button><button data-action="prev" aria-label="上一页">←</button><output aria-live="polite"></output><button data-action="next" aria-label="下一页">→</button>';
      document.body.append(nav);this.nav=nav;this.progress=document.createElement('div');this.progress.className='deck-progress';this.progress.setAttribute('role','progressbar');this.progress.setAttribute('aria-label','页面进度');this.progress.setAttribute('aria-valuemin','1');this.progress.setAttribute('aria-valuemax',slides.length);document.body.append(this.progress);
      this.directory=this.dialog('演示目录');const grid=document.createElement('div');grid.className='directory';slides.forEach((s,i)=>{const b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} · ${s.dataset.title}`;b.onclick=()=>{this.directory.close();this.go(i,'scene-reset')};grid.append(b)});this.directory.append(grid);
      this.noteDialog=this.dialog('讲者备注');this.noteDialog.insertAdjacentHTML('beforeend','<div class="notes-grid"></div><p class="dialog-foot">当前窗口可见。投影前关闭，或按 P 锁定备注。</p>');
      this.resize=()=>{stage.style.transform=`scale(${Math.min(innerWidth/1920,innerHeight/1080)})`};this.resize();addEventListener('resize',this.resize);this.motion=new K.SceneMotion(stage,slides);
      nav.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action)this.action(action)});
      document.addEventListener('keydown',e=>this.key(e));addEventListener('hashchange',()=>{const n=Number(location.hash.slice(1))-1;if(Number.isInteger(n)&&n>=0&&n<slides.length)this.go(n)});
      document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement)this.noteDialog.close()});
      this.go(Math.max(0,Math.min(slides.length-1,(Number(location.hash.slice(1))||1)-1)),'soft-fade',true);
    }
    dialog(title){const d=document.createElement('dialog');d.innerHTML=`<header><h2>${K.escape(title)}</h2><button>关闭 ×</button></header>`;d.querySelector('button').onclick=()=>d.close();document.body.append(d);return d}
    open(d){d.showModal();K.animate(d,[{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'none'}],{duration:300})}
    go(n,recipe,instant=false){n=Math.max(0,Math.min(this.slides.length-1,n));const old=this.current;if(document.activeElement?.closest('.scene')&&old!==n)document.activeElement.blur();this.current=n;
      const intent=recipe||(n<old?({ 'push-in':'pull-back','pull-back':'push-in' }[this.slides[old].dataset.transition]||this.slides[old].dataset.transition):this.slides[n].dataset.transition)||'cross-dissolve';
      this.motion.go(n,intent,instant);this.nav.querySelector('output').textContent=`${String(n+1).padStart(2,'0')} / ${this.slides.length}`;this.nav.querySelector('[data-action=prev]').disabled=n===0;this.nav.querySelector('[data-action=next]').disabled=n===this.slides.length-1;this.progress.style.transform=`scaleX(${(n+1)/this.slides.length})`;this.progress.setAttribute('aria-valuenow',n+1);this.directory.querySelectorAll('.directory button').forEach((b,i)=>b.setAttribute('aria-current',i===n?'page':'false'));try{history.replaceState(null,'',`#${n+1}`)}catch{}document.dispatchEvent(new CustomEvent('keynote-slide',{detail:{index:n,previous:old}}))}
    action(action){
      if(action==='prev')this.go(this.current-1);
      if(action==='next')this.go(this.current+1);
      if(action==='directory')this.open(this.directory);
      if(action==='notes'){if(this.projection||document.fullscreenElement){K.toast('投影/全屏状态下备注已锁定');return}const note=this.notes[this.current]||{};this.noteDialog.querySelector('.notes-grid').innerHTML=['WHY','ACTION','RESULT','NEXT'].map(k=>`<div><strong>${k}</strong><p>${K.escape(note[k]||'—')}</p></div>`).join('');this.open(this.noteDialog)}
      if(action==='projection'){this.projection=!this.projection;this.nav.querySelector('[data-action=projection]').setAttribute('aria-pressed',String(this.projection));if(this.projection)this.noteDialog.close();K.toast(this.projection?'备注已锁定':'备注锁定已解除')}
      if(action==='reset'){this.onReset(this.current);K.settleFeedback?.(this.stage)}
      if(action==='static'){const on=document.documentElement.classList.toggle('static');this.nav.querySelector('[data-action=static]').setAttribute('aria-pressed',String(on));if(on){K.settleSprings();K.cancelAnimations()}document.dispatchEvent(new Event('keynote-motion-change'))}
      if(action==='full')this.fullscreen();
    }
    async fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else{this.noteDialog.close();await document.documentElement.requestFullscreen()}}catch{K.toast('浏览器未允许全屏，请使用浏览器全屏功能')}}
    key(e){
      if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
      if(document.querySelector('dialog[open]'))return;
      if(e.target.closest('input,textarea,select,[contenteditable="true"],[role="slider"],[role="radiogroup"]'))return;
      if(e.target.closest('button,a')&&[' ','Enter'].includes(e.key))return;
      const key=e.key.toLowerCase();let action;
      if(['arrowright','pagedown',' '].includes(key))action=key===' '&&e.shiftKey?'prev':'next';
      if(['arrowleft','pageup'].includes(key))action='prev';
      action=action||({t:'directory',n:'notes',p:'projection',r:'reset',b:'static',f:'full'}[key]);
      if(action){e.preventDefault();this.action(action)}
      else if(key==='home'){e.preventDefault();this.go(0)}else if(key==='end'){e.preventDefault();this.go(this.slides.length-1)}else if(key==='escape'&&document.fullscreenElement){document.exitFullscreen().catch(()=>{})}
    }
  }
  K.Presentation=Presentation;
})();
