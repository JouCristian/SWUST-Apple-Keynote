/* Result feedback uses the existing Spring scheduler. Semantic commit never waits for it. */
(() => {
  const K=globalThis.Keynote, owners=new Set(), clamp=n=>Math.max(0,Math.min(1,n));
  const color=value=>{
    if(Array.isArray(value))return value;
    if(/^#[0-9a-f]{6}$/i.test(value))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
    throw Error('Color bindings require #RRGGBB or RGB arrays');
  };
  K.interpolateColor=(a,b,p)=>{a=color(a);b=color(b);return `rgb(${a.map((n,i)=>Math.round(n+(b[i]-n)*clamp(p))).join(', ')})`};
  class TextCrossfade {
    constructor(host){
      this.root=this.host=host;this.value=host.textContent;this.animations=[];this.revision=0;
      this.stack=document.createElement('span');this.stack.className='state-text-stack';
      this.current=document.createElement('span');this.previous=document.createElement('span');
      this.current.className='state-text-current';this.previous.className='state-text-previous';
      [this.current,this.previous].forEach(n=>n.setAttribute('aria-hidden','true'));
      this.current.textContent=this.value;this.stack.append(this.previous,this.current);host.replaceChildren(this.stack);
      host.dataset.value=this.value;host.setAttribute('aria-label',this.value);owners.add(this);
    }
    set(value,{instant=false}={}){
      value=String(value);if(value===this.value){if(instant)this.settle();return}
      const a=Number(getComputedStyle(this.current).opacity),b=Number(getComputedStyle(this.previous).opacity);
      const old=b>a?this.previous.textContent:this.current.textContent,alpha=Math.max(a,b);
      this.settle();this.value=value;this.host.dataset.value=value;this.host.setAttribute('aria-label',value);this.current.textContent=value;
      if(instant||K.reduced()||document.hidden)return;
      this.previous.textContent=old;
      this.animations=[K.animate(this.previous,[{opacity:alpha},{opacity:0}],{duration:150}),K.animate(this.current,[{opacity:0},{opacity:1}],{duration:280,easing:K.ease.emphasized})].filter(Boolean);
      const revision=this.revision;Promise.allSettled(this.animations.map(a=>a.finished)).then(()=>{if(revision===this.revision)this.onRest?.()});
    }
    settle(){this.revision++;this.animations.forEach(a=>a.cancel());this.animations=[];this.previous.textContent=''}
    get active(){return this.animations.some(a=>a.playState==='running')}
    destroy(){this.settle();owners.delete(this);this.host.textContent=this.value;this.host.removeAttribute('aria-label')}
  }
  K.mountText=(host)=>new TextCrossfade(host);
  K.mountVisual=(root,bindings,{initial=0}={})=>{
    const render=()=>{const p=clamp(spring.x);bindings.forEach(({elements,property,from,to})=>{
      const value=typeof from==='number'?from+(to-from)*p:K.interpolateColor(from,to,p);
      (Array.isArray(elements)?elements:[elements]).forEach(el=>{if(el)el.style[property]=String(value)});
    })};
    const spring=new K.Spring({value:initial,stiffness:240,damping:32,onUpdate:render});
    const api={root,spring,set(p,{instant=false}={}){spring[instant?'jump':'retarget'](clamp(p))},settle(){spring.jump(spring.target)},get active(){return !spring.settled()},destroy(){spring.destroy();owners.delete(api)}};
    owners.add(api);render();return api;
  };
  class Settlement {
    constructor({root,text,bindings=[],initial='Ready',onCommit=()=>{}}){
      this.root=root;this.text=K.mountText(text);this.visual=K.mountVisual(root,bindings);this.onCommit=onCommit;this.initial=initial;this.value=initial;
      this.visual.spring.onRest=()=>this.syncPhase();this.text.onRest=()=>this.syncPhase();this.commit(initial,{instant:true});owners.add(this);
    }
    commit(value,{label=value,emphasis=0,instant=false}={}){
      this.value=value;this.root.dataset.phase='Semantic Commit';this.root.dataset.semantic=value;
      this.onCommit(value); // Domain state and control validity update at the event, not on animation end.
      this.text.set(label,{instant});this.visual.set(emphasis,{instant});this.root.dataset.phase=this.active?'Visual Settlement':'Stable State';
    }
    get active(){return this.text.active||this.visual.active}
    syncPhase(){this.root.dataset.phase=this.active?'Visual Settlement':'Stable State'}
    get phase(){return this.active?'Visual Settlement':'Stable State'}
    settle(){this.text.settle();this.visual.settle();this.root.dataset.phase='Stable State'}
    reset(value=this.initial){this.commit(value,{instant:true});this.settle()}
    destroy(){this.text.destroy();this.visual.destroy();owners.delete(this)}
  }
  K.Settlement=Settlement;
  K.settleFeedback=(root)=>{for(const owner of owners)if(!root||root===owner.root||root.contains(owner.root))owner.settle()};
  K.feedbackStats=()=>({owners:owners.size,active:[...owners].filter(o=>o.active).length});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)K.settleFeedback()});
  document.addEventListener('keynote-motion-change',()=>{if(K.reduced())K.settleFeedback()});
})();
