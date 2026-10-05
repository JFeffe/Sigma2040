let active=null,tip=null,timer=null;
function hide(){clearTimeout(timer);active?.removeAttribute('aria-describedby');tip?.remove();tip=null;active=null;}
function show(mark){if(active===mark)return;hide();const template=mark.querySelector('template');if(!template)return;active=mark;tip=document.createElement('div');tip.id='report-rich-tooltip';tip.className='report-rich-tooltip';tip.setAttribute('role','tooltip');tip.innerHTML=template.innerHTML;document.body.append(tip);mark.setAttribute('aria-describedby',tip.id);const r=mark.getBoundingClientRect(),box=tip.getBoundingClientRect();tip.style.left=Math.max(12,Math.min(innerWidth-box.width-12,r.right+16+box.width<=innerWidth-12?r.right+16:r.left-box.width-16))+'px';tip.style.top=Math.max(12,Math.min(innerHeight-box.height-12,r.top))+'px';tip.addEventListener('pointerenter',()=>clearTimeout(timer));tip.addEventListener('pointerleave',()=>timer=setTimeout(hide,150));}
document.addEventListener('pointerover',e=>{const mark=e.target.closest('[data-rich-tooltip]');if(mark){clearTimeout(timer);show(mark);}});
document.addEventListener('pointerout',e=>{if(e.target.closest('[data-rich-tooltip]')&&!e.relatedTarget?.closest?.('[data-rich-tooltip],.report-rich-tooltip'))timer=setTimeout(hide,150);});
document.addEventListener('focusin',e=>{const mark=e.target.closest('[data-rich-tooltip]');if(mark)show(mark);else if(!e.target.closest('.report-rich-tooltip'))hide();});
document.addEventListener('click',e=>{const mark=e.target.closest('[data-rich-tooltip]');if(mark)show(mark);else if(!e.target.closest('.report-rich-tooltip'))hide();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
window.addEventListener('resize',hide);document.addEventListener('scroll',e=>{if(!tip?.contains(e.target))hide();},true);
new MutationObserver(()=>{if(active&&!active.isConnected)hide();}).observe(document.getElementById('app'),{childList:true,subtree:true});
