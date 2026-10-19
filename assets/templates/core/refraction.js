/* Optional procedural-scene refraction study. It does NOT sample arbitrary DOM. */
(() => {
  const K=globalThis.Keynote;
  K.mountRefraction=(canvas,status)=>{
    const gl=canvas.getContext('webgl',{antialias:false,alpha:false});
    function fallback(){canvas.hidden=true;status.textContent='WebGL 不可用 · 已降级为 Stable Glass';canvas.parentElement.classList.add('glass')}
    if(!gl){fallback();return {available:false,draw:()=>{}}}
    const vertex='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fragment=`precision mediump float;varying vec2 uv;uniform vec2 light;uniform float power;
      vec3 scene(vec2 p){float bands=smoothstep(.42,.48,sin(p.x*25.+p.y*8.)*.5+.5);return mix(vec3(.18,.43,.72),vec3(.84,.92,1.),bands)*(.8+.2*p.y);}
      void main(){vec2 d=(uv-vec2(.5))*vec2(1.,1.3);float r=length(d);float mask=1.-smoothstep(.31,.33,r);vec2 sampleUV=uv+normalize(d+vec2(.001))*.065*power*mask;vec3 c=scene(sampleUV);float rim=exp(-abs(r-.32)*95.);float shine=pow(max(0.,1.-length(uv-light)),16.);c=mix(c,c*.8+vec3(.2),mask*.3);gl_FragColor=vec4(c+rim*.32+shine*.23,1.);}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
    let program;
    try{program=gl.createProgram();const v=shader(gl.VERTEX_SHADER,vertex),f=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed')}catch{fallback();return {available:false,draw:()=>{}}}
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    let lost=false;const draw=(x=.3,y=.7)=>{if(lost||document.hidden)return;gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(gl.getUniformLocation(program,'light'),x,y);gl.uniform1f(gl.getUniformLocation(program,'power'),K.reduced()?0:1);gl.drawArrays(gl.TRIANGLES,0,6)};
    canvas.addEventListener('pointermove',e=>{if(!K.reduced()){const r=canvas.getBoundingClientRect();draw((e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height)}});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;fallback()});document.addEventListener('keynote-motion-change',()=>draw());draw();status.textContent='WebGL · 自有程序背景折射示意';return {get available(){return !lost},draw,destroy(){lost=true;gl.deleteBuffer(buffer);gl.deleteProgram(program)}};
  };
})();

/* material: independently authored, explicit-texture glass. No DOM capture and no third-party component code. */
(() => {
 const K=globalThis.Keynote,NS='http://www.w3.org/2000/svg';let serial=0;
 const svg=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 // Deliberately observable calibration source, shared byte-for-byte by every renderer.
 K.createGlassBackdrop=(w=1000,h=450)=>{
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle='#dceaf4';x.fillRect(0,0,w,h);
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#c9e8ff');g.addColorStop(.5,'#eef5f9');g.addColorStop(1,'#aecadd');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.strokeStyle='#a0b8ca';x.lineWidth=1;
  for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}
  for(let i=0;i<h;i+=32){x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke()}
  ['#0873cf','#de575d','#118976'].forEach((color,i)=>{x.strokeStyle=color;x.lineWidth=7;x.beginPath();x.moveTo(100+i*90,0);x.lineTo(540+i*90,h);x.stroke()});
  x.fillStyle='#1269af';x.fillRect(w*.78,0,23,h);x.fillStyle='#f4f9ff';x.fillRect(w*.78+23,0,18,h);
  x.strokeStyle='#297dba';x.lineWidth=4;x.beginPath();x.arc(w*.58,h*.46,105,0,Math.PI*2);x.stroke();return c;
 };
 // Signed-distance normals: neutral at the center, a smooth finite lens band at the edge.
 function shapeMap(w,h,r=32){
  const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);const x=c.getContext('2d'),im=x.createImageData(c.width,c.height),band=40;
  for(let y=0;y<c.height;y++)for(let i=0;i<c.width;i++){
   const px=i-w/2,py=y-h/2,qx=Math.abs(px)-(w/2-r),qy=Math.abs(py)-(h/2-r),ox=Math.max(qx,0),oy=Math.max(qy,0),len=Math.hypot(ox,oy);
   const d=len+Math.min(Math.max(qx,qy),0)-r,inside=-d;
   let nx,ny;if(len>0){nx=ox/len*Math.sign(px);ny=oy/len*Math.sign(py)}else {nx=qx>qy?Math.sign(px):0;ny=qy>=qx?Math.sign(py):0}
   const t=clamp(inside/band,0,1),amp=inside>=0&&inside<band?Math.sin(Math.PI*t):0,k=(y*c.width+i)*4;
   im.data[k]=Math.round(128+nx*amp*120);im.data[k+1]=Math.round(128+ny*amp*120);im.data[k+2]=128;im.data[k+3]=255;
  }x.putImageData(im,0,0);return c;
 }
 // Explicit Canvas/Image texture only. Rect is in the backdrop's logical coordinate system.
 K.mountTextureRefraction=(canvas,{backdrop,rect,params,onFallback=()=>{}}={})=>{
  let gl,program,buffer,texture,lost=false,draws=0;const timings=[];
  const fail=reason=>{lost=true;onFallback(reason);return false};
  if(!backdrop||!rect||rect.w*rect.h>1000000)return {available:false,reason:'missing texture or pixel budget',draw:()=>false,destroy(){}};
  try{
   gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
   const inputWidth=backdrop.width||backdrop.naturalWidth,inputHeight=backdrop.height||backdrop.naturalHeight,maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE);
   if(!inputWidth||!inputHeight||inputWidth>maxTexture||inputHeight>maxTexture)throw Error('texture not decoded or exceeds GPU limit');
   const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
   const v=compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0.,1.);}');
   const f=compile(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D bg;uniform vec2 size,origin,full;uniform float strength,aberration,blur;
    vec2 bend(vec2 p){vec2 q=abs(p-size*.5)-(size*.5-vec2(32.));vec2 o=max(q,0.);float d=length(o)+min(max(q.x,q.y),0.)-32.;float inside=-d;vec2 n=length(o)>.001?normalize(o)*sign(p-size*.5):(q.x>q.y?vec2(sign(p.x-size.x*.5),0.):vec2(0.,sign(p.y-size.y*.5)));return n*sin(clamp(inside/40.,0.,1.)*3.14159265)*.47;}
    vec3 at(vec2 p){vec2 n=bend(p),base=(origin+p)/full;float rr=texture2D(bg,base+n*(strength+aberration)/full).r;float gg=texture2D(bg,base+n*strength/full).g;float bb=texture2D(bg,base+n*(strength-aberration)/full).b;return vec3(rr,gg,bb);}
    void main(){vec2 p=vec2(uv.x,1.-uv.y)*size;vec3 c=at(p)*.4;c+=at(p+vec2(blur,0.))*.15;c+=at(p-vec2(blur,0.))*.15;c+=at(p+vec2(0.,blur))*.15;c+=at(p-vec2(0.,blur))*.15;gl_FragColor=vec4(c,1.);}`);
   program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,backdrop);if(gl.getError()!==gl.NO_ERROR)throw Error('GPU texture upload failed');
  }catch(e){fail(e.message)}
  const draw=(p=params,r=rect)=>{if(lost||document.hidden)return false;const start=performance.now();try{
   canvas.width=Math.round(r.w);canvas.height=Math.round(r.h);gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
   for(const [key,val]of Object.entries({size:[r.w,r.h],origin:[r.x,r.y],full:[backdrop.width||backdrop.naturalWidth,backdrop.height||backdrop.naturalHeight]}))gl.uniform2f(gl.getUniformLocation(program,key),...val);
   for(const [key,val]of Object.entries({strength:p.distortion,aberration:p.aberration,blur:p.blur}))gl.uniform1f(gl.getUniformLocation(program,key),val);
   gl.drawArrays(gl.TRIANGLES,0,6);draws++;timings.push(performance.now()-start);if(timings.length>120)timings.shift();return true;
  }catch(e){return fail(e.message)}};
  const loss=e=>{e.preventDefault();fail('context lost')};canvas.addEventListener('webglcontextlost',loss);
  return {get available(){return !lost},draw,get stats(){return {draws,cpuSubmitMs:[...timings],pixels:canvas.width*canvas.height}},destroy(){canvas.removeEventListener('webglcontextlost',loss);lost=true;if(gl){if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)}}};
 };
 K.mountGlass=(surface,{backdrop=null,rect=null,status=null,mode='stable',forceFallback=false,onFallback=()=>{}}={})=>{
  const id='keynote-optic-'+(++serial),params={distortion:40,blur:1,aberration:3,opacity:.18,rim:.6},statusFeedback=status&&K.mountText?K.mountText(status):null;let renderer='Frosted Fallback',reason='',dead=false,sourceURL='',lastMap='';
  surface.classList.add('optical-surface');
  const content=document.createElement('div');content.className='optical-content';content.append(...surface.childNodes);
  const optics=svg('svg',{'aria-hidden':'true',class:'optical-pixels',preserveAspectRatio:'none'}),defs=svg('defs'),filter=svg('filter',{id,filterUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'}),map=svg('feImage',{result:'lens-raw',preserveAspectRatio:'none'});
  filter.append(map,svg('feColorMatrix',{in:'lens-raw',result:'lens-map',type:'matrix',values:'1 0 0 0 -0.0019607843 0 1 0 0 -0.0019607843 0 0 1 0 0 0 0 0 1 0'}));const channels=[];
  ['R','G','B'].forEach((ch,i)=>{const disp=svg('feDisplacementMap',{in:'SourceGraphic',in2:'lens-map',xChannelSelector:'R',yChannelSelector:'G',result:'d'+i});channels.push(disp);filter.append(disp);const matrix=Array(20).fill(0);matrix[i*5+i]=1;matrix[18]=1;filter.append(svg('feColorMatrix',{in:'d'+i,type:'matrix',values:matrix.join(' '),result:'c'+i}))});
  filter.append(svg('feBlend',{in:'c0',in2:'c1',mode:'screen',result:'rg'}),svg('feBlend',{in:'rg',in2:'c2',mode:'screen',result:'rgb'}));const blur=svg('feGaussianBlur',{in:'rgb',stdDeviation:1});filter.append(blur);defs.append(filter);optics.append(defs);
  const image=svg('image',{filter:`url(#${id})`,preserveAspectRatio:'none'});optics.append(image);
  const canvas=document.createElement('canvas');canvas.className='optical-pixels';canvas.setAttribute('aria-hidden','true');
  const frost=document.createElement('div');frost.className='optical-frost';const rim=document.createElement('div');rim.className='optical-rim';surface.append(optics,canvas,frost,rim,content);
  let r=rect||{x:0,y:0,w:surface.clientWidth,h:surface.clientHeight};
  const supported=()=>!forceFallback&&!!backdrop&&!!sourceURL&&typeof SVGFEDisplacementMapElement!=='undefined';
  function source(){try{sourceURL=backdrop instanceof HTMLCanvasElement?backdrop.toDataURL():backdrop?.src||''}catch{sourceURL='';reason='background input unreadable'}}source();
  let webgl=null;webgl=K.mountTextureRefraction(canvas,{backdrop,rect:r,params,onFallback:why=>{reason=why;render();onFallback(why)}});
  function render(){if(dead)return;const opaque=document.documentElement.classList.contains('opaque')||matchMedia('(prefers-reduced-transparency: reduce)').matches;
   renderer=mode==='advanced'&&!forceFallback&&webgl?.available&&!opaque?'WebGL':mode==='optical'&&supported()&&!opaque?'SVG':'Frosted Fallback';
   if(mode==='advanced'&&renderer!=='WebGL'&&!reason)reason='WebGL / texture / pixel budget unavailable';
   surface.dataset.renderer=renderer;surface.dataset.mode=mode;optics.toggleAttribute('hidden',renderer!=='SVG');canvas.hidden=renderer!=='WebGL';
   surface.style.setProperty('--optical-opacity',opaque?1:params.opacity);surface.style.setProperty('--optical-rim',params.rim);surface.style.setProperty('--optical-blur',params.blur+'px');surface.style.setProperty('--optical-frost',renderer==='Frosted Fallback'?'blur('+params.blur+'px) saturate(1.12)':'none');
   if(renderer==='SVG'){
    optics.setAttribute('viewBox',`0 0 ${r.w} ${r.h}`);for(const n of [filter,map])for(const [k,v]of Object.entries({x:0,y:0,width:r.w,height:r.h}))n.setAttribute(k,v);
    const key=r.w+'x'+r.h;if(key!==lastMap){lastMap=key;map.setAttribute('href',shapeMap(r.w,r.h).toDataURL())}
    for(const [k,v]of Object.entries({x:-r.x,y:-r.y,width:backdrop.width||backdrop.naturalWidth,height:backdrop.height||backdrop.naturalHeight,href:sourceURL}))image.setAttribute(k,v);
    channels.forEach((n,i)=>n.setAttribute('scale',params.distortion+(1-i)*params.aberration));blur.setAttribute('stdDeviation',params.blur);
   }else if(renderer==='WebGL')webgl.draw(params,r);
   if(status){const label=`${renderer}${reason&&renderer==='Frosted Fallback'?' · '+reason:''} · ${backdrop?'explicit texture':'no texture'}`;if(statusFeedback)statusFeedback.set(label);else{status.dataset.value=label;status.textContent=label}}
  }
  const move=e=>{if(K.reduced())return;const b=surface.getBoundingClientRect();surface.style.setProperty('--optical-light-x',100*(e.clientX-b.left)/b.width+'%');surface.style.setProperty('--optical-light-y',100*(e.clientY-b.top)/b.height+'%')};surface.addEventListener('pointermove',move);
  const observer=new MutationObserver(()=>render());observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  const resize=new ResizeObserver(()=>{if(!rect){r={...r,w:surface.clientWidth,h:surface.clientHeight};render()}});resize.observe(surface);
  render();return {setMode(next){mode=next;reason='';render()},set(next){for(const k of Object.keys(params))if(k in next)params[k]=clamp(Number(next[k]),0,k==='opacity'||k==='rim'?1:k==='blur'?28:80);render()},get renderer(){return renderer},get params(){return {...params}},get available(){return !!webgl?.available&&!forceFallback},get stats(){return webgl?.stats},setBackdrop(next,nextRect=r){backdrop=next;r=nextRect;source();webgl.destroy();reason='texture replaced; remount for WebGL';render()},destroy(){dead=true;resize.disconnect();observer.disconnect();statusFeedback?.destroy();surface.removeEventListener('pointermove',move);webgl.destroy();optics.remove();canvas.remove();frost.remove();rim.remove();surface.append(...content.childNodes);content.remove()}};
 };
})();
