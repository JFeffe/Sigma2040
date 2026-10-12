import {options} from './engine.js?v=192';
export function selectOrderTarget(s,agentId,type,candidates,current){
 const list=candidates.map(([id,label])=>[id,label,options(s,agentId,type,id).error||'']);
 const target=list.find(([id,,reason])=>id===current&&!reason)?.[0]??list.find(([, ,reason])=>!reason)?.[0]??list[0]?.[0]??null;
 return {list,target};
}
