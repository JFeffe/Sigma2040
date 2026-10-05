// Keep the portrait and native action selector mounted while changing an order.
export function patchOrderDialog(modal,html,agentId){
 if(!modal.open||!modal.classList.contains('order-modal')||modal.dataset.orderAgent!==agentId)return false;
 const oldForm=modal.querySelector('.order-form');if(!oldForm)return false;
 const template=document.createElement('template');template.innerHTML=html;
 const nextForm=template.content.querySelector('.order-form');if(!nextForm)return false;
 const focused=document.activeElement?.id,scroll=modal.scrollTop;
 const oldSelect=oldForm.querySelector('#orderType'),nextSelect=nextForm.querySelector('#orderType');
 if(oldSelect&&nextSelect){const value=nextSelect.value;for(const option of oldSelect.options){const next=[...nextSelect.options].find(o=>o.value===option.value);if(next){option.disabled=next.disabled;option.className=next.className;option.textContent=next.textContent;}}oldSelect.value=value;nextSelect.replaceWith(oldSelect);}
 oldForm.replaceChildren(...nextForm.childNodes);
 if(focused)modal.querySelector('#'+focused)?.focus({preventScroll:true});modal.scrollTop=scroll;
 return true;
}
