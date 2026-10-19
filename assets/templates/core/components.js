(() => {
  const K=globalThis.Keynote;
  K.escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  K.toast=text=>{let t=document.querySelector('#toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.append(t)}t.textContent=text;t.hidden=false;clearTimeout(t.timer);t.timer=setTimeout(()=>t.hidden=true,2500)};
  K.copy=async(text)=>{
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch{}
    const el=document.createElement('textarea');el.value=text;el.style.cssText='position:fixed;left:0;top:0;opacity:0';(document.querySelector('dialog[open]')||document.body).append(el);el.select();
    let ok=false;try{ok=document.execCommand('copy')}catch{}el.remove();return ok;
  };
  K.terminal=(commands,expected)=>`<div class="terminal"><div class="terminal-header"><span class="lights" aria-hidden="true">● ● ●</span><span>Terminal · 示例，不执行命令</span><button data-copy-command>复制命令</button></div><pre>${commands.map(line=>{const [cmd,...args]=line.split(' ');return `<span class="command">${K.escape(cmd)}</span> <span class="arg">${K.escape(args.join(' '))}</span>`}).join('\n')}</pre><div class="expected">预期结果：${K.escape(expected)}</div></div>`;
  K.mountTerminals=(root)=>root.querySelectorAll('[data-copy-command]').forEach(button=>button.onclick=async()=>{
    const text=button.closest('.terminal').querySelector('pre').textContent;
    const ok=await K.copy(text);K.toast(ok?'已复制命令':'复制被拒绝，请选中命令手动复制');button.textContent=ok?'已复制 ✓':'复制失败';
    clearTimeout(button.copyTimer);button.copyTimer=setTimeout(()=>button.textContent='复制命令',1400);
  });
  K.diff=(before,after)=>`<div class="code-comparison"><div><h3>Before</h3><pre class="removed">${K.escape(before)}</pre></div><div><h3>After</h3><pre class="added">${K.escape(after)}</pre></div></div>`;
  K.explorer=(name,files)=>`<details class="file-explorer" open><summary>${K.escape(name)}</summary><ul>${files.map(file=>`<li><code>${K.escape(file)}</code></li>`).join('')}</ul></details>`;
  K.mountSegments=(root,onChange=()=>{})=>{
    const buttons=[...root.querySelectorAll('button')],ink=document.createElement('i');ink.className='segment-ink';ink.setAttribute('aria-hidden','true');root.prepend(ink);root.setAttribute('role','radiogroup');
    let selected=0;const render=()=>{if(x&&w){ink.style.transform=`translateX(${x.x}px)`;ink.style.width=`${w.x}px`}};
    const x=new K.Spring({onUpdate:render}),w=new K.Spring({onUpdate:render});
    function select(i,instant=false){selected=Math.max(0,Math.min(buttons.length-1,i));if(buttons[selected].disabled)selected=buttons.findIndex(b=>!b.disabled);if(selected<0)return;buttons.forEach((b,n)=>{b.setAttribute('role','radio');b.setAttribute('aria-checked',String(n===selected));b.tabIndex=n===selected?0:-1});const b=buttons[selected];x[instant?'jump':'retarget'](b.offsetLeft);w[instant?'jump':'retarget'](b.offsetWidth);onChange(selected)}
    buttons.forEach((b,i)=>b.onclick=()=>select(i));
    root.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();select(e.key==='Home'?0:e.key==='End'?buttons.length-1:(selected+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length);buttons[selected].focus()}});
    const ro=new ResizeObserver(()=>select(selected,true));ro.observe(root);select(0,true);
    return {select,reset:()=>select(0),get selected(){return selected},destroy(){ro.disconnect();x.destroy();w.destroy()}};
  };
  K.mountMorph=(host,{compact={w:240,h:100},expanded={w:520,h:250},capsule=false}={})=>{
    const surface=host.querySelector('.morph-surface'),button=surface.querySelector('button'),detail=surface.querySelector('.morph-detail');let open=false;
    const slot=document.createElement('div');slot.className='morph-control-slot';button.before(slot);slot.append(button);surface.style.setProperty('--morph-header',compact.h+'px');
    const label=K.mountText(button),closedLabel=button.textContent;
    const values={};const render=()=>{if(!values.r)return;const w=Math.min(host.clientWidth,Math.max(1,values.w.x)),x=Math.max(0,Math.min(host.clientWidth-w,values.x.x));surface.style.width=`${w}px`;surface.style.height=`${Math.max(compact.h,Math.min(host.clientHeight||Infinity,values.h.x))}px`;surface.style.transform=`translateX(${x}px)`;surface.style.borderRadius=`${values.r.x}px`;detail.style.opacity=Math.max(0,Math.min(1,values.a.x));detail.style.visibility=values.a.x<.01?'hidden':'visible'};
    for(const [key,val]of Object.entries({w:compact.w,h:compact.h,x:0,r:capsule?compact.h/2:28,a:0}))values[key]=new K.Spring({value:val,onUpdate:render});
    function set(next,instant=false){open=next;button.setAttribute('aria-expanded',String(open));label.set(open?'收起 ←':closedLabel,{instant});detail.setAttribute('aria-hidden',String(!open));const w=Math.min(host.clientWidth,open?expanded.w:compact.w);const targets={w,h:open?expanded.h:compact.h,x:open?Math.max(0,(host.clientWidth-w)/2):0,r:open?28:(capsule?compact.h/2:28),a:open?1:0};for(const [key,val]of Object.entries(targets))values[key][instant?'jump':'retarget'](val)}
    button.onclick=()=>set(!open);const ro=new ResizeObserver(()=>set(open,true));ro.observe(host);set(false,true);return {set,values,settle:()=>{Object.values(values).forEach(s=>s.jump(s.target));label.settle()},reset:()=>set(false,true),get open(){return open},destroy(){ro.disconnect();label.destroy();Object.values(values).forEach(s=>s.destroy())}};
  };
  K.mountDrag=(track,knob,{onUpdate=()=>{}}={})=>{
    let pointer=null,lastX=0,lastT=0,velocity=0,offset=0;
    const max=()=>Math.max(0,track.clientWidth-knob.offsetWidth);
    const spring=new K.Spring({onUpdate:()=>{knob.style.transform=`translateX(${spring.x}px)`;knob.setAttribute('aria-valuenow',String(Math.round(spring.x)));onUpdate(spring)}});
    knob.setAttribute('role','slider');knob.tabIndex=0;knob.setAttribute('aria-label','拖动并释放，或用左右键移动弹簧');knob.setAttribute('aria-valuemin','0');
    const scale=()=>track.getBoundingClientRect().width/track.offsetWidth||1;
    function down(e){if(e.button!==0||pointer!==null)return;pointer=e.pointerId;knob.setPointerCapture(pointer);spring.stop();const r=track.getBoundingClientRect();offset=(e.clientX-r.left)/scale()-spring.x;lastX=spring.x;lastT=performance.now();velocity=0;knob.dataset.dragging='true';knob.focus()}
    function move(e){if(e.pointerId!==pointer)return;const now=performance.now(),x=Math.max(0,Math.min(max(),(e.clientX-track.getBoundingClientRect().left)/scale()-offset));velocity=Math.max(-1800,Math.min(1800,(x-lastX)/Math.max(.008,(now-lastT)/1000)));lastX=x;lastT=now;spring.jump(x)}
    function release(e,cancel=false){if(e.pointerId!==pointer)return;const id=pointer;pointer=null;knob.dataset.dragging='false';if(knob.hasPointerCapture(id))knob.releasePointerCapture(id);if(performance.now()-lastT>100)velocity=0;spring.retarget(cancel?0:(spring.x+velocity*.12>max()/2?max():0),cancel?0:velocity)}
    knob.addEventListener('pointerdown',down);knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',e=>release(e));knob.addEventListener('pointercancel',e=>release(e,true));knob.addEventListener('lostpointercapture',e=>{if(pointer!==null)release(e,true)});
    knob.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();spring.retarget(e.key==='Home'?0:e.key==='End'?max():Math.max(0,Math.min(max(),spring.target+(e.key==='ArrowRight'?80:-80))))}});
    const ro=new ResizeObserver(()=>{knob.setAttribute('aria-valuemax',String(max()));if(pointer===null)spring.jump(Math.min(max(),spring.x))});ro.observe(track);
    const hide=()=>{if(document.hidden&&pointer!==null)release({pointerId:pointer},true)};document.addEventListener('visibilitychange',hide);
    return {spring,reset(){if(pointer!==null)release({pointerId:pointer},true);spring.jump(0)},destroy(){ro.disconnect();spring.destroy();document.removeEventListener('visibilitychange',hide)}};
  };
  K.mountPath=(path,nodes=[])=>{
    const length=path.getTotalLength();path.style.strokeDasharray=length;
    const spring=new K.Spring({stiffness:90,damping:22,onUpdate:()=>{const p=Math.max(0,Math.min(1,spring.x));path.style.strokeDashoffset=length*(1-p);nodes.forEach((node,i)=>{node.style.opacity=String(.18+.82*Math.max(0,Math.min(1,p*Math.max(1,nodes.length-1)-i+1)))})}});spring.jump(0);
    return {spring,set:p=>spring.retarget(Math.max(0,Math.min(1,p))),reset:()=>spring.jump(0)};
  };
  K.mountImage=(host,src)=>{const img=new Image();img.alt=host.dataset.alt||'用户素材';img.hidden=true;const fallback=host.querySelector('.fallback');img.onload=()=>{img.hidden=false;fallback.hidden=true};img.onerror=()=>{img.hidden=true;fallback.hidden=false;host.dataset.missing='true'};host.append(img);if(src)img.src=src;return img};
  class StateMachine {
    constructor(initial,edges,onChange){this.initial=initial;this.state=initial;this.edges=edges;this.onChange=onChange;onChange(initial)}
    dispatch(action){const next=this.edges[this.state]?.[action];if(next===undefined)return false;this.state=next;this.onChange(next);return true}
    reset(){this.state=this.initial;this.onChange(this.state)}
  }
  K.StateMachine=StateMachine;
  K.mountLight=el=>{el.addEventListener('pointermove',e=>{if(K.reduced())return;const r=el.getBoundingClientRect();el.style.setProperty('--light-x',`${(e.clientX-r.left)/r.width*100}%`);el.style.setProperty('--light-y',`${(e.clientY-r.top)/r.height*100}%`)})};
})();
