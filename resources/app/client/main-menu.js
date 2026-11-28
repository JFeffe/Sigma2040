import {RELEASE_LINK,hasReviewedPatchNotes,unreadPatchCount} from './patch-notes.js?v=247';
import {AI_LEVELS} from './ai-difficulty.js?v=247';
import {BUILD_VERSION} from './build-version.js?v=247';
import {menuTitleMarkup} from './menu-title.js?v=247';
import {campaignRules} from './campaign-rules.js?v=247';
import {renderRatio} from './graphics.js?v=247';
import {brand,button,esc,icon} from './ui.js?v=247';
import {COUNTRY} from './data.js?v=247';
export function menuChromeMarkup(desktop){
 const build=desktop
  ? `<span class="menu-build">BUILD ${BUILD_VERSION}</span>`
  : `<a class="menu-build" href="${RELEASE_LINK}" target="_blank" rel="noopener noreferrer">BUILD ${BUILD_VERSION}</a>`;
 return `<div class="menu-chrome">${build}${button(icon('arrow')+'<span>Retour</span>','menu-back','small command-back')}</div>`;
}

export function menuSkyMarkup(){
 return `<canvas class="menu-particles" aria-hidden="true"></canvas><div class="menu-earth" aria-hidden="true"><canvas id="menuEarth" width="1024" height="1024"></canvas><canvas id="menuOrbits"></canvas></div>`;
}

export function optionPage(content,page){
 return `<main class="command-menu option-page ${page}">
  <header class="command-menu-header">${brand()}</header>
  <section class="command-menu-body">${content}</section>
 </main>`;
}

export function mainMenu(campaign,{options=false,desktop=false,saveStatus=''}={}){
 const unread=options&&hasReviewedPatchNotes()?unreadPatchCount():0;
 const links=options
  ? button(icon('file')+' Notes de version'+(unread?`<small class="menu-option-count">${unread}</small>`:''),'patch-notes',unread?'patch-unread':'')+
    button(icon('settings')+' Paramètres','settings')+
    button(icon('help')+' Règles','rules')+
    button(icon('case')+' Sauvegardes','save-menu')
  : button(`<span>${campaign?.ended?'Consulter la campagne':'Continuer'}</span>
      <small class="continue-details">${campaign?`${esc(COUNTRY[campaign.player].name)} · IA ${AI_LEVELS[campaign.aiDifficulty||'bb1']} · Tour ${campaign.turn} / ${campaignRules(campaign).maxTurns}${campaign.ended?' · Campagne terminée':''}`:esc(saveStatus||'Aucune campagne enregistrée')}</small>`,
      'continue-game','primary continue-button',campaign?'':'disabled')+
    button(icon('target')+' Nouvelle partie','new')+
    button(icon('settings')+' Options','options')+
    (desktop?button('Quitter le jeu','quit-game','menu-help'):'');
 const title=options?brand():menuTitleMarkup();
 return `<main class="main-menu${options?' options-menu':''}">
  <section class="menu-panel">
   <div class="menu-brand"${options?'':' role="heading" aria-level="1"'}>${title}</div>
   ${options?'<h1 id="optionsTitle" tabindex="-1">Options</h1>':''}
   <nav aria-label="${options?'Options':'Menu principal'}">${links}</nav>
  </section>
 </main>`;
}

export function menuMotionReduced(){
 return document.documentElement.classList.contains('reduce-feedback')
  ||matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function slideMenuPage(panel, entering){
 const rest={transform:'translateX(0)',opacity:1};
 const outside={transform:'translateX(-105vw)',opacity:0};
 const animation=panel.animate(entering?[outside,rest]:[rest,outside],{
  duration:entering?400:230,
  easing:entering?'cubic-bezier(.19,.76,.28,1)':'cubic-bezier(.58,.04,.87,.43)',
  fill:'both'
 });
 return animation.finished.catch(()=>{}).finally(()=>animation.cancel());
}

const studioDuration=5000;
const titleFadeDuration=720;
const titleAssemblyDuration=1800;
const menuPanDelay=titleAssemblyDuration+550;
const menuPanDuration=2550;
const titleDuration=menuPanDelay+menuPanDuration;
const titleTravel=.27;

function playTitleArrival(menu,earth,nav){
 const title=menu.querySelector('.menu-title-art');
 const {clientWidth:width,clientHeight:height}=menu;
 const titleBox=title.getBoundingClientRect();
 const earthBox=earth.getBoundingClientRect();
 const titleScale=Math.min(1.22,(width-36)/(titleBox.width*(1+2*titleTravel)),(height-56)/titleBox.height);
 const titleX=(width-titleBox.width)/2-titleBox.left;
 const titleY=(height-titleBox.height)/2-titleBox.top;
 const centeredTitle=`translate(${titleX}px, ${titleY}px) scale(${titleScale})`;
 const perspective=Math.max(width,height);
 const distantScale=.82;
 const earthCenter=earthBox.left+earthBox.width/2;
 // Project the distant globe just beyond the right edge, then dolly forward as the camera pans.
 const earthX=(width+12+earthBox.width*distantScale/2-earthCenter)/distantScale;
 const earthY=-Math.min(height*.027,24)/distantScale;
 const earthZ=perspective*(1-1/distantScale);
 const earthPose=(x,y,z)=>`translateY(-50%) perspective(${perspective}px) translate3d(${x}px, ${y}px, ${z}px)`;
 const panEasing='cubic-bezier(.42,0,.38,1)';
 const panTiming={delay:menuPanDelay,duration:menuPanDuration,easing:panEasing,fill:'both'};

 const titleAnimation=title.animate([{transform:centeredTitle},{transform:'none'}],panTiming);
 const fade=title.animate([{opacity:0},{opacity:1}],{
  duration:titleFadeDuration,easing:'cubic-bezier(.33,0,.3,1)',fill:'backwards'
 });
 const assemblyTiming={duration:titleAssemblyDuration,easing:'cubic-bezier(.44,0,.24,1)',fill:'backwards'};
 const arrive=(selector,direction)=>title.querySelector(selector).animate([
  {transform:`translateX(${direction*titleTravel*100}%)`},{transform:'none'}
 ],assemblyTiming);
 const pieces=title.classList.contains('menu-title-fallback')?[]:[
  arrive('.menu-title-triangle',-1),arrive('.menu-title-lettering',1)
 ];
 const earthAnimation=earth.animate([
  {transform:earthPose(earthX,earthY,earthZ)},
  {transform:earthPose(0,0,0)}
 ],panTiming);
 const buttons=[...nav.querySelectorAll('button')].map((button,i)=>button.animate([
  {opacity:0,transform:'translate(-20px, 7px)'},
  {opacity:getComputedStyle(button).opacity,transform:'none'}
 ],{duration:650,delay:titleDuration-1050+i*115,easing:'ease-out',fill:'both'}));
 return {animations:[titleAnimation,fade,...pieces,earthAnimation,...buttons],assembly:pieces.at(-1)};
}

export function mountMenuIntro(menu,earth,onAssembly){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const nav=menu.querySelector('nav');
 const title=menu.querySelector('.menu-title-art');
 const textures=Promise.all([...title.querySelectorAll('defs image')].map(source=>{
  const image=new Image();
  image.src=source.getAttribute('href');
  return image.decode();
 })).then(()=>true,()=>false);
 const studio=document.createElement('div');
 studio.className='menu-studio';
 studio.setAttribute('role','heading');
 studio.setAttribute('aria-level','1');
 studio.innerHTML='<span class="menu-studio-logo" aria-hidden="true"></span><strong>VORLIX</strong>';
 menu.dataset.intro='studio';
 nav.inert=true;
 menu.prepend(studio);

 const listeners=new AbortController();
 const {signal}=listeners;
 let panelTimer,pendingTitle=false,titleStarted=0,assemblySignalled=false,animations=[];
 const timelineNow=()=>document.timeline.currentTime??performance.now();
 const canAnimate=()=>!!menu.animate&&!menuMotionReduced();
 function cancelAnimations(){
  animations.forEach(animation=>animation.cancel());
  animations=[];
 }
 function finish(){
  if(signal.aborted)return;
  listeners.abort();
  clearTimeout(panelTimer);
  cancelAnimations();
  delete menu.dataset.intro;
  menu.removeAttribute('data-intro-static');
  nav.inert=false;
  studio.remove();
 }
 function syncTitleArrival(){
  if(menu.dataset.intro!=='title')return;
  cancelAnimations();
  clearTimeout(panelTimer);
  const animated=canAnimate();
  menu.toggleAttribute('data-intro-static',!animated);
  if(!animated){
   panelTimer=setTimeout(finish,Math.max(0,titleDuration-(timelineNow()-titleStarted)));
   return;
  }
  const arrival=playTitleArrival(menu,earth,nav);
  animations=arrival.animations;
  // Resizing recomputes the camera, keeping all layers on the original document timeline.
  for(const animation of animations)animation.startTime=titleStarted;
  arrival.assembly?.finished.then(()=>{
   if(signal.aborted||assemblySignalled||animations!==arrival.animations)return;
   assemblySignalled=true;
   onAssembly?.();
  },()=>{});
  animations[0].finished.then(finish,()=>{});
 }
 async function showTitle(){
  clearTimeout(panelTimer);
  pendingTitle=true;
  // Decode during the studio card. A slow or missing texture can never swap into a moving title.
  const ready=await Promise.race([textures,new Promise(resolve=>{panelTimer=setTimeout(()=>resolve(false),900);})]);
  clearTimeout(panelTimer);
  if(signal.aborted)return;
  title.classList.toggle('menu-title-fallback',!ready);
  cancelAnimations();
  studio.remove();
  menu.dataset.intro='title';
  titleStarted=timelineNow();
  syncTitleArrival();
 }
 function skipPanel(){
  if(menu.dataset.intro==='studio'&&!pendingTitle)void showTitle();
  else finish();
 }
 if(canAnimate())animations.push(studio.animate([
  {opacity:1},{opacity:1,offset:.91,easing:'ease-in'},{opacity:0}
 ],{duration:studioDuration,fill:'both'}));
 panelTimer=setTimeout(showTitle,studioDuration);
 menu.addEventListener('click',skipPanel,{signal});
 document.addEventListener('keydown',event=>{
  if(event.code!=='Space'&&event.key!==' ')return;
  event.preventDefault();
  if(!event.repeat)skipPanel();
 },{signal});
 motion.addEventListener('change',syncTitleArrival,{signal});
 window.addEventListener('resize',syncTitleArrival,{signal});
 return finish;
}

// GPU sphere and separate orbital/particle layers: no flattened background image.
const TAU=Math.PI*2;
const orbits=[{tilt:.36,roll:.18,phase:.5,speed:.14},{tilt:1.12,roll:1.05,phase:2.8,speed:.11},{tilt:.82,roll:-.88,phase:4.3,speed:.09}];
function orbitPoint(a,o){const x=Math.cos(a),y=Math.sin(a)*Math.sin(o.tilt),z=Math.sin(a)*Math.cos(o.tilt),c=Math.cos(o.roll),s=Math.sin(o.roll);return {x:1.19*(x*c-y*s),y:1.19*(x*s+y*c),z:1.19*z};}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
function globeRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
 const shaders=[];const compile=(type,source)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();let buffer;const textures=[];
 const dispose=()=>{textures.forEach(t=>gl.deleteTexture(t));if(buffer)gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));};
 try{
 gl.attachShader(program,compile(gl.VERTEX_SHADER,`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`));
 gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision highp float;
 varying vec2 uv;uniform sampler2D day;uniform sampler2D night;uniform sampler2D clouds;uniform float angle;
 void main(){vec2 p=(uv-.5)/.38;float d=length(p);vec3 blue=vec3(.20,.64,1.);
 if(d>1.){float a=exp(-(d-1.)*65.)*.65+exp(-(d-1.)*18.)*.08;gl_FragColor=vec4(blue,a);return;}
 vec3 n=vec3(p,sqrt(max(0.,1.-d*d)));vec3 sun=normalize(vec3(.65,.4,.8));float lit=dot(n,sun);
 vec2 tex=vec2(fract((atan(n.x,n.z)+angle)/6.2831853+.5),acos(n.y)/3.14159265);
 vec3 ground=texture2D(day,tex).rgb;float cloud=texture2D(clouds,vec2(fract(tex.x+angle*.025),tex.y)).a;ground=mix(ground,vec3(.91,.95,1.),cloud*.68);vec3 lights=texture2D(night,tex).rgb;
 float daylight=smoothstep(-.16,.35,lit);float diffuse=.14+.94*max(lit,0.);
 vec3 color=ground*diffuse+lights*vec3(1.15,.85,.5)*(1.-daylight)*1.4;
 float rim=pow(1.-n.z,4.);color+=blue*rim*(.26+.6*max(lit,0.));
 gl_FragColor=vec4(color,1.);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 for(let i=0;i<3;i++){const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(gl.getUniformLocation(program,['day','night','clouds'][i]),i);}
 const loc=gl.getUniformLocation(program,'angle');
 return {gl,dispose,upload(im,i){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);},draw(a){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(loc,a);gl.drawArrays(gl.TRIANGLES,0,6);}};
 }catch(e){dispose();throw e;}
}
const menuAngles={
 home:0,options:.17,settings:.29,rules:.31,saves:.35,'patch-notes':.27,
 'new-game':-.16,setup:-.31,tutorials:-.29,multiplayer:-.33,lobby:-.39
};

export function mountMenuEarth(scene,page){
 let canvas=scene.querySelector('#menuEarth');
 const orbitCanvas=scene.querySelector('#menuOrbits'),stars=scene.querySelector('.menu-particles'),oc=orbitCanvas.getContext('2d'),sc=stars.getContext('2d');
 let renderer,stopFallback=()=>{},disposed=false,frame=0,previous=0,elapsed=0,dirty=true,w=0,h=0,side=0,dpr=1;
 let angle=menuAngles[page]??0,origin=angle,target=angle,turnedAt=0;
 const cameraAngle=()=>.52+elapsed*.035+angle;
 const fallback=()=>{if(disposed||canvas.classList.contains('menu-earth-fallback'))return;renderer?.dispose();renderer=null;const replacement=document.createElement('canvas');replacement.id='menuEarth';replacement.width=900;replacement.height=900;replacement.className='menu-earth-fallback';canvas.replaceWith(replacement);canvas=replacement;stopFallback=mountFallbackEarth(canvas,cameraAngle);};
 try{renderer=globeRenderer(canvas);}catch{fallback();}
 const onLost=e=>{e.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',onLost,{once:true});
 if(renderer){loadImage('./assets/menu-earth-day.jpg').then(im=>{if(!disposed&&renderer){renderer.upload(im,0);dirty=true;}}).catch(()=>{fallback();});loadImage('./assets/menu-earth-clouds.png').then(im=>{if(!disposed&&renderer){renderer.upload(im,2);dirty=true;}}).catch(()=>{});loadImage('./assets/menu-earth-night.png').then(im=>{if(!disposed&&renderer){renderer.upload(im,1);dirty=true;}}).catch(()=>{});}
 // Deterministic particles avoid a visual jump when returning to the menu.
 let seed=2040;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const dust=Array.from({length:170},()=>({x:random(),y:random(),r:.4+random()*1.1,depth:random(),phase:random()*TAU}));
 function resize(){w=stars.clientWidth;h=stars.clientHeight;dpr=renderRatio(innerWidth,innerHeight);side=canvas.parentElement.clientWidth;
 if(renderer){const resolution=Math.max(1,Math.round(side*dpr));canvas.width=canvas.height=resolution;}
 orbitCanvas.width=orbitCanvas.height=Math.round(side*dpr);stars.width=Math.round(w*dpr);stars.height=Math.round(h*dpr);dirty=true;}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);window.addEventListener('resize',resize);window.addEventListener('graphicschange',resize);resize();
 function drawOrbit(o,index){const r=side*.38,c=side/2;let connected=false;
 oc.beginPath();for(let j=0;j<=360;j++){const p=orbitPoint(j/360*TAU,o);const visible=p.z>=0||p.x*p.x+p.y*p.y>1.005;if(visible){const x=c+p.x*r,y=c-p.y*r;if(connected)oc.lineTo(x,y);else oc.moveTo(x,y);}connected=visible;}
 oc.lineWidth=1;oc.strokeStyle=index===0?'rgba(139,218,255,.76)':'rgba(108,197,247,.50)';oc.shadowColor='#4abaff';oc.shadowBlur=4;oc.stroke();oc.shadowBlur=0;
 const p=orbitPoint(o.phase+elapsed*o.speed,o);if(p.z<0&&p.x*p.x+p.y*p.y<=1.005)return;
 const x=c+p.x*r,y=c-p.y*r;oc.save();oc.translate(x,y);oc.rotate(-o.roll);oc.shadowColor='#7edbff';oc.shadowBlur=12;oc.fillStyle='#d6f5ff';oc.beginPath();oc.arc(0,0,2.6,0,TAU);oc.fill();oc.shadowBlur=0;oc.fillStyle='#699cb9';oc.strokeStyle='#b6e6ff';oc.lineWidth=.6;for(const dx of [-10,5]){oc.fillRect(dx,-2.5,5,5);oc.strokeRect(dx,-2.5,5,5);}oc.restore();}
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden){previous=0;return;}if(previous&&now-previous<33)return;const dt=previous?Math.min(now-previous,100)/1000:0;previous=now;const still=menuMotionReduced();if(!still)elapsed+=dt;if(still&&!dirty&&angle===target)return;dirty=false;
 const progress=still?1:Math.max(0,Math.min(1,(now-turnedAt)/700));
 angle=progress===1?target:origin+(target-origin)*progress*progress*(3-2*progress);
 renderer?.draw(cameraAngle());oc.setTransform(dpr,0,0,dpr,0,0);oc.clearRect(0,0,side,side);orbits.forEach(drawOrbit);
 sc.setTransform(dpr,0,0,dpr,0,0);
 sc.clearRect(0,0,w,h);
 const starMargin=16;
 const starSpan=w+2*starMargin;
 for(const p of dust){
  const x=(p.x*starSpan+elapsed*(4+6*p.depth))%starSpan-starMargin;
  const alpha=.18+.42*p.depth+Math.sin(elapsed*.4+p.phase)*.1;
  sc.fillStyle=`rgba(170,216,250,${alpha})`;
  sc.beginPath();sc.arc(x,p.y*h,p.r,0,TAU);sc.fill();
  if(p.depth>.93){sc.shadowColor='#8acfff';sc.shadowBlur=9;sc.fill();sc.shadowBlur=0;}
 }
 }
 frame=requestAnimationFrame(draw);
 return {
  face(page){
   const next=menuAngles[page]??0;
   if(next===target)return;
   origin=angle;target=next;turnedAt=performance.now();dirty=true;
  },
  dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('graphicschange',resize);canvas.removeEventListener('webglcontextlost',onLost);renderer?.dispose();stopFallback();}
 };
}

// Software fallback retains rotation and lighting when WebGL is unavailable.
let earthImages;
function mountFallbackEarth(canvas,cameraAngle){
 const ctx=canvas.getContext('2d'),size=canvas.width,r=size*.38,c=size/2;let disposed=false,frame=0;
 const read=async src=>{const im=await loadImage(src),tmp=document.createElement('canvas');tmp.width=im.width;tmp.height=im.height;const tc=tmp.getContext('2d');tc.drawImage(im,0,0);return {w:im.width,h:im.height,data:tc.getImageData(0,0,im.width,im.height).data};};
 earthImages??=Promise.all([read('./assets/menu-earth-day.jpg'),read('./assets/menu-earth-night.png').catch(()=>null),read('./assets/menu-earth-clouds.png').catch(()=>null)]).catch(e=>{earthImages=null;throw e;});
 earthImages.then(([tex,night,clouds])=>{if(disposed)return;const pixels=[],out=ctx.createImageData(size,size),data=out.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-c)/r,ny=(c-y)/r,d=Math.hypot(nx,ny),i=(y*size+x)*4;
 if(d>1){data[i]=51;data[i+1]=163;data[i+2]=255;data[i+3]=255*(Math.exp(-(d-1)*65)*.65+Math.exp(-(d-1)*18)*.08);continue;}
 const z=Math.sqrt(1-d*d),lit=(nx*.65+ny*.4+z*.8)/1.105,daylight=Math.max(0,Math.min(1,(lit+.16)/.51));pixels.push({i,lon:Math.atan2(nx,z),v:Math.acos(ny)/Math.PI,light:.14+.94*Math.max(0,lit),night:1-daylight*daylight*(3-2*daylight),rim:Math.pow(1-z,4)*(.26+.6*Math.max(0,lit))});data[i+3]=255;}
 let previous=0,lastAngle;
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden){previous=0;return;}if(previous&&now-previous<80)return;previous=now;
 const angle=cameraAngle();if(angle===lastAngle)return;lastAngle=angle;
 for(const p of pixels){const u=((p.lon+angle)/TAU+.5+1)%1,tx=u*tex.w,ty=p.v*(tex.h-1),x=Math.floor(tx),y=Math.floor(ty),fx=tx-x,fy=ty-y,j=(y*tex.w+x)*4,jx=(y*tex.w+(x+1)%tex.w)*4,jy=(Math.min(y+1,tex.h-1)*tex.w+x)*4,jxy=(Math.min(y+1,tex.h-1)*tex.w+(x+1)%tex.w)*4;
 const n=night?(Math.min(night.h-1,Math.floor(p.v*night.h))*night.w+Math.floor(u*night.w))*4:0;
 const cu=(u+angle*.025)%1,k=clouds?(Math.min(clouds.h-1,Math.floor(p.v*clouds.h))*clouds.w+Math.floor(cu*clouds.w))*4:0,cloud=clouds?clouds.data[k+3]/255*.68:0;
 for(let ch=0;ch<3;ch++){const base=(tex.data[j+ch]*(1-fx)+tex.data[jx+ch]*fx)*(1-fy)+(tex.data[jy+ch]*(1-fx)+tex.data[jxy+ch]*fx)*fy;const ground=base*(1-cloud)+[232,242,255][ch]*cloud;data[p.i+ch]=ground*p.light+(night?night.data[n+ch]*[1.15,.85,.5][ch]*p.night*1.4:0)+[51,163,255][ch]*p.rim;}}
 ctx.putImageData(out,0,0);}
 draw(0);
 }).catch(()=>{});return ()=>{disposed=true;cancelAnimationFrame(frame);};
}
