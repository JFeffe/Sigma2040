import {campaignRules} from './campaign-rules.js?v=228';
import {rescueTargets} from './cell-variants.js?v=228';
// Estimate only visible, useful field work within a short horizon. No hidden targets.
export function weaponOpportunity(s,a,E,targets,proofs){
 if(a.weapon||a.country===a.faction)return 0;
 const o=E.options(s,a.id,'equip');
 const horizon=Math.min(6,campaignRules(s).maxTurns-s.turn-o.duration+1);
 if(o.error||horizon<2)return 0;
 const f=s.factions[a.faction],local=targets.filter(t=>t.country===a.country);
 // Do not postpone a ready arrest or a local extraction to acquire equipment.
 if(local.some(t=>t.prepared&&t.locationUntil>=s.turn)||rescueTargets(s,a.faction).some(v=>v.country===a.country))return 0;
 const b={...a,task:null,weapon:true,fatigue:Math.min(100,a.fatigue+o.fatigue*o.duration),exposure:Math.min(100,a.exposure+E.missionExposure(a,'equip',true))};
 const after={...s,agents:s.agents.map(x=>x.id===a.id?b:x)},uses=[];
 const add=(type,target,value,weight=1)=>{
  const base=E.options(s,a.id,type,target),armed=E.options(after,a.id,type,target);
  // Includes fatigue/exposure thresholds and the normal success cap.
  const gain=Math.max(0,armed.chance-base.chance)/100;
  if(gain)uses.push({gain:gain*value*weight,duration:armed.duration});
 };
 for(const t of local){
  const pp=proofs(t),readiness=pp.length>=2?.8:pp.length?.5:.25;
  add('arrest',t.id,184+(t.cell===3?90:0),readiness);
  if(!t.intimidated&&pp.length<2)add('intimidate',t.id,100);
 }
 if(local.length&&!E.hasSafehouse(s,a.faction,a.country))add('findSafehouse',null,70);
 // At most one plausible next destination, not one reward per country.
 const next=targets.find(t=>t.country!==a.country&&t.country!==a.faction&&s.agents.filter(b=>b.id!==a.id&&(b.faction===a.faction||s.gameMode==='cooperative')&&!['captured','dead','retired'].includes(b.status)&&(['travel','sneak'].includes(b.task?.type)?b.task.target:b.country)===t.country).length<2);
 const captive=rescueTargets(s,a.faction).find(v=>v.country!==a.country);
 if(captive){const route=E.options(s,a.id,'sneak',captive.country);if(!route.error&&route.duration+2<=horizon)add('rescue',captive.id,120,.6);}
 if(next){const route=E.options(s,a.id,'sneak',next.country);if(!route.error&&route.duration+2<=horizon)add('sneak',next.country,100,.6);}
 uses.sort((x,y)=>y.gain/y.duration-x.gain/x.duration);
 let turns=0,benefit=0;
 for(const u of uses){if(turns+u.duration>horizon)continue;turns+=u.duration;benefit+=u.gain;}
 return benefit;
}
