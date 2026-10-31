// Non-modal windows live outside #app so rendering the globe never destroys them.
export function clampWindowPosition(x,y,width,height,viewportWidth,viewportHeight){
 return {x:Math.max(8,Math.min(x,Math.max(8,viewportWidth-width-8))),y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-Math.min(height,200)-8)))};
}
export function createFloatingWindows(doc=document,win=window){
 const records=new Map(),positions=new Map();let layer=1000;
 const place=r=>{const box=r.el.getBoundingClientRect(),p=clampWindowPosition(r.x,r.y,box.width,box.height,win.innerWidth,win.innerHeight);r.x=p.x;r.y=p.y;r.el.style.left=p.x+'px';r.el.style.top=p.y+'px';r.el.style.maxHeight=Math.max(80,win.innerHeight-p.y-8)+'px';positions.set(r.key,p);};
 const front=r=>{r.el.style.zIndex=String(++layer);};
 function close(key){const r=records.get(key);if(!r)return;r.cleanup?.();r.el.close();r.el.remove();records.delete(key);}
 function open(key,title,{className='',width=520,onClose=null}={}){
  if(records.has(key)){const r=records.get(key);front(r);return r;}
  const el=doc.createElement('dialog'),header=doc.createElement('header'),label=doc.createElement('strong'),closeButton=doc.createElement('button');
  el.className='workspace-window '+className;el.dataset.workspaceWindow=key;el.setAttribute('aria-label',title);el.style.width=width+'px';
  header.className='workspace-titlebar';header.tabIndex=0;header.setAttribute('aria-label','Déplacer la fenêtre '+title+' avec les flèches');label.textContent=title;
  closeButton.type='button';closeButton.className='workspace-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','Fermer '+title);header.append(label,closeButton);el.append(header);doc.body.append(el);
  const saved=positions.get(key),r={key,el,x:saved?.x??Math.max(12,win.innerWidth-width-30-records.size*24),y:saved?.y??110+records.size*28,header};records.set(key,r);
  el.show();place(r);front(r);
  closeButton.addEventListener('click',()=>{close(key);onClose?.();});el.addEventListener('pointerdown',()=>front(r));
  el.addEventListener('cancel',e=>{e.preventDefault();close(key);onClose?.();});
  let drag=null;
  const down=e=>{if(e.button!==0||e.target.closest('button'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.x,top:r.y};header.setPointerCapture(e.pointerId);e.preventDefault();};
  const move=e=>{if(!drag||e.pointerId!==drag.id)return;r.x=drag.left+e.clientX-drag.x;r.y=drag.top+e.clientY-drag.y;place(r);};
  const up=()=>{drag=null;};header.addEventListener('pointerdown',down);header.addEventListener('pointermove',move);header.addEventListener('pointerup',up);header.addEventListener('lostpointercapture',up);
  header.addEventListener('keydown',e=>{if(e.target!==header||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?40:10;r.x+=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;r.y+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;place(r);});
  r.setHTML=html=>{const expanded=new Set([...el.querySelectorAll('details[open]')].map(d=>d.querySelector('summary')?.textContent));const scroll=el.querySelector('.workspace-body')?.scrollTop||0;for(const child of [...el.children])if(child!==header)child.remove();el.insertAdjacentHTML('beforeend',html);for(const d of el.querySelectorAll('details'))if(expanded.has(d.querySelector('summary')?.textContent))d.open=true;const body=el.querySelector('.workspace-body');if(body)body.scrollTop=scroll;place(r);};
  r.close=()=>close(key);return r;
 }
 win.addEventListener('resize',()=>{for(const r of records.values())place(r);});
 return {open,close,get:key=>records.get(key),values:()=>[...records.values()],clear(){for(const key of [...records.keys()])close(key);},setVisible(visible){for(const r of records.values())r.el.hidden=!visible;}};
}
