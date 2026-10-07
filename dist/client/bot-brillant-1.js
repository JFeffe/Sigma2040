import {TECH,COUNTRY} from './data.js?v=181';
import {campaignRules} from './campaign-rules.js?v=181';

// A faction proposes multi-turn goals, reserves each chosen goal and assigns
// complementary agents. All opponent evidence comes from public sightings.
export function planBB1Faction(s,id,E){
 const f=s.factions[id],members=E.team(s,id),agents=members.filter(a=>a.status!=='captured');
 if(members.length+s.recruitments.filter(r=>r.faction===id).length<4)E.queueNpcRecruitment(s,id);
 const targets=E.knownTargets(s,id).filter(t=>!t.arrested).map(t=>({id:t.id,cell:t.cell,country:t.country,prepared:!!t.prepared,locationUntil:t.locationUntil,flightUntil:t.flightUntil,intimidated:!!t.intimidated}));
 const threats=E.visiblePlots(s),queue=()=>E.evidenceQueue(s,id),proofs=t=>E.evidenceFor(s,id,t.id);
 const memory=f.bb1?.version===2&&f.bb1.plans&&f.bb1.delayed?f.bb1:{version:2,plans:{},delayed:{}};
 f.bb1=memory;memory.turn=s.turn;memory.decisions=[];
 const claimed=(type,target,country)=>members.some(a=>a.task?.type===type&&(target?a.task.target===target:a.country===country));
 const moving=a=>['travel','sneak'].includes(a.task?.type);
 const at=(a,c)=>moving(a)?a.task.target===c:a.country===c;
 const sighted=c=>new Set(Object.values(f.publicAgents).filter(a=>a.country===c&&(a.until??a.turn+2)>=s.turn).map(a=>a.faction));
 const progress=t=>proofs(t).length+2*Number(proofs(t).some(e=>e.verified))+3*Number(t.prepared);
 const reserved=(except=null)=>agents.filter(a=>a.id!==except&&memory.plans[a.id]?.type==='protect'&&memory.plans[a.id].deadline>=s.turn+1&&!(a.task&&!moving(a))&&at(a,memory.plans[a.id].country)&&!(f.defense[memory.plans[a.id].country]>=memory.plans[a.id].deadline)).reduce((sum,a)=>sum+Math.max(0,(memory.plans[a.id].reserved||0)-(moving(a)?a.task.remaining:0)*E.funding(f).income),0);
 const canActivate=(type,except=null)=>E.getTechSlots(s,id)<2&&f.budget-reserved(except)>=TECH[type].cost&&!f.tech.some(t=>t.type===type&&t.until>=s.turn);
 const activate=type=>{if(!canActivate(type))return false;const player=s.player;s.player=id;try{E.activateTech(s,type,id);return true;}finally{s.player=player;}};
 const projected=(a,c,type,target)=>{
  // A future action uses a hypothetical own agent, not the hidden world state.
  const distance=a.country===c?0:E.options(s,a.id,'travel',c).duration;
  const b={...a,country:c,task:null,fatigue:Math.min(100,a.fatigue+distance*6),weapon:distance?false:a.weapon};
  const view={...s,agents:s.agents.map(x=>x.id===a.id?b:x)};
  return E.options(view,a.id,type,target);
 };
 const caseArrival=(a,t,mode,route)=>{
  // Compare the whole remaining field work, not just arrival odds. The view
  // contains only this agent's projection and the faction's public dossier.
  const b={...a,country:t.country,task:null,cover:mode==='sneak'?'Clandestine':'Légale',weapon:mode==='sneak'&&a.weapon,fatigue:Math.min(100,a.fatigue+route.fatigue*route.duration),exposure:Math.min(100,a.exposure+E.missionExposure(a,mode,true))};
  const stages=[],count=proofs(t).length;let missing=Math.max(0,2-count);
  if(missing&&!t.intimidated){stages.push('intimidate');missing--;}
  for(let i=0;i<missing;i++)stages.push('collect');
  if(!t.prepared)stages.push('prepare');
  // A stale position will need refreshing before the final intervention.
  if(t.locationUntil<s.turn+route.duration+stages.length*2)stages.push('surveil');
  stages.push('arrest');let chance=1,turn=s.turn+route.duration;
  for(const type of stages){
   const view={...s,turn,agents:s.agents.map(x=>x.id===a.id?b:x)},o=E.options(view,a.id,type,t.id);
   chance*=o.chance/100;
   b.fatigue=Math.min(100,b.fatigue+o.fatigue*o.duration);
   b.exposure=Math.min(100,b.exposure+E.missionExposure(b,type,true));
   turn+=o.duration;
  }
  return chance;
 };
 // Evaluate the allocation as a whole: do not strand the only field analyst at HQ.
 let analyst=agents[0],allocation=-Infinity;
 for(const h of agents){
  const field=agents.filter(a=>a.id!==h);let pair=0;
  for(const a of field)for(const b of field.filter(b=>b.id!==a.id))pair=Math.max(pair,a.stats[0]*7+Number(a.talents.includes('tactique'))*10+b.stats[2]*7+Number(b.talents.includes('combat'))*10);
  const value=h.stats[0]*5+Number(h.talents.includes('enquete'))*7+Number(h.talents.includes('informatique'))*5+pair*.65+(h.country===id?4:0);
  if(value>allocation){allocation=value;analyst=h;}
 }
 memory.analyst=analyst?.id;
 const jobs=(a,view=s)=>{
  if(a.task||a.status!=='ready')return [];
  const result=[],add=(type,target,value)=>{const o=E.options(view,a.id,type,target);if(!o.error&&view.turn+o.duration-1<=campaignRules(s).maxTurns)result.push({type,target,value,o});};
  if(a.country===id){for(const e of queue().filter(e=>!E.analysisAgent(s,id,e.id)))add('analyze',e.id,95);}
  for(const t of targets.filter(t=>t.country===a.country)){
   const pp=proofs(t),bonus=t.cell===3?90:0;
   if(t.prepared&&t.locationUntil>=view.turn)add('arrest',t.id,170+bonus);
   if(pp.length>=2&&pp.some(e=>e.verified)){
    if(!t.prepared)add('prepare',t.id,108+bonus);
    if(t.locationUntil<view.turn+Number(!t.prepared))add('surveil',t.id,103+bonus);
   }
   if(pp.length&&!f.authorized[a.country])add('authorize',null,(t.prepared?94:55)+bonus);
   if(pp.length<2){add('intimidate',t.id,78+bonus);add('collect',t.id,86+bonus);add('hack',t.id,89+bonus);}
  }
  for(const p of threats.filter(p=>p.country===a.country&&p.turn>=view.turn+1&&p.turn<=view.turn+4&&f.defense[p.country]<p.turn))add('protect',null,112);
  for(const b of members.filter(b=>b.status==='captured'&&b.country===a.country))add('rescue',b.id,90);
  return result;
 };
 const withAgent=(a,changes,view=s)=>({...view,agents:view.agents.map(b=>b.id===a.id?{...a,...changes}:b)});
 const confidenceCharge=o=>o.cost*.05+Math.max(0,E.funding(f).income-E.funding({...f,confidence:f.confidence-o.cost}).income)*Math.min(3,campaignRules(s).maxTurns-s.turn)*.8;
 // The favors share a cooldown. Compare useful effects now, including the
 // lost income at confidence thresholds, instead of following a fixed order.
 const favors=[],medical=E.governmentOptions(s,'medical',null,id);
 const tired=agents.filter(a=>a.status==='ready'&&a.fatigue>=30);
 const medicalUrgent=tired.some(a=>!a.task&&a.fatigue>=65&&jobs(a).some(j=>['arrest','protect','rescue'].includes(j.type)));
 if(!medical.error&&(tired.length>=2||medicalUrgent)){
  let value=0;
  for(const a of agents.filter(a=>a.status==='ready'&&a.fatigue>=25)){
   const gain=Math.min(medical.energy,a.fatigue),soon=!a.task||a.task.remaining<=1,after=withAgent(a,{fatigue:a.fatigue-gain});
   const improvement=Math.max(0,...jobs(a).map(j=>(E.options(after,a.id,j.type,j.target).chance-j.o.chance)*j.value/100));
   // Use the same recovery value as the agent planner, scaled to the energy
   // it would otherwise recover in a rest turn. Locked missions stay locked.
   value+=gain*(a.country===id?37/50:32/30)*(soon?1:.5)+improvement;
   if(soon&&a.country!==id&&a.fatigue>=65&&a.fatigue-gain<65)value+=8;
  }
  favors.push({type:'medical',country:null,value:value-confidenceCharge(medical)});
 }
 for(const country of new Set(targets.filter(t=>progress(t)>=1).map(t=>t.country))){
  const o=E.governmentOptions(s,'diplomacy',country,id);if(o.error||s.turn<28&&f.confidence-o.cost<10)continue;
  const view={...s,factions:{...s.factions,[id]:{...f,cooperation:{...f.cooperation,[country]:f.cooperation[country]+1}}}};
  let value=0,mandate=0;
  for(const a of agents.filter(a=>a.country===country&&!moving(a))){
   let improvement=0;
   for(const j of jobs(a)){const gain=(E.options(view,a.id,j.type,j.target).chance-j.o.chance)*j.value/100;if(j.type==='authorize')mandate=Math.max(mandate,gain);else improvement=Math.max(improvement,gain);}
   value+=improvement;
  }
  favors.push({type:'diplomacy',country,value:value+mandate-confidenceCharge(o)});
 }
 const funding=E.governmentOptions(s,'funding',null,id);
 if(!funding.error&&(s.turn>=28||f.confidence-funding.cost>=10)){
  let need=reserved(),unlocked=0;
  for(const a of agents){
   let boost=0;
   for(const j of jobs(a)){
    const paid=E.options(s,a.id,j.type,j.target,true),threshold=['arrest','protect','rescue'].includes(j.type)?6:12;
    if(paid.chance-j.o.chance<7)continue;
    need=Math.max(need,reserved(a.id)+threshold);
    if(f.budget<threshold&&f.budget+funding.gain>=threshold)boost=Math.max(boost,(paid.chance-j.o.chance)*j.value/100);
   }
   // Five extra credits can unlock one additional six-credit reinforcement.
   unlocked=Math.max(unlocked,boost);
  }
  if(E.getTechSlots(s,id)<2){
   if(queue().length&&agents.some(a=>!a.task&&a.country===id&&E.options(s,a.id,'analyze',queue()[0].id).chance<90))need=Math.max(need,reserved()+TECH.ai.cost);
   if(agents.some(a=>!a.task&&targets.some(t=>t.country!==a.country&&E.options(s,a.id,'travel',t.country).duration>1)))need=Math.max(need,reserved()+TECH.logistics.cost);
   if(agents.some(a=>jobs(a).some(j=>j.type==='surveil'&&j.o.duration>1)))need=Math.max(need,reserved()+TECH.relay.cost);
  }
  favors.push({type:'funding',country:null,value:Math.min(funding.gain,Math.max(0,need-f.budget))*.9+unlocked-confidenceCharge(funding)});
 }
 favors.sort((a,b)=>b.value-a.value||a.type.localeCompare(b.type));
 if(favors[0]?.value>1){const best=favors[0];E.requestGovernmentFavor(s,best.type,best.country,id);memory.decisions.push({type:'government',target:best.type,country:best.country,utility:best.value,reason:'Choisir l’appui utile à la prochaine opération, avec son coût et le délai partagé.'});}
 const risk=(a,type,target)=>{
  const base=E.options(s,a.id,type,target),paid=E.options(s,a.id,type,target,true);
  // No probability floor. Spend only for a material improvement and a useful job.
  const boost=!paid.error&&f.budget-6>=reserved(a.id)&&paid.chance-base.chance>=7&&(['arrest','protect','rescue'].includes(type)||f.budget>=12);
  return {...(boost?paid:base),paid:boost};
 };
 const go=(a,type,target,reason,goal=null,utility=null,paid=null)=>{
  // Spend the actual logistics cost through the engine; shorten only new orders.
  if(type==='travel'&&E.options(s,a.id,type,target).duration>1&&f.budget-reserved(a.id)>=3)activate('logistics');
  const o=paid===null?risk(a,type,target):{...E.options(s,a.id,type,target,paid),paid};if(o.error)return false;
  E.assign(s,a.id,type,target,o.paid);
  if(goal)memory.plans[a.id]={...goal,started:memory.plans[a.id]?.key===goal.key?memory.plans[a.id].started:s.turn};
  memory.decisions.push({agent:a.id,type,target,reason,chance:o.chance,utility,goal:goal?.key??null});return true;
 };
 // Recovery protects future production. An urgent, viable arrest can precede it.
 for(const a of agents.filter(a=>!a.task)){
  const medic=agents.some(b=>b.country===a.country&&b.talents.includes('secours')&&!['travel','sneak'].includes(b.task?.type));
  if(a.status==='injured'&&!medic){go(a,a.country===id?'heal':'travel',a.country===id?null:id,'Soigner pour préserver les opérations suivantes.');continue;}
  const immediate=targets.some(t=>t.country===a.country&&t.prepared&&t.locationUntil>=s.turn&&!risk(a,'arrest',t.id).error&&(risk(a,'arrest',t.id).chance>=60||s.turn>=campaignRules(s).maxTurns||t.flightUntil===s.turn));
  if(a.fatigue>=65&&!immediate){if(a.country===id)go(a,'rest',null,'Récupération au QG.');else if(E.hasSafehouse(s,id,a.country))go(a,'fieldRest',null,'Récupération partagée au terrain.');else if(!claimed('findSafehouse',null,a.country)&&E.options(s,a.id,'findSafehouse').chance>=45)go(a,'findSafehouse',null,'Préparer une récupération locale.');else go(a,'hide',null,'Réduire fatigue et exposition.');}
  else if(a.exposure>=65&&!immediate&&a.country!==id)go(a,E.hasSafehouse(s,id,a.country)&&a.fatigue>=25?'fieldRest':'hide',null,'Récupérer une capacité d’intervention.');
 }
 // Process receipts with the home specialists before recruiting extra verifiers.
 // Leave one slot and six credits for field missions when buying ahead.
 if(E.getTechSlots(s,id)===0&&f.budget-reserved()>=TECH.ai.cost+6&&canActivate('ai')){
  let benefit=0;const workers=agents.filter(a=>!a.task&&a.country===id).sort((a,b)=>b.stats[0]-a.stats[0]),receipts=queue().filter(e=>!E.analysisAgent(s,id,e.id));
  for(let i=0;workers.length&&i<Math.min(receipts.length,workers.length*TECH.ai.duration);i++)benefit+=Math.min(10,90-E.options(s,workers[i%workers.length].id,'analyze',receipts[i].id).chance)/10;
  if(f.leadResearch.progress===2&&s.turn<campaignRules(s).maxTurns&&s.suspects.some(t=>!t.arrested&&!f.known[t.id]&&t.cell!==3))benefit+=2;
  if(benefit>=2)activate('ai');
 }
 if(E.getTechSlots(s,id)===0&&f.budget-reserved()>=TECH.relay.cost+6&&canActivate('relay')&&targets.some(t=>t.locationUntil>=s.turn&&t.locationUntil<s.turn+2&&proofs(t).length>=2&&proofs(t).some(e=>e.verified)&&!agents.some(a=>!a.task&&a.country===t.country&&!E.options(s,a.id,'arrest',t.id).error)&&agents.some(a=>a.country===t.country&&(!a.task||a.task.remaining===1)&&(!t.prepared||a.task))))activate('relay');
 for(const a of agents.filter(a=>!a.task&&a.country===id).sort((a,b)=>b.stats[0]-a.stats[0])){
  // Prefer the first verified proof of a dossier: it unlocks preparation and
  // the three-distinct-dossiers deduction. Authenticity is never inspected.
  const e=queue().sort((a,b)=>{const priority=e=>{const t=targets.find(t=>proofs(t).some(p=>p.id===e.id));return t?(proofs(t).some(p=>p.verified)?0:10)+(t.cell===3?5:0):0;};return priority(b)-priority(a);}).find(e=>!E.analysisAgent(s,id,e.id));if(!e)break;
  go(a,'analyze',e.id,'Encaisser une preuve avant la clôture possible du dossier.');
 }
 const hold=new Set(),wait=new Set();
 for(const t of targets.filter(t=>t.prepared&&t.locationUntil>s.turn)){
  if(memory.delayed[t.id]!==undefined||sighted(t.country).size||s.turn>=campaignRules(s).maxTurns||s.crisis>=90)continue;
  const closes=t.cell===3||s.suspects.some(x=>x.cell===t.cell&&x.id!==t.id&&x.arrested);
  if(!closes||!threats.some(p=>p.cell===t.cell&&p.turn===s.turn&&f.defense[p.country]>=p.turn))continue;
  const a=agents.filter(a=>!a.task&&a.country===t.country&&!risk(a,'arrest',t.id).error).sort((a,b)=>risk(b,'arrest',t.id).chance-risk(a,'arrest',t.id).chance)[0];
  if(a){hold.add(t.id);wait.add(a.id);memory.delayed[t.id]=s.turn;memory.decisions.push({type:'delay',target:t.id,reason:'Encaisser la protection active avant de fermer la cellule.'});}
 }
 for(let iteration=0;iteration<agents.length;iteration++){
  const choices=[];
  const add=(a,type,target,value,reason,goal=null,expected=null,paid=null)=>{
   if(claimed(type,target,a.country)&&!['travel','sneak','equip','rest','hide','fieldRest'].includes(type))return;
   const o=paid===null?risk(a,type,target):{...E.options(s,a.id,type,target,paid),paid};if(o.error)return;
   if(s.turn+o.duration-1>campaignRules(s).maxTurns)return;
   if(['travel','sneak','collect','hack','prepare','surveil','authorize','influence','contacts','drone','equip','findSafehouse','counter','cyberSupport'].includes(type)&&s.turn+o.duration>campaignRules(s).maxTurns)return;
   const p=o.chance/100,duration=type==='surveil'&&canActivate('relay',a.id)?1:o.duration;
   // Failures lose future actor time as well as the current attempt. A low roll
   // can still win this comparison when the payoff or disappearing window warrants it.
   const failure=['arrest','rescue'].includes(type)?14:['collect','hack','prepare','surveil'].includes(type)?7:4;
   let utility=expected??(value*p/Math.sqrt(duration)-(1-p)*failure-o.fatigue*duration*.12);
   if(goal&&memory.plans[a.id]?.key===goal.key)utility+=6;
   choices.push({a,type,target,utility,reason,goal,paid});
  };
  for(const a of agents.filter(a=>!a.task&&!wait.has(a.id))){
   const home=a.id===analyst?.id;
   if(home&&a.country!==id){add(a,'travel',id,70,'Reconstituer la vérification au QG.');continue;}
   for(const p of threats){
    if(f.defense[p.country]>=p.turn||claimed('protect',null,p.country))continue;
    const distance=a.country===p.country?0:E.options(s,a.id,'travel',p.country).duration,end=s.turn+distance+1;
    if(end>p.turn||p.turn>end+3||distance&&home)continue;
    const rivals=sighted(p.country),defenders=Object.values(s.factions).filter(x=>x.id!==id&&x.defense[p.country]>=p.turn);
    const competition=defenders.length+[...rivals].filter(r=>!defenders.some(x=>x.id===r)).length*.35;
    const future=projected(a,p.country,'protect',null),chance=Math.min(90,future.chance+(f.budget+distance*2>=6&&future.chance<=80?10:0))/100;
    const income=6/(1+competition),value=52+income*10;
    const goal={key:'protect:'+p.id,country:p.country,deadline:p.turn,type:'protect',reserved:future.chance<70?6:0};
    if(distance){
     if(agents.some(b=>b.id!==a.id&&moving(b)&&b.task.target===p.country))continue;
     const expected=value*chance/(distance+1.6)-(1-chance)*5-(p.turn-end)*1.5;
     add(a,'travel',p.country,0,'Rejoindre une protection : chances à l’arrivée et financement inclus.',goal,expected);
    }else add(a,'protect',null,value,'Encaisser sa part de protection avant l’échéance.',goal);
   }
   if(home){
    const field=targets.filter(t=>agents.some(b=>b.id!==a.id&&at(b,t.country))&&(f.cyberSupport[t.country]?.until||0)<s.turn+2).sort((a,b)=>progress(b)-progress(a))[0];
    if(field)add(a,'cyberSupport',field.country,65,'Soutenir les opérations à venir dans le pays du groupe.');
    if(targets.length<4&&s.suspects.some(t=>!t.arrested&&!f.known[t.id]))add(a,'counter',null,55,'Trouver un dossier disponible et observer la concurrence.');
    if(a.fatigue>=25)add(a,'rest',null,37,'Récupérer pendant un creux dans la file de preuves.');
    continue;
   }
   for(const victim of members.filter(b=>b.status==='captured')){
    if(victim.country===a.country)add(a,'rescue',victim.id,90,'Récupérer un agent encore utile.');
    else {const distance=E.options(s,a.id,'travel',victim.country).duration;if(s.turn+distance+1<=campaignRules(s).maxTurns&&!agents.some(b=>b.id!==a.id&&at(b,victim.country)))add(a,'travel',victim.country,0,'Rejoindre un coéquipier détenu pour préparer son extraction.',{key:'rescue:'+victim.id,type:'rescue',country:victim.country},90*projected(a,victim.country,'rescue',victim.id).chance/100/(distance+1.5));}
   }
   if(a.country!==id&&!a.weapon){
    const o=E.options(s,a.id,'equip'),after=withAgent(a,{weapon:true,fatigue:Math.min(100,a.fatigue+o.fatigue*o.duration),exposure:Math.min(100,a.exposure+E.missionExposure(a,'equip',true))});
    let benefit=0;
    for(const t of targets.filter(t=>t.country===a.country&&(!t.prepared||t.locationUntil>=s.turn+1))){
     const base=E.options(s,a.id,'arrest',t.id,f.budget>=6),armed=E.options(after,a.id,'arrest',t.id,f.budget>=6),readiness=t.prepared?1:proofs(t).length>=2?.8:proofs(t).length?.5:.25;
     benefit+=Math.max(0,armed.chance-base.chance)*(184+(t.cell===3?90:0))/100*readiness;
    }
    const expected=benefit*o.chance/100-(1-o.chance/100)*4-o.fatigue*.12;
    if(expected>0)add(a,'equip',null,0,'Profiter d’un créneau pour améliorer les interventions futures avec une arme.',null,expected,false);
   }
   for(const t of targets){
    if(claimed('arrest',t.id))continue;
    const pp=proofs(t),count=pp.length,verified=pp.some(e=>e.verified),local=t.country===a.country;
    const goal={key:'case:'+t.id,country:t.country,type:'case'},closing=t.cell===3||s.suspects.some(x=>x.cell===t.cell&&x.id!==t.id&&x.arrested);
    // The Architect is a publicly identified unique closing opportunity.
    // Empirically calibrated priority, not an invented reward or a hidden hint.
    const bonus=(t.cell===3?90:0)+(closing?8:0)+(t.flightUntil===s.turn?15:0);
    if(!local){
     const colleagues=agents.filter(b=>b.id!==a.id&&b.id!==analyst?.id&&at(b,t.country));if(colleagues.length>=2)continue;
     const passport=E.options(s,a.id,'travel',t.country),distance=passport.duration;
     const type=t.prepared?'arrest':count>=2&&verified?'prepare':!t.intimidated?'intimidate':f.access[t.country]?'collect':'influence';
     const chance=projected(a,t.country,type,t.id).chance/100;
     // Only send a second agent when it adds a needed, complementary competence.
     const need=colleagues.length?Math.max(0,a.stats[0]-colleagues[0].stats[0],a.stats[2]-colleagues[0].stats[2])*3:9;
     const value=(30+progress(t)*5+bonus+need)*chance/(distance+.5),competition=sighted(t.country).size*2;
     add(a,'travel',t.country,0,'Avancer un dossier avec une compétence utile à la prochaine étape.',goal,value-competition);
     // Logistics can make the guaranteed route faster; sneak never receives it.
     const fast=distance>1&&E.getTechSlots(s,id)<2&&f.budget-reserved(a.id)>=TECH.logistics.cost;
     const arrival={...passport,duration:fast?distance-1:distance},legal=caseArrival(a,t,'travel',arrival);
     for(const paid of [false,true]){
      const route=E.options(s,a.id,'sneak',t.country,paid);if(route.error||paid&&(f.budget-6<reserved(a.id)||route.boostGain<7))continue;
      const p=route.chance/100,continuation=caseArrival(a,t,'sneak',route)/legal;
      const extraEnergy=Math.max(0,route.fatigue*route.duration-arrival.fatigue*arrival.duration);
      const expected=value*continuation*p*(arrival.duration+.5)/(route.duration+.5)-competition-(1-p)*14-extraEnergy*.12-route.cost*.5;
      add(a,'sneak',t.country,0,'Comparer arme conservée et discrétion au risque, à la fatigue et au coût du passage.',goal,expected,paid);
     }
     continue;
    }
    const pending=members.filter(b=>b.task?.target===t.id&&['intimidate','collect','hack'].includes(b.task.type)).length;
    if(count+pending<2){
     if(!t.intimidated&&a.exposure<50)add(a,'intimidate',t.id,78+bonus,'Preuve et position rapides ; risque comparé aux autres voies.',goal);
     if(!f.access[a.country]){add(a,'influence',null,64+bonus,'Ouvrir la collecte et améliorer les conditions locales.',goal);add(a,'contacts',null,62+bonus,'Ouvrir les preuves par un contact.',goal);add(a,'drone',t.id,61+bonus,'Reconnaître le pays et ouvrir la collecte.',goal);}
     else {add(a,'collect',t.id,86+bonus,'Recueillir les preuves nécessaires au plan.',goal);add(a,'hack',t.id,89+bonus,'Recueillir une preuve et soutenir les opérations locales.',goal);}
    }
    if(count>=2&&verified){
     if(!t.prepared)add(a,'prepare',t.id,108+bonus,'Préparer l’intervention avec le spécialiste disponible.',goal);
     if((t.prepared||claimed('prepare',t.id))&&t.locationUntil<s.turn+Number(!t.prepared)&&!claimed('drone',t.id)){add(a,'surveil',t.id,103+bonus,'Localiser pour conclure le dossier.',goal);add(a,'drone',t.id,98+bonus,'Localiser par drone avant l’intervention.',goal);}
     if(t.prepared&&!hold.has(t.id))add(a,'arrest',t.id,170+bonus,'Tenter l’intervention : gain et risque de perdre la fenêtre.',goal);
    }
    if(count>=1&&!f.authorized[a.country])add(a,'authorize',null,(t.prepared?94:55)+bonus,'Améliorer les chances de l’arrestation planifiée.',goal);
    if(count>=1&&f.cooperation[a.country]<3)add(a,'influence',null,42+bonus,'Améliorer l’accès aux étapes du dossier.',goal);
   }
   if(a.country!==id&&a.fatigue>=25&&E.hasSafehouse(s,id,a.country))add(a,'fieldRest',null,32,'Récupérer avant les étapes suivantes.');
   if(a.country!==id&&a.fatigue>=30&&!E.hasSafehouse(s,id,a.country))add(a,'findSafehouse',null,40,'Installer un repos partagé.');
   if(a.country!==id&&a.exposure>=35)add(a,'hide',null,30,'Préserver les chances des prochaines interventions.');
   if(a.country===id&&a.fatigue>=25)add(a,'rest',null,30,'Récupérer au QG.');
  }
  choices.sort((a,b)=>b.utility-a.utility||a.a.id.localeCompare(b.a.id));const best=choices[0];if(!best)break;
  if(best.type==='surveil'&&E.options(s,best.a.id,'surveil',best.target).duration>1)activate('relay');
  go(best.a,best.type,best.target,best.reason,best.goal,best.utility,best.paid);
 }
 for(const a of agents.filter(a=>!a.task&&!wait.has(a.id))){if(a.country===id&&a.fatigue>0)go(a,'rest',null,'Récupérer sans occasion immédiate.');else if(a.country!==id&&(a.fatigue||a.exposure))go(a,E.hasSafehouse(s,id,a.country)?'fieldRest':'hide',null,'Préserver les ressources avant la prochaine occasion.');}
}
