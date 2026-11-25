import {setLocalizedHTML,translateText} from './localization.js?v=246';

const tooltipId='report-rich-tooltip';
const tooltipTrigger='[data-rich-tooltip],[data-info-tooltip]';
const sourceSelector='[title],svg title,[data-rich-tooltip]';
const focusControl='a[href],button,input,select,textarea,summary,[tabindex],[role="button"]';
const margin=12;
const gap=10;
let active,tip,pending,showTimer,hideTimer;

function prepare(node){
 if(node.matches('svg title')){
  const owner=node.parentElement,copy=node.textContent.trim();
  if(copy&&!owner.hasAttribute('aria-label')&&!owner.hasAttribute('aria-labelledby')){
   owner.setAttribute('aria-label',translateText(copy));
  }
  owner.setAttribute('data-info-tooltip',copy);
  node.remove();
 }
 // Migrate HTML title hints centrally, including hints added after an interaction.
 if(node.hasAttribute('title')&&!node.matches('iframe,frame')){
  node.setAttribute('data-info-tooltip',node.getAttribute('title').trim());
  node.removeAttribute('title');
 }
 if(node.hasAttribute('data-rich-tooltip')&&!node.closest(focusControl)){
  node.setAttribute('tabindex','0');
 }
}

function discover(root){
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 if(root.matches(sourceSelector))prepare(root);
 root.querySelectorAll(sourceSelector).forEach(prepare);
}

function findTrigger(node){
 const rich=node?.closest?.('[data-rich-tooltip]');
 return rich?.querySelector('template')?rich:node?.closest?.(tooltipTrigger);
}

function updateDescription(mark,visible){
 const ids=new Set((mark.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));
 if(visible)ids.add(tooltipId);
 else ids.delete(tooltipId);
 if(ids.size)mark.setAttribute('aria-describedby',[...ids].join(' '));
 else mark.removeAttribute('aria-describedby');
}

function cancelPending(){
 clearTimeout(showTimer);
 pending=null;
}

function hide(){
 cancelPending();
 clearTimeout(hideTimer);
 if(active)updateDescription(active,false);
 tip?.remove();
 active=null;
 tip=null;
}

function place(mark,pointer){
 const bounds=mark.getBoundingClientRect();
 // The bounding box of a map outline or route can be far from the hovered point.
 const anchor=pointer&&mark.localName==='path'
  ? {left:pointer.x,right:pointer.x,top:pointer.y,bottom:pointer.y}
  : bounds;
 const {width,height}=tip.getBoundingClientRect();
 const maxX=innerWidth-width-margin,maxY=innerHeight-height-margin;
 const positions=[
  [anchor.right+gap,anchor.top],
  [anchor.left-width-gap,anchor.top],
  [anchor.left,anchor.bottom+gap],
  [anchor.left,anchor.top-height-gap],
 ];
 const clamp=(value,max)=>Math.max(margin,Math.min(max,value));
 const chosen=positions.find(([x,y],i)=>i<2?x>=margin&&x<=maxX:y>=margin&&y<=maxY)
  ||positions[2];
 tip.style.left=clamp(chosen[0],maxX)+'px';
 tip.style.top=clamp(chosen[1],maxY)+'px';
}

function show(mark,pointer){
 if(active===mark||!mark?.isConnected||mark.closest('[inert]'))return;
 hide();
 const template=mark.hasAttribute('data-rich-tooltip')&&mark.querySelector('template');
 const copy=mark.getAttribute('data-info-tooltip');
 if(!template&&!copy)return;
 active=mark;
 tip=document.createElement('div');
 tip.id=tooltipId;
 tip.className='report-rich-tooltip';
 tip.setAttribute('role','tooltip');
 if(template){
  tip.dataset.rich='';
  setLocalizedHTML(tip,template.innerHTML);
 }else tip.textContent=translateText(copy);
 // Keep the tooltip available above native dialogs and inside their focus scope.
 const host=mark.closest('dialog[open]')||document.body;
 if(typeof tip.showPopover==='function')tip.popover='manual';
 host.append(tip);
 tip.showPopover?.();
 place(mark,pointer);
 updateDescription(mark,true);
}

function dismissSoon(){
 clearTimeout(hideTimer);
 hideTimer=setTimeout(hide,180);
}

document.addEventListener('pointerover',event=>{
 if(event.pointerType==='touch'||event.buttons)return;
 if(tip?.contains(event.target)){
  clearTimeout(hideTimer);
  return;
 }
 const mark=findTrigger(event.target);
 if(!mark||mark===findTrigger(event.relatedTarget))return;
 clearTimeout(hideTimer);
 cancelPending();
 if(active&&active!==mark)hide();
 if(active===mark)return;
 const pointer={x:event.clientX,y:event.clientY};
 pending=mark;
 showTimer=setTimeout(()=>show(mark,pointer),mark.hasAttribute('data-rich-tooltip')?100:240);
},true);

document.addEventListener('pointerout',event=>{
 if(tip?.contains(event.relatedTarget))return;
 const mark=findTrigger(event.target),next=findTrigger(event.relatedTarget);
 if(mark&&mark===next)return;
 if(mark===pending)cancelPending();
 if(next===active)return;
 if(active?.matches(':focus-visible'))return;
 if(mark===active||tip?.contains(event.target))dismissSoon();
},true);

document.addEventListener('focusin',event=>{
 if(tip?.contains(event.target))return;
 const mark=findTrigger(event.target);
 if(mark)show(mark);
 else hide();
});

document.addEventListener('pointerdown',event=>{
 if(!tip?.contains(event.target))hide();
},true);
document.addEventListener('click',event=>{
 if(!tip?.contains(event.target)&&event.pointerType==='touch')show(findTrigger(event.target));
});

document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&tip){
  hide();
  event.preventDefault();
 }
});
window.addEventListener('resize',hide);
window.addEventListener('blur',hide);
document.addEventListener('scroll',event=>{if(!tip?.contains(event.target))hide();},true);
document.addEventListener('close',hide,true);

discover(document.body);
new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='attributes'){
   if(record.target.hasAttribute('title'))prepare(record.target);
  }else record.addedNodes.forEach(discover);
 }
 if(active&&!active.isConnected)hide();
 if(pending&&!pending.isConnected)cancelPending();
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['title']});
