import {localizeContent} from './localization.js?v=243';
// Keep the action picker, briefing and reading position while refreshing the forecast.
export function patchOrderDialog(modal,html,agentId){
 if(!modal.open||!modal.classList.contains('order-modal')||modal.dataset.orderAgent!==agentId)return false;
 const oldForm=modal.querySelector('.order-form');if(!oldForm)return false;
 const template=document.createElement('template');template.innerHTML=html;
 const nextForm=template.content.querySelector('.order-form');if(!nextForm)return false;
 localizeContent(nextForm);
 const focused=modal.contains(document.activeElement)?document.activeElement.id:null;
 const scroll=oldForm.querySelector('.express-order-body')?.scrollTop||0;
 const oldDetails=oldForm.querySelector('#orderDetails'),nextDetails=nextForm.querySelector('#orderDetails');
 if(oldDetails&&nextDetails)nextDetails.open=oldDetails.open;
 const oldSelect=oldForm.querySelector('#orderType'),nextSelect=nextForm.querySelector('#orderType');
 if(oldSelect&&nextSelect){
  const current=[...oldSelect.options],next=[...nextSelect.options];
  if(current.length===next.length&&current.every((option,i)=>option.value===next[i].value)){
   current.forEach((option,i)=>{
    option.disabled=next[i].disabled;
    option.className=next[i].className;
    option.textContent=next[i].textContent;
   });
   oldSelect.value=nextSelect.value;
   nextSelect.replaceWith(oldSelect);
  }
 }
 oldForm.replaceChildren(...nextForm.childNodes);
 const body=oldForm.querySelector('.express-order-body');
 if(body)body.scrollTop=scroll;
 if(focused)modal.querySelector('#'+focused)?.focus({preventScroll:true});
 return true;
}
