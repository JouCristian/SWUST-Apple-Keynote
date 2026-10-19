/* Stateful scalar springs. No dependencies, no perpetual idle loop. */
(() => {
  const K = globalThis.Keynote = globalThis.Keynote || {};
  const active = new Set();
  let raf = 0, last = 0;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  K.reduced = () => preference.matches || document.documentElement.classList.contains('static') || document.documentElement.classList.contains('reduce-motion');
  K.setReducedMotion=on=>{document.documentElement.classList.toggle('reduce-motion',Boolean(on));if(K.reduced()){K.settleSprings();K.cancelAnimations?.()}document.dispatchEvent(new Event('keynote-motion-change'))};
  function tick(now) {
    raf = 0;
    const dt = Math.min((now - (last || now - 16.67)) / 1000, .04);
    last = now;
    const renders = new Set(), rests = [];
    for (const s of [...active]) {
      s.integrate(dt);
      renders.add(s.onUpdate);
      if (s.settled()) {
        s.x = s.target; s.v = 0; active.delete(s);
        rests.push(s.onRest);
      }
    }
    renders.forEach(fn => fn()); rests.forEach(fn => fn());
    if (active.size) raf = requestAnimationFrame(tick); else last = 0;
  }
  class Spring {
    constructor({value=0, stiffness=210, damping=28, mass=1, onUpdate=()=>{}, onRest=()=>{}}={}) {
      this.x=value; this.v=0; this.target=value;
      this.onUpdate=onUpdate; this.onRest=onRest;
      this.configure({stiffness,damping,mass});
    }
    configure({stiffness=this.stiffness,damping=this.damping,mass=this.mass}) {
      if (![stiffness,damping,mass].every(n=>Number.isFinite(n)&&n>0)) throw Error('Spring parameters must be positive finite numbers');
      Object.assign(this,{stiffness,damping,mass});
    }
    integrate(dt) {
      const count=Math.ceil(dt/(1/240)), h=dt/count;
      for(let i=0;i<count;i++) {
        this.v += (-this.stiffness*(this.x-this.target)-this.damping*this.v)/this.mass*h;
        this.x += this.v*h;
      }
    }
    settled() { return Math.abs(this.x-this.target)<.001 && Math.abs(this.v)<.005; }
    retarget(value, velocity) {
      if(!Number.isFinite(value)) throw Error('Invalid spring target');
      this.target=value;
      if(velocity!==undefined) this.v=velocity;
      if(K.reduced()||document.hidden) return this.jump(value);
      active.add(this); if(!raf) raf=requestAnimationFrame(tick);
      return this;
    }
    jump(value) { active.delete(this); this.x=this.target=value;this.v=0;this.onUpdate();this.onRest();return this; }
    stop() { active.delete(this); return this; }
    destroy() { this.stop(); this.onUpdate=this.onRest=()=>{}; }
  }
  K.Spring=Spring;
  K.springStats=()=>({active:active.size,raf:!!raf});
  K.settleSprings=()=>{
    const list=[...active];active.clear();cancelAnimationFrame(raf);raf=0;last=0;
    list.forEach(s=>s.jump(s.target));
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)K.settleSprings()});
  preference.addEventListener('change',()=>{if(K.reduced())K.settleSprings();document.dispatchEvent(new Event('keynote-motion-change'))});
})();
