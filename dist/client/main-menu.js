import {unreadPatchCount} from './patch-notes.js?v=174';
import {AI_LEVELS} from './ai-difficulty.js?v=174';
import {BUILD_VERSION} from './build-version.js?v=174';
import {campaignRules} from './campaign-rules.js?v=174';
import {renderRatio} from './graphics.js?v=174';
import {brand,button,esc} from './ui.js?v=174';
import {COUNTRY} from './data.js?v=174';
export function mainMenu(s){return `<main class="main-menu"><span class="menu-build">BUILD ${BUILD_VERSION}</span><canvas class="menu-particles" aria-hidden="true"></canvas><div class="menu-earth" aria-hidden="true"><canvas id="menuEarth" width="1024" height="1024"></canvas><canvas id="menuOrbits"></canvas></div><section class="menu-panel"><div class="menu-brand">${brand()}</div><p class="menu-eyebrow">OPÉRATION LIGNE DE FAILLE</p><h1>Déjouez leurs plans. Imposez votre influence.</h1><nav aria-label="Menu principal">${button(`<span>${s?.ended?'Consulter la campagne':'Continuer'}</span><small class="continue-details">${s?`${esc(COUNTRY[s.player].name)} · IA ${AI_LEVELS[s.aiDifficulty||'normal']} · Tour ${s.turn} / ${campaignRules(s).maxTurns}${s.ended?' · Campagne terminée':''}`:'Aucune campagne enregistrée'}</small>`,'continue-game','primary continue-button',s?'':'disabled')}${button('Nouvelle partie','new','')}${button('Multijoueur','mp-entry','')}${button('Patch notes'+(unreadPatchCount()?' · '+unreadPatchCount()+' non lues':''),'patch-notes',unreadPatchCount()?'patch-unread':'')}${button('Mods','mods','')}${button('Paramètres','settings','')}${button('Règles et sauvegarde','help','menu-help')}</nav></section><footer>SIGMA NETWORK / 2040 <span>La musique démarre à votre première interaction.</span></footer></main>`;}

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
export function mountMenuEarth(){
 let canvas=document.querySelector('#menuEarth');if(!canvas)return ()=>{};
 const orbitCanvas=document.querySelector('#menuOrbits'),stars=document.querySelector('.menu-particles'),oc=orbitCanvas.getContext('2d'),sc=stars.getContext('2d');
 let renderer,stopFallback=()=>{},disposed=false,frame=0,previous=0,elapsed=0,dirty=true,w=0,h=0,side=0,dpr=1;
 const reduced=()=>document.documentElement.classList.contains('reduce-feedback')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fallback=()=>{if(disposed)return;renderer?.dispose();renderer=null;const replacement=document.createElement('canvas');replacement.id='menuEarth';replacement.width=900;replacement.height=900;replacement.className='menu-earth-fallback';canvas.replaceWith(replacement);canvas=replacement;stopFallback=mountFallbackEarth();};
 try{renderer=globeRenderer(canvas);}catch{fallback();}
 const onLost=e=>{e.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',onLost,{once:true});
 if(renderer){loadImage('./assets/menu-earth-day.jpg').then(im=>{if(!disposed&&renderer){renderer.upload(im,0);dirty=true;}}).catch(()=>{fallback();});loadImage('./assets/menu-earth-clouds.png').then(im=>{if(!disposed&&renderer){renderer.upload(im,2);dirty=true;}}).catch(()=>{});loadImage('./assets/menu-earth-night.png').then(im=>{if(!disposed&&renderer){renderer.upload(im,1);dirty=true;}}).catch(()=>{});}
 // Deterministic particles avoid a visual jump when returning to the menu.
 let seed=2040;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const dust=Array.from({length:170},()=>({x:random(),y:random(),r:.4+random()*1.1,depth:random(),phase:random()*TAU}));
 function resize(){w=innerWidth;h=innerHeight;dpr=renderRatio(w,h);side=canvas.parentElement.getBoundingClientRect().width;
 if(renderer){const resolution=Math.max(1,Math.round(side*dpr));canvas.width=canvas.height=resolution;}
 orbitCanvas.width=orbitCanvas.height=Math.round(side*dpr);stars.width=Math.round(w*dpr);stars.height=Math.round(h*dpr);dirty=true;}
 const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);window.addEventListener('resize',resize);window.addEventListener('graphicschange',resize);resize();
 function drawOrbit(o,index){const r=side*.38,c=side/2;let connected=false;
 oc.beginPath();for(let j=0;j<=360;j++){const p=orbitPoint(j/360*TAU,o);const visible=p.z>=0||p.x*p.x+p.y*p.y>1.005;if(visible){const x=c+p.x*r,y=c-p.y*r;if(connected)oc.lineTo(x,y);else oc.moveTo(x,y);}connected=visible;}
 oc.lineWidth=1;oc.strokeStyle=index===0?'rgba(139,218,255,.76)':'rgba(108,197,247,.50)';oc.shadowColor='#4abaff';oc.shadowBlur=4;oc.stroke();oc.shadowBlur=0;
 const p=orbitPoint(o.phase+elapsed*o.speed,o);if(p.z<0&&p.x*p.x+p.y*p.y<=1.005)return;
 const x=c+p.x*r,y=c-p.y*r;oc.save();oc.translate(x,y);oc.rotate(-o.roll);oc.shadowColor='#7edbff';oc.shadowBlur=12;oc.fillStyle='#d6f5ff';oc.beginPath();oc.arc(0,0,2.6,0,TAU);oc.fill();oc.shadowBlur=0;oc.fillStyle='#699cb9';oc.strokeStyle='#b6e6ff';oc.lineWidth=.6;for(const dx of [-10,5]){oc.fillRect(dx,-2.5,5,5);oc.strokeRect(dx,-2.5,5,5);}oc.restore();}
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden){previous=0;return;}if(previous&&now-previous<33)return;const dt=previous?Math.min(now-previous,100)/1000:0;previous=now;const still=reduced();if(!still)elapsed+=dt;if(still&&!dirty)return;dirty=false;
 renderer?.draw(.52+elapsed*.035);oc.setTransform(dpr,0,0,dpr,0,0);oc.clearRect(0,0,side,side);orbits.forEach(drawOrbit);
 sc.setTransform(dpr,0,0,dpr,0,0);sc.clearRect(0,0,w,h);for(const p of dust){const x=(p.x*w+elapsed*(.6+p.depth))%w,y=(p.y*h+Math.sin(elapsed*.06+p.phase)*8+h)%h;const a=.18+.42*p.depth+Math.sin(elapsed*.4+p.phase)*.1;sc.fillStyle=`rgba(170,216,250,${a})`;sc.beginPath();sc.arc(x,y,p.r,0,TAU);sc.fill();if(p.depth>.93){sc.shadowColor='#8acfff';sc.shadowBlur=9;sc.fill();sc.shadowBlur=0;}}
 }
 frame=requestAnimationFrame(draw);
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('graphicschange',resize);canvas.removeEventListener('webglcontextlost',onLost);renderer?.dispose();stopFallback();};
}

// Software fallback retains rotation and lighting when WebGL is unavailable.
let earthImages;
function mountFallbackEarth(){
 const canvas=document.querySelector('#menuEarth'),ctx=canvas.getContext('2d'),size=canvas.width,r=size*.38,c=size/2;let disposed=false,frame=0;
 const read=async src=>{const im=await loadImage(src),tmp=document.createElement('canvas');tmp.width=im.width;tmp.height=im.height;const tc=tmp.getContext('2d');tc.drawImage(im,0,0);return {w:im.width,h:im.height,data:tc.getImageData(0,0,im.width,im.height).data};};
 earthImages??=Promise.all([read('./assets/menu-earth-day.jpg'),read('./assets/menu-earth-night.png').catch(()=>null),read('./assets/menu-earth-clouds.png').catch(()=>null)]).catch(e=>{earthImages=null;throw e;});
 earthImages.then(([tex,night,clouds])=>{if(disposed)return;const pixels=[],out=ctx.createImageData(size,size),data=out.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-c)/r,ny=(c-y)/r,d=Math.hypot(nx,ny),i=(y*size+x)*4;
 if(d>1){data[i]=51;data[i+1]=163;data[i+2]=255;data[i+3]=255*(Math.exp(-(d-1)*65)*.65+Math.exp(-(d-1)*18)*.08);continue;}
 const z=Math.sqrt(1-d*d),lit=(nx*.65+ny*.4+z*.8)/1.105,daylight=Math.max(0,Math.min(1,(lit+.16)/.51));pixels.push({i,lon:Math.atan2(nx,z),v:Math.acos(ny)/Math.PI,light:.14+.94*Math.max(0,lit),night:1-daylight*daylight*(3-2*daylight),rim:Math.pow(1-z,4)*(.26+.6*Math.max(0,lit))});data[i+3]=255;}
 let angle=.52,previous=0,first=true;
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden){previous=0;return;}if(previous&&now-previous<80)return;const dt=previous?Math.min(now-previous,120):0;previous=now;
 const still=document.documentElement.classList.contains('reduce-feedback')||matchMedia('(prefers-reduced-motion: reduce)').matches;if(still&&!first)return;first=false;if(!still)angle+=dt*.000035;
 for(const p of pixels){const u=((p.lon+angle)/TAU+.5+1)%1,tx=u*tex.w,ty=p.v*(tex.h-1),x=Math.floor(tx),y=Math.floor(ty),fx=tx-x,fy=ty-y,j=(y*tex.w+x)*4,jx=(y*tex.w+(x+1)%tex.w)*4,jy=(Math.min(y+1,tex.h-1)*tex.w+x)*4,jxy=(Math.min(y+1,tex.h-1)*tex.w+(x+1)%tex.w)*4;
 const n=night?(Math.min(night.h-1,Math.floor(p.v*night.h))*night.w+Math.floor(u*night.w))*4:0;
 const cu=(u+angle*.025)%1,k=clouds?(Math.min(clouds.h-1,Math.floor(p.v*clouds.h))*clouds.w+Math.floor(cu*clouds.w))*4:0,cloud=clouds?clouds.data[k+3]/255*.68:0;
 for(let ch=0;ch<3;ch++){const base=(tex.data[j+ch]*(1-fx)+tex.data[jx+ch]*fx)*(1-fy)+(tex.data[jy+ch]*(1-fx)+tex.data[jxy+ch]*fx)*fy;const ground=base*(1-cloud)+[232,242,255][ch]*cloud;data[p.i+ch]=ground*p.light+(night?night.data[n+ch]*[1.15,.85,.5][ch]*p.night*1.4:0)+[51,163,255][ch]*p.rim;}}
 ctx.putImageData(out,0,0);}
 draw(0);
 }).catch(()=>{});return ()=>{disposed=true;cancelAnimationFrame(frame);};
}
