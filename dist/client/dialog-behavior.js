// Dismiss only a complete press/release on the backdrop, never a text-selection drag.
export function bindBackdropDismiss(dialog,dismiss){
 let startedOutside=false;
 const outside=e=>{const r=dialog.getBoundingClientRect();return e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);};
 dialog.addEventListener('pointerdown',e=>{startedOutside=e.button===0&&outside(e);});
 dialog.addEventListener('pointercancel',()=>{startedOutside=false;});
 dialog.addEventListener('close',()=>{startedOutside=false;});
 dialog.addEventListener('click',e=>{const close=startedOutside&&outside(e);startedOutside=false;if(close)dismiss();});
}
