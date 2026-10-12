import {evidenceQueue} from './engine.js?v=192';
export function inquiryIndicator(state,unread=0){
 const count=evidenceQueue(state,state.player).length,newCount=Number(unread)||0;
 return count||newCount?{badge:String(newCount||count),label:[newCount?`${newCount} nouveau(x) dossier(s)`:'',count?`${count} preuve(s) à vérifier`:''].filter(Boolean).join(' · '),tone:'inquiry'}:null;
}
// Notification reads belong to the local player, never to multiplayer orders.
export function createInquiryTracker(storage){
 const sessions=new Map();
 function entry(state,room='solo'){
  const key=`sigma-inquiry-read:${room}:${state.seed}:${state.player}`;
  if(!sessions.has(key)){
   let saved;try{saved=JSON.parse(storage?.getItem(key)||'null');}catch{}
   sessions.set(key,{seen:Array.isArray(saved)?saved:Array.isArray(saved?.seen)?saved.seen:[],reads:saved?.reads||{}});
  }
  return {key,data:sessions.get(key)};
 }
 const count=(state,room)=>{const {data}=entry(state,room);return Object.keys(state.factions[state.player].known).filter(id=>!data.seen.includes(id)).length;};
 return {
  count,unread:(state,room)=>count(state,room)>0,
  dismissed(state,room){const {data}=entry(state,room);return Object.fromEntries(Object.entries(data.reads).map(([tab,turn])=>[tab,turn===state.turn]));},
  read(state,room,tab='inquiry'){const {key,data}=entry(state,room);if(tab==='inquiry')data.seen=Object.keys(state.factions[state.player].known);data.reads[tab]=state.turn;try{storage?.setItem(key,JSON.stringify(data));}catch{}}
 };
}
