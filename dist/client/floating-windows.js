import {localizeContent,translateText} from './localization.js?v=245';
import {readPreference,writePreference} from './browser-preferences.js?v=245';
// Non-modal windows live outside #app so rendering the globe never destroys them.
export function clampWindowPosition(x,y,width,height,viewportWidth,viewportHeight){
 return {x:Math.max(8,Math.min(x,Math.max(8,viewportWidth-width-8))),y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-height-8)))};
}
// Resize from any edge while keeping the opposite edge fixed and the window visible.
export function resizeWindowRect(rect,edge,dx,dy,vw,vh){
 const minW=Math.min(300,vw-16),minH=Math.min(180,vh-16),limit=(v,a,b)=>Math.max(a,Math.min(v,b));
 let left=rect.x,top=rect.y,right=left+rect.width,bottom=top+rect.height;
 if(edge.includes('w'))left=limit(left+dx,8,right-minW);
 if(edge.includes('e'))right=limit(right+dx,left+minW,vw-8);
 if(edge.includes('n'))top=limit(top+dy,8,bottom-minH);
 if(edge.includes('s'))bottom=limit(bottom+dy,top+minH,vh-8);
 return {x:left,y:top,width:right-left,height:bottom-top};
}
export function createFloatingWindows(doc=document,win=window){
 const records=new Map();let layer=1000;
 let savedLayouts={};try{savedLayouts=JSON.parse(readPreference('shadow-mandate-window-layouts-v210','{}'))||{};}catch{}
 const valid=p=>p&&['x','y','width'].every(k=>Number.isFinite(p[k]))&&p.width>=200;
 const remember=r=>{
  const p={x:r.x,y:r.y,width:r.width,autoHeight:true};
  savedLayouts[r.key]=p;savedLayouts[r.key.split(':')[0]]=p;
  writePreference('shadow-mandate-window-layouts-v210',JSON.stringify(savedLayouts));
 };
 function keepInView(r,bottom){
  if(r.el.hidden)return;
  const {width,height}=r.el.getBoundingClientRect();
  const p=clampWindowPosition(r.x,bottom===undefined?r.y:bottom-height,width,height,win.innerWidth,win.innerHeight);
  r.x=p.x;r.y=p.y;r.el.style.left=p.x+'px';r.el.style.top=p.y+'px';
 }
 function place(r,bottom){
  if(r.el.hidden)return;
  r.el.style.width=Math.min(r.width,win.innerWidth-16)+'px';
  r.el.style.maxHeight=r.heightLimit===null?'':Math.min(r.heightLimit,win.innerHeight-16)+'px';
  keepInView(r,bottom);
 }
 const resizeObserver=new win.ResizeObserver(entries=>{
  for(const {target} of entries){
   const r=records.get(target.dataset.workspaceWindow);
   if(r)keepInView(r);
  }
 });
 const front=r=>{r.el.style.zIndex=String(++layer);};
 function close(key){const r=records.get(key);if(!r)return;remember(r);resizeObserver.unobserve(r.el);r.cleanup?.();r.el.close();r.el.remove();records.delete(key);}
 function open(key,title,{className='',width=440,previousWidth=null,onClose=null}={}){
  if(records.has(key)){const r=records.get(key);front(r);return r;}
  const el=doc.createElement('dialog'),header=doc.createElement('header'),label=doc.createElement('strong'),closeButton=doc.createElement('button');
  el.className='workspace-window '+className;el.dataset.workspaceWindow=key;el.style.width=width+'px';
  header.className='workspace-titlebar';header.tabIndex=0;
  closeButton.type='button';closeButton.className='workspace-close';closeButton.textContent='×';header.append(label,closeButton);el.append(header);doc.body.append(el);
  const updateLabels=()=>{
   el.setAttribute('aria-label',translateText(title));
   label.textContent=translateText(title);
   header.setAttribute('aria-label',translateText('Déplacer la fenêtre '+title+' avec les flèches'));
   closeButton.setAttribute('aria-label',translateText('Fermer '+title));
  };
  updateLabels();
  const candidate=savedLayouts[key]||savedLayouts[key.split(':')[0]];
  const saved=valid(candidate)?candidate:null;
  const defaultWidth=saved?.width===previousWidth?width:saved?.width??width;
  const r={key,el,header,width:defaultWidth,heightLimit:null,
   x:saved?.x??Math.max(12,win.innerWidth-defaultWidth-30-records.size*24),y:saved?.y??110+records.size*28};
  records.set(key,r);
  el.show();place(r);front(r);resizeObserver.observe(el);
  closeButton.addEventListener('click',()=>{close(key);onClose?.();});el.addEventListener('pointerdown',()=>front(r));
  el.addEventListener('cancel',e=>{e.preventDefault();close(key);onClose?.();});
  let drag=null;
  const down=e=>{if(e.button!==0||e.target.closest('button'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.x,top:r.y};header.setPointerCapture(e.pointerId);e.preventDefault();};
  const move=e=>{if(!drag||e.pointerId!==drag.id)return;r.x=drag.left+e.clientX-drag.x;r.y=drag.top+e.clientY-drag.y;place(r);};
  const up=()=>{if(drag)remember(r);drag=null;};header.addEventListener('pointerdown',down);header.addEventListener('pointermove',move);header.addEventListener('pointerup',up);header.addEventListener('lostpointercapture',up);
  header.addEventListener('keydown',e=>{if(e.target!==header||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?40:10;r.x+=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;r.y+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;place(r);remember(r);});
  for(const edge of ['n','s','e','w','ne','nw','se','sw']){
   const handle=doc.createElement('div');handle.className='workspace-resize workspace-resize-'+edge;handle.dataset.resizeEdge=edge;handle.setAttribute('aria-hidden','true');el.append(handle);let sizing=null;
   handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const box=el.getBoundingClientRect();sizing={id:e.pointerId,x:e.clientX,y:e.clientY,rect:{x:r.x,y:r.y,width:box.width,height:box.height}};handle.setPointerCapture(e.pointerId);front(r);e.preventDefault();e.stopPropagation();});
   handle.addEventListener('pointermove',e=>{
    if(!sizing||sizing.id!==e.pointerId)return;
    const {rect,x,y}=sizing,next=resizeWindowRect(rect,edge,e.clientX-x,e.clientY-y,win.innerWidth,win.innerHeight);
    r.x=next.x;r.y=next.y;r.width=next.width;
    r.heightLimit=edge.includes('n')||edge.includes('s')?next.height:null;
    place(r,edge.includes('n')?rect.y+rect.height:undefined);
   });
   const stop=()=>{if(sizing)remember(r);sizing=null;};handle.addEventListener('pointerup',stop);handle.addEventListener('lostpointercapture',stop);
  }
  el.addEventListener('toggle',event=>{
   if(event.target.tagName!=='DETAILS')return;
   r.heightLimit=null;place(r);
  },true);
  const summaryLabels=new WeakMap();
  r.setHTML=html=>{
   const expanded=new Set([...el.querySelectorAll('details[open]')].map(d=>summaryLabels.get(d)));
   const scroll=el.querySelector('.workspace-body')?.scrollTop||0;
   for(const child of [...el.children])if(child!==header&&!child.dataset.resizeEdge)child.remove();
   el.insertAdjacentHTML('beforeend',html);
   for(const details of el.querySelectorAll('details')){
    const source=details.querySelector('summary')?.textContent;
    summaryLabels.set(details,source);
    if(expanded.has(source))details.open=true;
   }
   for(const child of el.children)if(child!==header&&!child.dataset.resizeEdge)localizeContent(child);
   updateLabels();
   r.heightLimit=null;
   place(r);
   const body=el.querySelector('.workspace-body');if(body)body.scrollTop=scroll;
  };
  r.close=()=>close(key);return r;
 }
 win.addEventListener('resize',()=>{for(const r of records.values()){r.heightLimit=null;place(r);}});
 return {open,close,get:key=>records.get(key),values:()=>[...records.values()],clear(){for(const key of [...records.keys()])close(key);},setVisible(visible){for(const r of records.values()){r.el.hidden=!visible;if(visible)place(r);}}};
}
