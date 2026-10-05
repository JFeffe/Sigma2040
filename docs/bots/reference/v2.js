import {TECH,COUNTRY} from './data.js?v=173';
import {campaignRules} from './campaign-rules.js?v=173';

// A faction proposes multi-turn goals, reserves each chosen goal and assigns
// complementary agents. All opponent evidence comes from public sightings.
export function planNormalFaction(s,id,E){
 const f=s.factions[id],members=E.team(s,id),agents=members.filter(a=>a.status!=='captured');
 if(members.length+s.recruitments.filter(r=>r.faction===id).length<4)s.recruitments.push({id:`${id}-R${s.nextAgent++}`,remaining:2,faction:id});
 const targets=E.knownTargets(s,id).filter(t=>!t.arrested).map(t=>({id:t.id,cell:t.cell,country:t.country,prepared:!!t.prepared,locationUntil:t.locationUntil,flightUntil:t.flightUntil,intimidated:!!t.intimidated}));
 const threats=E.visiblePlots(s),queue=()=>E.evidenceQueue(s,id),proofs=t=>E.evidenceFor(s,id,t.id);
 const memory=f.normalBot?.version===2&&f.normalBot.plans&&f.normalBot.delayed?f.normalBot:{version:2,plans:{},delayed:{}};
 f.normalBot=memory;memory.turn=s.turn;memory.decisions=[];
 const claimed=(type,target,country)=>members.some(a=>a.task?.type===type&&(target?a.task.target===target:a.country===country));
 const at=(a,c)=>a.task?.type==='travel'?a.task.target===c:a.country===c;
 const sighted=c=>new Set(Object.values(f.publicAgents).filter(a=>a.country===c&&(a.until??a.turn+2)>=s.turn).map(a=>a.faction));
 const progress=t=>proofs(t).length+2*Number(proofs(t).some(e=>e.verified))+3*Number(t.prepared);
 const reserved=(except=null)=>agents.filter(a=>a.id!==except&&memory.plans[a.id]?.type==='protect'&&memory.plans[a.id].deadline>=s.turn+1&&!(a.task&&a.task.type!=='travel')&&at(a,memory.plans[a.id].country)&&!(f.defense[memory.plans[a.id].country]>=memory.plans[a.id].deadline)).reduce((sum,a)=>sum+Math.max(0,(memory.plans[a.id].reserved||0)-(a.task?.type==='travel'?a.task.remaining:0)*E.funding(f).income),0);
 const activate=type=>{if(E.getTechSlots(s,id)>=2||f.budget-reserved()<TECH[type].cost||f.tech.some(t=>t.type===type&&t.until>=s.turn))return false;const player=s.player;s.player=id;try{E.activateTech(s,type,id);return true;}finally{s.player=player;}};
 const projected=(a,c,type,target)=>{
  // A future action uses a hypothetical own agent, not the hidden world state.
  const distance=a.country===c?0:E.options(s,a.id,'travel',c).duration;
  const b={...a,country:c,task:null,fatigue:Math.min(100,a.fatigue+distance*6),weapon:distance?false:a.weapon};
  const view={...s,agents:s.agents.map(x=>x.id===a.id?b:x)};
  return E.options(view,a.id,type,target);
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
 const tired=agents.filter(a=>a.fatigue>=30);
 if(tired.length>=2&&!E.governmentOptions(s,'medical',null,id).error)E.requestGovernmentFavor(s,'medical',null,id);
 else if(f.budget<=7&&f.confidence>=30&&!E.governmentOptions(s,'funding',null,id).error)E.requestGovernmentFavor(s,'funding',null,id);
 const risk=(a,type,target)=>{
  const base=E.options(s,a.id,type,target),paid=E.options(s,a.id,type,target,true);
  // No probability floor. Spend only for a material improvement and a useful job.
  const boost=!paid.error&&f.budget-6>=reserved(a.id)&&paid.chance-base.chance>=7&&(['arrest','protect','rescue'].includes(type)||f.budget>=12);
  return {...(boost?paid:base),paid:boost};
 };
 const go=(a,type,target,reason,goal=null,utility=null)=>{
  const o=risk(a,type,target);if(o.error)return false;
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
 for(const a of agents.filter(a=>!a.task&&a.country===id).sort((a,b)=>b.stats[0]-a.stats[0])){
  const e=queue().find(e=>!E.analysisAgent(s,id,e.id));if(!e)break;
  if(E.options(s,a.id,'analyze',e.id).chance<80&&E.getTechSlots(s,id)===0&&f.budget>=8)activate('ai');
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
  const add=(a,type,target,value,reason,goal=null,expected=null)=>{
   if(claimed(type,target,a.country)&&!['travel','rest','hide','fieldRest'].includes(type))return;
   const o=risk(a,type,target);if(o.error)return;
   if(s.turn+o.duration-1>campaignRules(s).maxTurns)return;
   if(['travel','collect','hack','prepare','surveil','authorize','influence','contacts','drone','equip','findSafehouse','counter','cyberSupport'].includes(type)&&s.turn+o.duration>campaignRules(s).maxTurns)return;
   const p=o.chance/100,duration=type==='surveil'&&f.budget>=3&&E.getTechSlots(s,id)<2?1:o.duration;
   // Failures lose future actor time as well as the current attempt. A low roll
   // can still win this comparison when the payoff or disappearing window warrants it.
   const failure=['arrest','rescue'].includes(type)?14:['collect','hack','prepare','surveil'].includes(type)?7:4;
   let utility=expected??(value*p/Math.sqrt(duration)-(1-p)*failure-o.fatigue*duration*.12);
   if(goal&&memory.plans[a.id]?.key===goal.key)utility+=6;
   choices.push({a,type,target,utility,reason,goal});
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
     if(agents.some(b=>b.id!==a.id&&b.task?.type==='travel'&&b.task.target===p.country))continue;
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
   for(const victim of members.filter(b=>b.status==='captured'&&b.country===a.country))add(a,'rescue',victim.id,90,'Récupérer un agent encore utile.');
   for(const t of targets){
    if(claimed('arrest',t.id))continue;
    const pp=proofs(t),count=pp.length,verified=pp.some(e=>e.verified),local=t.country===a.country;
    const goal={key:'case:'+t.id,country:t.country,type:'case'},closing=t.cell===3||s.suspects.some(x=>x.cell===t.cell&&x.id!==t.id&&x.arrested);
    const bonus=(closing?8:0)+(t.flightUntil===s.turn?15:0);
    if(!local){
     const colleagues=agents.filter(b=>b.id!==a.id&&b.id!==analyst?.id&&at(b,t.country));if(colleagues.length>=2)continue;
     const distance=E.options(s,a.id,'travel',t.country).duration;
     const type=t.prepared?'arrest':count>=2&&verified?'prepare':!t.intimidated?'intimidate':f.access[t.country]?'collect':'influence';
     const chance=projected(a,t.country,type,t.id).chance/100;
     // Only send a second agent when it adds a needed, complementary competence.
     const need=colleagues.length?Math.max(0,a.stats[0]-colleagues[0].stats[0],a.stats[2]-colleagues[0].stats[2])*3:9;
     add(a,'travel',t.country,0,'Avancer un dossier avec une compétence utile à la prochaine étape.',goal,(30+progress(t)*5+bonus+need)*chance/(distance+1)-sighted(t.country).size*2);
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
     if((t.prepared||claimed('prepare',t.id))&&t.locationUntil<s.turn&&!claimed('drone',t.id)){add(a,'surveil',t.id,103+bonus,'Localiser pour conclure le dossier.',goal);add(a,'drone',t.id,98+bonus,'Localiser par drone avant l’intervention.',goal);}
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
  go(best.a,best.type,best.target,best.reason,best.goal,best.utility);
 }
 for(const a of agents.filter(a=>!a.task&&!wait.has(a.id))){if(a.country===id&&a.fatigue>0)go(a,'rest',null,'Récupérer sans occasion immédiate.');else if(a.country!==id&&(a.fatigue||a.exposure))go(a,E.hasSafehouse(s,id,a.country)?'fieldRest':'hide',null,'Préserver les ressources avant la prochaine occasion.');}
}
