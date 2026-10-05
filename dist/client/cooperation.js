export const COOPERATION=[
 {name:'Hostile',mandate:-25,field:-10},
 {name:'Réticente',mandate:-10,field:-5},
 {name:'Neutre',mandate:0,field:0},
 {name:'Favorable',mandate:10,field:5},
 {name:'Soutien total',mandate:20,field:10}
];
export const legacyCooperation=n=>Math.min(4,Math.floor(n/20));
export const cooperationInfo=(s,f,c)=>COOPERATION[s.factions[f].cooperation[c]];
export const cooperationRules=`<h3>Coopération des autorités</h3><p>Au début de chaque partie, chaque puissance reçoit au hasard 1 pays Hostile, 1 Réticent, 2 Neutres, 1 Favorable et 1 en Soutien total parmi les six pays secondaires. Les relations restent ensuite acquises dans la sauvegarde et évoluent selon vos actions.</p><p>Chaque pays possède sa propre relation avec votre équipe : Hostile, Réticente, Neutre, Favorable ou Soutien total. Aucun score intermédiaire. Les bonus sont des points de pourcentage ; les chances restent plafonnées à 90 %.</p><table><thead><tr><th>Niveau</th><th>Mandat</th><th>Localiser</th><th>Arrestation avec mandat</th></tr></thead><tbody>${COOPERATION.map(c=>`<tr><td>${c.name}</td><td>${c.mandate>0?'+':''}${c.mandate}</td><td>${c.field>0?'+':''}${c.field}</td><td>${c.field>0?'+':''}${c.field}</td></tr>`).join('')}</tbody></table><p>Soutien total : une localisation obtenue par « Localiser une cible » dure un tour de plus. Ce soutien ne bloque pas une fuite et ne prolonge ni drone ni intimidation. Intimidation, intrusion et drone ne reçoivent aucun bonus ou malus de coopération.</p><p>Chantage diplomatique réussi : accès local ouvert et +1 niveau, au maximum une montée par pays et par tour pour votre équipe. Au niveau maximal, le chantage est disponible seulement si l’accès est fermé. Une attaque réellement déjouée grâce à votre protection : +1 niveau, une fois par attaque. Une arrestation sans mandat : −1 niveau après la tentative, réussite ou échec ; un ordre annulé ou interrompu ne pénalise pas la relation. Un échec de négociation ne change pas le niveau.</p>`;

// Scenario balance for secondary countries, not a real-world diplomatic rating.
export const INITIAL_COOPERATION={
 FR:{DE:4,CA:3,JP:2,BR:2,ZA:1,TR:0},
 US:{JP:4,DE:3,CA:2,TR:2,BR:1,ZA:0},
 CN:{BR:4,ZA:3,DE:2,TR:2,CA:1,JP:0},
 IN:{JP:4,ZA:3,DE:2,BR:2,TR:1,CA:0},
 RU:{ZA:4,BR:3,TR:2,CA:2,JP:1,DE:0},
 GB:{CA:4,JP:3,DE:2,ZA:2,TR:1,BR:0}
};
export const initialCooperation=(f,c)=>INITIAL_COOPERATION[f]?.[c.id]??legacyCooperation(c.coop);

// A separate seeded stream preserves the rest of the scenario draw.
export function randomizedCooperation(f,countries,seed){
 let rng=((seed>>>0)^0x9e3779b9^((f.charCodeAt(0)<<16)|f.charCodeAt(1)))>>>0;
 const draw=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const levels=[0,1,2,2,3,4];for(let i=levels.length-1;i>0;i--){const j=Math.floor(draw()*(i+1));[levels[i],levels[j]]=[levels[j],levels[i]];}
 let index=0;return Object.fromEntries(countries.map(c=>[c.id,c.power?initialCooperation(f,c):levels[index++]]));
}
