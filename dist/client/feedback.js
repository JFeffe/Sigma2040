import {playCue} from './experience.js?v=183';
import {COUNTRY,ACTIONS} from './data.js?v=183';
import {esc,portrait} from './ui.js?v=183';
let signals=[];
export function clearSignals(){signals=[];}
export function stageSignal(a){signals=[{country:a.country,agentId:a.id,kind:'order',label:`${a.name} · ordre planifié`,until:Date.now()+6500}];}
export function turnSignals(s,turn){signals=(s.operationReports||[]).filter(r=>r.turn===turn&&COUNTRY[r.country]).map(r=>({country:r.country,agentId:r.agentId,kind:r.status==='RÉUSSITE'?'success':'danger',label:`${r.agent} · ${r.status==='RÉUSSITE'&&['travel','sneak'].includes(r.type)?'Arrivée':r.status==='RÉUSSITE'?ACTIONS[r.type].name:r.status.toLowerCase()}`,until:0}));for(const a of s.agents.filter(a=>a.faction===s.player&&a.task&&!a.task.queued&&['travel','sneak'].includes(a.task.type))){signals.push({country:a.country,agentId:a.id,kind:'order',label:`${a.name} · en route vers ${COUNTRY[a.task.target].city}`,until:0});}}
export function signalSnapshot(){const now=Date.now();signals=signals.filter(s=>!s.until||s.until>now);return signals;}
export function paintSignals(svg){
 if(document.querySelector('#modal')?.open)return;
 const active=signalSnapshot();for(const s of active)if(!s.until)s.until=Date.now()+6500;
 for(const pin of svg.querySelectorAll('.map-pin-v2')){
  const local=active.filter(s=>s.country===pin.dataset.id),existing=pin.querySelector('.map-signal');if(!local.length){existing?.remove();continue;}if(existing)continue;
  const kind=local.some(s=>s.kind==='danger')?'danger':local[0].kind;
  const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class',`map-signal ${kind}`);group.innerHTML=`<title>${esc(local.map(s=>s.label).join(' · '))}</title><circle class="signal-ring" r="13"/><circle class="signal-ring second" r="13"/><circle class="signal-core" r="10"/>`;pin.prepend(group);
  setTimeout(()=>group.remove(),Math.max(...local.map(s=>s.until))-Date.now());
 }
 for(const s of active){
  const card=[...document.querySelectorAll('.agent-card')].find(c=>c.dataset.id===s.agentId);if(card&&!card.classList.contains('feedback-flash')){card.classList.add('feedback-flash');setTimeout(()=>card.classList.remove('feedback-flash'),1300);}
  const route=[...svg.querySelectorAll('.travel-route')].find(r=>r.dataset.agent===s.agentId);if(route&&s.kind==='order'){route.classList.add('route-feedback');setTimeout(()=>route.classList.remove('route-feedback'),3500);}
 }
 const shell=svg.closest('.cartography');let legend=shell.querySelector('.map-feedback-caption');
 if(active.length){if(!legend){legend=document.createElement('div');legend.className='map-feedback-caption';legend.setAttribute('role','status');shell.append(legend);}legend.textContent=active.map(s=>`${COUNTRY[s.country].city} · ${s.label}`).join(' / ');const current=legend;setTimeout(()=>current.remove(),6500);}else legend?.remove();
}
export function orderFeedback(s,id){
 const a=s.agents.find(a=>a.id===id),t=a.task;if(!t)return;playCue();
 const box=document.querySelector('#toast');clearTimeout(orderFeedback.timer);
 box.innerHTML=`<div class="order-feedback"><div><strong>✓ ${esc(a.name)} · ordre confirmé</strong><span>${esc(ACTIONS[t.type].name)} · ${t.total} tour(s) · ${t.cost} crédits${t.bonusCredits?' · renfort inclus':''}</span></div></div>`;box.classList.add('show');orderFeedback.timer=setTimeout(()=>box.classList.remove('show'),3500);
}
