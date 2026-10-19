/* A reusable, deterministic event demonstration for both the Lab and Playground. */
(() => {
  const K=globalThis.Keynote;
  K.arrivalMarkup=(label)=>`<article class="arrival-example"><header><span>${K.escape(label)}</span><strong data-status>Ready</strong></header><svg viewBox="0 0 600 230" role="img" aria-label="任务事件从左到右到达"><path d="M50 140H550" stroke="#d9e1ed" stroke-width="3"/><path data-edge d="M50 140H550" fill="none" stroke="#007aff" stroke-width="4"/><path data-arrow d="M538 132L550 140L538 148" fill="none" stroke="#007aff" stroke-width="4"/><circle data-node cx="550" cy="140" r="25" fill="#f5f8fc" stroke="#c4cedc" stroke-width="3"/><circle data-flight cx="50" cy="140" r="8" fill="#007aff"/><text data-edge-label x="300" y="97" fill="#005fc7" text-anchor="middle">EVENT</text></svg><p data-result>结果已提交 · 可以继续下一步</p></article>`;
  K.mountArrival=(root,{smooth=true,onCommit=()=>{}}={})=>{
    const $=s=>root.querySelector(s),edge=$('[data-edge]'),arrow=$('[data-arrow]'),node=$('[data-node]'),dot=$('[data-flight]'),result=$('[data-result]');
    let semantic='Ready',resetting=false;
    const feedback=new K.Settlement({root,text:$('[data-status]'),initial:'Ready',onCommit:value=>{semantic=value;onCommit(value)},bindings:[
      {elements:[edge,arrow],property:'stroke',from:'#007aff',to:'#9dbde3'},
      {elements:$('[data-edge-label]'),property:'fill',from:'#005fc7',to:'#4975a9'},
      {elements:node,property:'stroke',from:'#c4cedc',to:'#007aff'},
      {elements:$('[data-status]'),property:'color',from:'#626269',to:'#005fc7'},
      {elements:result,property:'opacity',from:0,to:1}
    ]});
    const length=edge.getTotalLength();edge.style.strokeDasharray=length;
    const render=()=>{
      const p=Math.max(0,Math.min(1,progress.x));edge.style.strokeDashoffset=length*(1-p);
      const xy=edge.getPointAtLength(p*length);dot.setAttribute('cx',xy.x);dot.setAttribute('cy',xy.y);dot.style.opacity=String(Math.min(1,(1-p)*25));arrow.style.opacity=String(Math.max(0,(p-.9)*10));
      const next=p>=.9999?'Arrived':'Ready';
      if(next!==semantic)feedback.commit(next,{emphasis:next==='Arrived'?1:0,instant:resetting||!smooth});
      root.dataset.phase=semantic==='Arrived'||progress.settled()?feedback.phase:'Main Action';
    };
    const progress=new K.Spring({stiffness:65,damping:18,onUpdate:render,onRest:render});
    const api={root,progress,feedback,get semantic(){return semantic},get phase(){return semantic==='Arrived'||progress.settled()?feedback.phase:'Main Action'},
      play(){if(progress.x>=.9999)api.reset();root.dataset.phase='Preparation';progress.retarget(1);root.dataset.phase='Main Action'},
      interrupt(){progress.retarget(progress.target?0:1)},reverse(){progress.retarget(0)},
      reset(){resetting=true;progress.jump(0);feedback.reset();root.dataset.phase='Stable State';resetting=false},
      settle(){resetting=true;progress.jump(progress.target);feedback.settle();resetting=false;root.dataset.phase='Stable State'},
      destroy(){progress.destroy();feedback.destroy()}
    };api.reset();return api;
  };
  K.mountArrivalComparison=(host)=>{
    host.innerHTML=K.arrivalMarkup('Before · 硬切')+K.arrivalMarkup('After · 连续收尾');
    const children=[...host.children],before=K.mountArrival(children[0],{smooth:false}),after=K.mountArrival(children[1]);
    return {before,after,play:()=>{before.play();after.play()},interrupt:()=>{before.interrupt();after.interrupt()},reverse:()=>{before.reverse();after.reverse()},reset:()=>{before.reset();after.reset()},settle:()=>{before.settle();after.settle()},destroy:()=>{before.destroy();after.destroy()}};
  };
})();
