(() => {
  const K=globalThis.Keynote;
  K.ease={smooth:'cubic-bezier(.16,1,.3,1)',emphasized:'cubic-bezier(.22,1,.36,1)',inOut:'cubic-bezier(.65,0,.35,1)'};
  const animations=new Set();
  K.animate=(element,frames,options={})=>{
    if(!element||K.reduced()||document.hidden||!element.animate)return null;
    const a=element.animate(frames,{duration:380,easing:K.ease.smooth,fill:'backwards',...options});
    animations.add(a);a.finished.then(()=>{animations.delete(a);a.cancel()},()=>animations.delete(a));return a;
  };
  K.cancelAnimations=(root)=>{for(const a of [...animations])if(!root||root.contains(a.effect?.target)){a.cancel();animations.delete(a)}};
  K.recipes=['soft-fade','cross-dissolve','shared','morph','push-in','pull-back','spatial-slide','focus-shift','camera-pan','camera-zoom','stagger','path-draw','parallax','scene-reset','reverse'];
  K.sceneRelationships={'overview-detail':'push-in','detail-overview':'pull-back','process-next':'spatial-slide','chapter-boundary':'scene-reset','focus-transfer':'focus-shift'};
  function recipe(name,d=1){
    const r={x:0,y:0,s:1,ox:0,oy:0,os:1,k:105,c:23};
    if(name==='soft-fade')Object.assign(r,{k:190,c:28});
    if(['spatial-slide','reverse'].includes(name))Object.assign(r,{x:d*150,ox:-d*100});
    if(name==='camera-pan')Object.assign(r,{x:d*300,ox:-d*220});
    if(['shared','morph'].includes(name))Object.assign(r,{y:12,oy:-8});
    if(name==='focus-shift')Object.assign(r,{x:d*64,ox:-d*32,k:160,c:28});
    if(['push-in','camera-zoom'].includes(name))Object.assign(r,{s:.92,os:1.07});
    if(name==='pull-back')Object.assign(r,{s:1.08,os:.94});
    if(name==='parallax')Object.assign(r,{x:d*90,ox:-d*90});
    if(name==='scene-reset')Object.assign(r,{y:20,oy:-12,k:80,c:20});
    return r;
  }
  function layoutRect(el,root){
    let x=0,y=0,n=el;
    while(n&&n!==root){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent}
    return {x,y,w:el.offsetWidth,h:el.offsetHeight};
  }
  class SharedLayer {
    constructor(root,onRest=()=>{}){this.root=root;root.dataset.sceneRoot='true';this.onRest=onRest;this.objects=new Map();this.layer=document.createElement('div');this.layer.className='shared-layer';this.layer.setAttribute('aria-hidden','true');root.append(this.layer)}
    target(slide,instant=false){
      const present=new Set();
      for(const anchor of slide.querySelectorAll('[data-shared]')){
        if(anchor.closest('[data-scene-root]')!==this.root)continue;
        const id=anchor.dataset.shared;present.add(id);
        let object=this.objects.get(id);
        const rect=layoutRect(anchor,this.root);
        const radius=parseFloat(getComputedStyle(anchor).borderRadius)||24;
        if(!object){
          const node=document.createElement('div');node.className='shared-object '+(anchor.dataset.sharedClass||'');
          node.innerHTML=anchor.innerHTML;node.dataset.identity=id;this.layer.append(node);
          object={node,values:{},content:anchor.innerHTML};
          const render=()=>{const s=object.values;if(!s.a)return;Object.assign(node.style,{transform:`translate(${s.x.x}px,${s.y.x}px)`,width:`${s.w.x}px`,height:`${s.h.x}px`,borderRadius:`${s.r.x}px`,opacity:Math.max(0,Math.min(1,s.a.x)),visibility:s.a.x<.003?'hidden':'visible'})};
          for(const [key,value]of Object.entries({...rect,r:radius,a:0}))object.values[key]=new K.Spring({value,onUpdate:render,onRest:this.onRest});
          this.objects.set(id,object);
        }
        if(object.content!==anchor.innerHTML){object.content=anchor.innerHTML;object.node.innerHTML=anchor.innerHTML}
        const alpha=anchor.dataset.sharedVisible==='false'?0:Math.max(0,Math.min(1,Number(anchor.dataset.sharedOpacity??1)));
        for(const [key,val]of Object.entries({...rect,r:radius,a:alpha}))object.values[key][instant?'jump':'retarget'](val);
      }
      for(const [id,object]of this.objects)if(!present.has(id))object.values.a[instant?'jump':'retarget'](0);
    }
    destroy(){for(const o of this.objects.values())Object.values(o.values).forEach(s=>s.destroy());this.layer.remove();this.root.removeAttribute('data-scene-root')}
  }
  class SceneMotion {
    constructor(root,slides){
      this.root=root;this.slides=slides;this.current=0;this.state='Idle';this.shared=new SharedLayer(root,()=>this.checkRest());
      this.items=slides.map((el,i)=>{
        const item={el,values:{},text:[...el.querySelectorAll('h1,h2,.lead,[data-scene-text]')].filter(n=>!n.closest('[data-shared]')&&n.closest('[data-scene-root]')===root)};
        const render=()=>{
          const v=item.values;if(!v.a)return;
          el.style.transform=`translate(${v.x.x}px,${v.y.x}px) scale(${v.s.x})`;
          el.style.opacity=Math.max(0,Math.min(1,v.a.x));
          el.style.visibility=(i===this.current||v.a.x>.003)?'visible':'hidden';
          item.text.forEach(n=>n.style.opacity=Math.max(0,Math.min(1,v.t.x)));
        };
        const rest=()=>this.checkRest();
        for(const [key,value]of Object.entries({x:0,y:0,s:1,t:i===0?1:0,a:i===0?1:0}))item.values[key]=new K.Spring({value,stiffness:105,damping:23,onUpdate:render,onRest:rest});
        return item;
      });
      this.go(0,'soft-fade',true);
    }
    checkRest(){if(this.items?.every(it=>Object.values(it.values).every(s=>s.settled()))&&[...this.shared.objects.values()].every(o=>Object.values(o.values).every(s=>s.settled()))){this.state='Active';this.items.forEach((it,j)=>it.el.dataset.sceneState=j===this.current?'Active':'Idle')}}
    go(n,name='cross-dissolve',instant=false){
      name=K.sceneRelationships[name]||name;this.lastRecipe=name;
      n=Math.max(0,Math.min(this.items.length-1,n));const old=this.current,d=n>=old?1:-1;
      if(this.state!=='Active'&&this.state!=='Idle')this.state='Interrupted';
      this.current=n;this.state='Entering';
      const r=recipe(name,d),incoming=this.items[n];
      if(old!==n)K.settleFeedback?.(this.items[old].el);
      K.cancelAnimations(this.root);
      if(incoming.values.a.x<.003&&!instant){incoming.values.x.jump(r.x);incoming.values.y.jump(r.y);incoming.values.s.jump(r.s)}
      this.items.forEach((item,i)=>{
        item.el.inert=i!==n;item.el.setAttribute('aria-hidden',String(i!==n));item.el.style.zIndex=i===n?'2':'1';
        item.el.dataset.sceneState=i===n?'Entering':'Exiting';
        const targets={x:i===n?0:r.ox,y:i===n?0:r.oy,s:i===n?1:r.os,t:i===n?1:0,a:i===n?1:0};
        for(const [key,val]of Object.entries(targets)){
          // Clear outgoing text early while the shared object continues its journey.
          item.values[key].configure(key==='t'?(i===n?{stiffness:95,damping:24}:{stiffness:1400,damping:70}):key==='a'&&i!==n?{stiffness:600,damping:45}:{stiffness:r.k,damping:r.c});
          item.values[key][instant?'jump':'retarget'](val);
        }
      });
      this.shared.target(incoming.el,instant);
      if(name==='stagger')incoming.el.querySelectorAll('[data-reveal]').forEach((el,i)=>K.animate(el,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:400,delay:Math.min(i*75,300)}));
      if(name==='parallax')incoming.el.querySelectorAll('[data-layer]').forEach(el=>K.animate(el,[{transform:`translateX(${d*Number(el.dataset.layer)*50}px)`},{transform:'none'}],{duration:700}));
      if(name==='path-draw')incoming.el.querySelectorAll('path[data-reveal-path]').forEach(p=>K.animate(p,[{strokeDasharray:p.getTotalLength(),strokeDashoffset:p.getTotalLength()},{strokeDasharray:p.getTotalLength(),strokeDashoffset:0}],{duration:700}));
      if(instant||K.reduced())this.state='Active';
    }
    destroy(){K.cancelAnimations(this.root);this.items.forEach(it=>Object.values(it.values).forEach(s=>s.destroy()));this.shared.destroy()}
  }
  K.SceneMotion=SceneMotion;K.SharedLayer=SharedLayer;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)K.cancelAnimations()});
  document.addEventListener('keynote-motion-change',()=>{if(K.reduced())K.cancelAnimations()});
})();
