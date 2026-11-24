import {gameLanguage,translateText} from './localization.js?v=244';

let confirmationPending=false;
export async function confirmInGame(message){
 if(confirmationPending)return false;
 const text=translateText(message),desktop=globalThis.shadowMandatePC;
 if(!desktop?.confirm)return globalThis.confirm(text);
 confirmationPending=true;
 try{return await desktop.confirm(text,gameLanguage());}
 finally{confirmationPending=false;}
}

// Dismiss only a complete press/release on the backdrop, never a text-selection drag.
export function bindBackdropDismiss(dialog,dismiss){
 let startedOutside=false;
 const outside=e=>{const r=dialog.getBoundingClientRect();return e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);};
 dialog.addEventListener('pointerdown',e=>{startedOutside=e.button===0&&outside(e);});
 dialog.addEventListener('pointercancel',()=>{startedOutside=false;});
 dialog.addEventListener('close',()=>{startedOutside=false;});
 dialog.addEventListener('click',e=>{const close=startedOutside&&outside(e);startedOutside=false;if(close)dismiss();});
}
