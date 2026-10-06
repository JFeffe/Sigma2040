// Keep the clicked portrait in place until a single click is distinguished
// from a double click; centering on the first click would move the second hit.
export function createMapAgentActivation(select,open,{delay=400,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 let pending=null;
 function cancel(){if(pending)clearTimer(pending.timer);pending=null;}
 function click(id){
  const time=now();
  if(pending?.id===id&&time-pending.time<delay){cancel();select(id);open(id);return;}
  cancel();const next={id,time,timer:null};pending=next;
  next.timer=setTimer(()=>{if(pending!==next)return;pending=null;select(id);},delay);
 }
 return {click,cancel};
}
