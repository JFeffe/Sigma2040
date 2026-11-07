import {COUNTRY,cellName} from './data.js?v=227';
export const CELL_RULES=Object.freeze({
 0:{count:6,damage:25,turns:[3,8,13,18,23,28],theme:'Finance et corruption',kinds:['Déstabilisation financière','Corruption institutionnelle'],effect:'Pression constante : six attaques, sans pénalité supplémentaire.'},
 1:{count:5,damage:30,turns:[5,11,17,23,29],theme:'Technologie et désinformation',kinds:['Cyberattaque','Sabotage automatisé'],effect:'Peut déplacer une attaque face à une protection établie, avec au moins quatre tours de préavis.'},
 2:{count:4,damage:38,turns:[7,14,21,28],theme:'Sabotages lourds',kinds:['Sabotage énergétique','Destruction logistique'],effect:'Quatre frappes lourdes : +38 crise chacune.'},
 4:{count:5,damage:20,turns:[6,12,18,24,30],theme:'Enlèvements',kinds:['Enlèvement d’un agent de liaison'],effect:'Chaque attaque réussie capture un agent extérieur dans le pays visé : +20 crise, puis +3 par fin de tour et par captif, dès ce tour. Toutes les équipes peuvent tenter une extraction : −10 crise et +2 prestige. Aucun recrutement.'}
});
export function selectCells(seed){
 const ids=[0,1,2,4];let n=(seed^0x25ac4e91)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);n=(n^(n>>>16))>>>0;
 for(let i=ids.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=Math.floor(n/4294967296*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
 return ids.slice(0,3).sort((a,b)=>a-b);
}
export function variantPlots(s){return s.activeCells.flatMap(cell=>CELL_RULES[cell].turns.map((turn,i)=>({id:`cell${cell}-${i}`,cell,turn,country:'DE',kind:CELL_RULES[cell].kinds[i%CELL_RULES[cell].kinds.length],resolved:false})));}
export const plotDamage=(s,p)=>s.cellVariantRules===1&&CELL_RULES[p?.cell]?CELL_RULES[p.cell].damage:30;
export const activeCaptives=s=>(s.captives||[]).filter(c=>c.status==='captured');
export const rescueTargets=(s,f)=>[...s.agents.filter(a=>a.faction===f&&a.status==='captured'),...activeCaptives(s)];
export function captureLiaison(s,p){
 s.captives??=[];if(s.captives.some(c=>c.plotId===p.id))return;
 const c={id:'captive-'+p.id,plotId:p.id,name:`Agent de liaison ${s.captives.length+1}`,country:p.country,capturedTurn:s.turn,status:'captured'};s.captives.push(c);return c;
}
export function captivityTick(s,write){for(const c of activeCaptives(s)){
 if(c.lastCrisisTurn===s.turn)continue;c.lastCrisisTurn=s.turn;s.crisis=Math.min(100,s.crisis+3);
 write(s,`${c.name} reste captif en ${COUNTRY[c.country].name} : crise +3.`,'danger');
}}
export function cellKnown(s,cell,f=s.player){return !s.cellVariantRules||s.suspects.some(t=>t.cell===cell&&(t.arrested||s.factions[f]?.known[t.id]))||s.plots.some(p=>p.cell===cell&&(p.announced||p.turn-s.turn<=5));}
export function validateCellVariants(s,bad){
 if(s.cellVariantRules===undefined){if(s.activeCells!==undefined||s.captives!==undefined)bad();return;}
 if(s.cellVariantRules!==1||!['regular','advanced','cooperative'].includes(s.gameMode)||!Array.isArray(s.activeCells)||s.activeCells.length!==(s.gameMode==='cooperative'?4:3)||new Set(s.activeCells).size!==s.activeCells.length||s.activeCells.some(c=>!Object.hasOwn(CELL_RULES,c)))bad();
 if(!Array.isArray(s.captives)||s.captives.length>5||new Set(s.captives.map(c=>c.id)).size!==s.captives.length||new Set(s.captives.map(c=>c.plotId)).size!==s.captives.length)bad();
 for(const c of s.captives){const p=s.plots?.find(p=>p.id===c.plotId);if(!p||p.cell!==4||!p.resolved||p.cancelled||c.id!=='captive-'+p.id||!COUNTRY[c.country]||COUNTRY[c.country].power||c.country!==p.country||!['captured','released'].includes(c.status)||typeof c.name!=='string'||c.name.length>80||/[<>"\n]/.test(c.name)||!Number.isInteger(c.capturedTurn)||c.capturedTurn<1||c.capturedTurn>s.turn)bad();
 if(c.lastCrisisTurn!==undefined&&(!Number.isInteger(c.lastCrisisTurn)||c.lastCrisisTurn<c.capturedTurn||c.lastCrisisTurn>s.turn))bad();
 if(c.status==='released'&&(!s.factions[c.releasedBy]||!Number.isInteger(c.releasedTurn)||c.releasedTurn<c.capturedTurn||c.releasedTurn>s.turn))bad();
 }
}
