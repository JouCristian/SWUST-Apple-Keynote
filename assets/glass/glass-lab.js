(() => {
 const K=globalThis.Keynote,inputs=[...document.querySelectorAll('[data-param]')],defaults=inputs.map(n=>n.value),controllers=[];
 document.querySelectorAll('[data-tier]').forEach(article=>{const source=K.createGlassBackdrop(1000,600);source.className='backdrop';article.querySelector('.test-scene').prepend(source);controllers.push(K.mountGlass(article.querySelector('.lens'),{backdrop:source,rect:{x:120,y:132,w:760,h:330},mode:article.dataset.tier,status:article.querySelector('.renderer')}))});
 function update(){const p={};inputs.forEach(n=>{p[n.dataset.param]=Number(n.value);n.previousElementSibling.textContent=n.value});controllers.forEach(c=>c.set(p))}
 inputs.forEach(n=>n.oninput=update);document.querySelector('#reset').onclick=()=>{inputs.forEach((n,i)=>n.value=defaults[i]);update()};
 document.querySelector('#opaque').onclick=e=>{const on=document.documentElement.classList.toggle('opaque');e.currentTarget.setAttribute('aria-pressed',String(on))};
 document.querySelector('#missing').onclick=()=>controllers.forEach(c=>c.setBackdrop(null));document.querySelector('#restore').onclick=()=>location.reload();
 globalThis.glassLab={controllers,update};update();
})();
