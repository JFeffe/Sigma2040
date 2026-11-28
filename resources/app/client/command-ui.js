import {translateText} from './localization.js?v=247';
import {operationCountries} from './operation-map.js?v=247';
import {COOPERATION} from './cooperation.js?v=247';
import {evidenceFreshness} from './experience.js?v=247';
import * as E from './engine.js?v=247';
import {COUNTRY} from './data.js?v=247';
import {proofTitle} from './intelligence.js?v=247';
import {esc,flag,button,icon,countryOption,countrySelect} from './ui.js?v=247';
const nation=id=>COUNTRY[id]?`${flag(id)} ${COUNTRY[id].name}`:'Non consigné';
export function exposureMarkup(a){const penalty=E.exposurePenalty(a);return `<div class="exposure-block"><div class="exposure-segments" role="meter" aria-label="Exposition" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,a.exposure)}" aria-valuetext="${a.exposure}/100 ; ${penalty?'pénalité de '+penalty+' points sur les actions sensibles':'aucune pénalité'}">${[0,20,40,60,80].map(n=>`<i class="${a.exposure>n?'filled':''} ${a.exposure>=60?'high':a.exposure>=40?'medium':'low'}"></i>`).join('')}</div><details class="exposure-card"><summary>Exposition <strong>${a.exposure}/100</strong> · ${E.exposureLabel(a)}${penalty?` · −${penalty} pts sur les actions sensibles`:''}</summary><meter min="0" max="100" value="${a.exposure}" aria-label="Exposition de l’agent"></meter><p>Traces et attention laissées par l’agent, distinctes de sa fatigue. 0–19 Discret · 20–39 Repérable au contre-espionnage mondial · 40–59 Surveillé : −6 aux actions sensibles · 60–79 Compromis : −9 sensibles / −5 enquête · 80–100 Très exposé : −12 sensibles / −10 enquête et +1 pression sur une réussite contre une cible (arrestation : +3, sans cumul). Sensibles : passage clandestin, arrestation, extraction. Enquête : collecte, localisation, préparation, intrusion. Aucune capture automatique.</p><p>Passeport +10 · acquisition d’arme +10 · drone +10 · échec +18. Réduire : profil bas −35, repos au QG −20, planque −15.</p></details></div>`;}
export function evidenceSummary(s){
 const evidence=s.factions[s.player].evidence,raw=E.evidenceQueue(s,s.player);
 const running=raw.filter(e=>E.analysisAgent(s,s.player,e.id)).length;
 const verified=evidence.filter(e=>e.verified).length,contested=evidence.filter(e=>e.contested).length;
 return `<div class="evidence-counts">
  <span class="good">${verified} ${verified===1?'vérifiée':'vérifiées'}</span>
  <span class="pending">${raw.length-running} en attente</span><span>${running} en vérification</span>
  <span>${contested} ${contested===1?'écartée':'écartées'}</span>
 </div>`;
}
export function evidenceRegister(s){const f=s.factions[s.player],entries=f.evidence.filter(e=>!s.suspects.find(t=>t.id===s.proofs.find(p=>p.id===e.id)?.suspect)?.arrested||e.verified).sort((a,b)=>(a.contested?2:a.verified?1:0)-(b.contested?2:b.verified?1:0));return `${evidenceSummary(s)}<p class="evidence-explanation">Pièce brute : recueillie, mais pas encore vérifiée. Pour préparer une arrestation : deux pièces indépendantes non écartées, dont au moins une vérifiée. Une falsification écartée ne compte plus. Choisissez la pièce que l’analyste doit examiner.</p>${entries.length?`<div class="table-scroll"><table><thead><tr><th>Pièce / cible</th><th>Collecte</th><th>Vérification</th><th>État / action</th></tr></thead><tbody>${entries.map(e=>{const p=s.proofs.find(x=>x.id===e.id),t=s.suspects.find(x=>x.id===p.suspect),agent=E.analysisAgent(s,s.player,e.id);return `<tr class="${evidenceFreshness(e.id)?'proof-changed':''}"><td>${button(esc(proofTitle(p)),'proof','proof-title',`data-id="${e.id}"`)}${evidenceFreshness(e.id)}<small>${t.name}</small></td><td>${nation(e.collectedBy||p.foundBy)}</td><td>${e.verified||e.contested?nation(e.verifiedBy):agent?`${esc(agent.name)} · ${agent.task.remaining} tour(s)`:'À affecter au QG'}</td><td><span class="tag ${e.contested?'danger':e.verified?'good':''}">${e.contested?'ÉCARTÉE':e.verified?'VÉRIFIÉE':agent?'EN VÉRIFICATION':'EN ATTENTE'}</span>${!e.verified&&!e.contested&&!agent?button('Vérifier cette pièce','verify','small',`data-id="${e.id}"`):''}</td></tr>`;}).join('')}</tbody></table></div>`:'<p>Aucune pièce recueillie. Activez un contact dans le pays d’une piste, puis recueillez une preuve.</p>'}`;}
export function contributors(s,t){const f=s.factions[s.player],entries=f.evidence.filter(e=>s.proofs.find(p=>p.id===e.id)?.suspect===t.id),unique=ids=>[...new Set(ids.filter(Boolean))].map(nation).join(' · ')||'Non consigné';return `<details class="contribution-list" open><summary>Contributions connues à ce dossier</summary><dl><div><dt>Preuves recueillies</dt><dd>${unique(entries.map(e=>e.collectedBy||s.proofs.find(p=>p.id===e.id).foundBy))}</dd></div><div><dt>Preuves vérifiées</dt><dd>${unique(entries.filter(e=>e.verified).map(e=>e.verifiedBy))}</dd></div><div><dt>Préparation</dt><dd>${t.prepared?nation(t.prepBy):'À préparer'}</dd></div><div><dt>Dernière localisation</dt><dd>${t.locationUntil?nation(t.locBy):'À localiser'}${t.locationUntil?` · jusqu’à T${t.locationUntil}`:''}</dd></div><div><dt>Arrestation</dt><dd>${t.arrested?nation(t.arrestedBy):'À effectuer'}</dd></div></dl><small>Provenance des informations de votre dossier. Les contributions étrangères encore secrètes ne sont pas révélées.</small></details>`;}
const governmentFavors=[['funding','case'],['diplomacy','world'],['medical','plus']];
let selectedGovernmentFavor='funding';

export function selectGovernmentFavor(control){
 const panel=control.closest('.government-console');
 if(!panel)return;
 selectedGovernmentFavor=control.dataset.id;
 for(const option of panel.querySelectorAll('[data-cmd="government-select"]')){
  option.setAttribute('aria-pressed',String(option===control));
 }
 for(const card of panel.querySelectorAll('.government-card')){
  card.hidden=card.id!==control.getAttribute('aria-controls');
 }
}

function governmentCard(s,type,glyph,o,countries,chosen){
 const f=s.factions[s.player],d=E.GOVERNMENT_FAVORS[type];
 const amount=type==='funding'?o.gain:type==='medical'?o.energy:1;
 const unit=type==='funding'?'crédits':type==='medical'?'énergie':'niveau';
 const target=type==='diplomacy'?`<div class="government-target-row"><label class="government-target" for="governmentCountry">Pays cible</label>
  ${countrySelect(countries.map(c=>{
   const level=f.cooperation[c.id],atMax=level>=4;
   const relation=translateText(COOPERATION[level].name)+(atMax?' (max.)':' → '+translateText(COOPERATION[level+1].name));
   return countryOption(c.id,`${translateText(c.name)} · ${relation}`,{selected:c.id===chosen,disabled:atMax,localize:false});
  }).join(''),`id="governmentCountry" ${chosen?'':'disabled'}`)}</div>`:'';
 return `<article class="government-card government-${type}" id="government-${type}" aria-labelledby="government-${type}-title" ${type===selectedGovernmentFavor?'':'hidden'}>
  <img class="government-card-art" src="./assets/government-${type}.webp" alt="" decoding="async" loading="lazy">
  <header>
   <div class="government-card-title"><span class="government-symbol">${icon(glyph)}</span><h2 id="government-${type}-title">${d.name}</h2></div>
   <div class="government-effect"><strong>+${amount}</strong><span>${unit}</span></div>
  </header>
  ${target}${type==='medical'?`<div class="government-medical-note"><span>Soins en fin de tour</span><strong class="medical-remaining">${o.medicalRemaining}/3 utilisations restantes</strong></div>`:''}
  <div class="government-card-action">
   <small id="government-${type}-feedback" role="status">${esc(o.error||'')}</small>
   <div class="government-action-row"><span class="government-cost">${icon('seal')} <b data-government-cost>${o.cost??'—'}</b> <span>confiance</span></span>
    ${button('Solliciter','government-favor','primary',`data-id="${type}" aria-describedby="government-${type}-feedback" ${o.error?'disabled':''}`)}
   </div>
  </div>
 </article>`;
}

export function nationalPanel(s){
 const f=s.factions[s.player],next=E.governmentOptions(s,'funding').nextTurn,wait=Math.max(0,next-s.turn);
 const countries=operationCountries(s);
 const chosen=['hostile','finale'].includes(s.tutorial?.mission)?'TR':countries.find(c=>!E.governmentOptions(s,'diplomacy',c.id).error)?.id||countries.find(c=>f.cooperation[c.id]<4)?.id;
 const favors=governmentFavors.map(([type,glyph])=>({type,glyph,options:E.governmentOptions(s,type,chosen)}));
 const available=favors.some(({type,options})=>type!=='diplomacy'&&!options.error)||countries.some(c=>!E.governmentOptions(s,'diplomacy',c.id).error);
 const {income,cap}=E.funding(f);
 const last=f.lastFavor;
 return `<section class="government-console" aria-labelledby="governmentTitle">
  <header class="government-heading">
   <div class="government-country">${flag(s.player)}<div><h1 id="governmentTitle">Appui gouvernemental</h1><span>${esc(COUNTRY[s.player].name)}</span></div></div>
   <div class="government-availability ${wait?'cooldown':available?'available':'unavailable'}">${icon(wait?'clock':available?'check':'lock')}<strong>${s.ended?'Campagne terminée':wait?`Disponible au tour ${next}`:available?'Faveur disponible':'Aucune faveur disponible'}</strong></div>
  </header>
  <div class="government-overview">
   <section class="government-confidence" aria-labelledby="confidenceLabel">
    <div class="government-stat-heading"><span id="confidenceLabel">${icon('seal')} Confiance</span><strong>${f.confidence}<small>/100</small></strong></div>
    <div class="confidence-track ${f.confidence<10?'low':f.confidence<50?'normal':'high'}" role="meter" aria-labelledby="confidenceLabel" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f.confidence}">
     <span class="confidence-fill" style="width:${f.confidence}%"></span><i class="confidence-tick tick-ten" title="10 % : 2 crédits par tour"></i><i class="confidence-tick tick-fifty" title="50 % : 3 crédits par tour"></i>
    </div>
    <div class="confidence-thresholds" aria-hidden="true"><span>10 %</span><span>50 %</span></div>
   </section>
   <section class="government-credits" aria-labelledby="governmentCredits">
    <div class="government-stat-heading"><span id="governmentCredits">${icon('case')} Crédits</span><strong>${f.budget}</strong></div>
    <div class="government-budget-meta"><span>+${income} / tour</span><span>Plafond ${cap}</span></div>
   </section>
  </div>
  <div class="government-desk">
   <div class="government-favor-list" role="group" aria-label="Faveurs gouvernementales">
    ${favors.map(({type,glyph,options})=>button(`
     <span class="government-symbol">${icon(glyph)}</span>
     <span class="government-option-label"><strong>${E.GOVERNMENT_FAVORS[type].name}</strong>
      <small><b data-government-list-cost>${options.cost??'—'}</b> <span>confiance</span></small>
     </span>`,'government-select',`government-favor-option government-${type}`,
     `type="button" data-id="${type}" aria-controls="government-${type}" aria-pressed="${type===selectedGovernmentFavor}"`)).join('')}
   </div>
   <div class="government-favor-details">
    ${favors.map(({type,glyph,options})=>governmentCard(s,type,glyph,options,countries,chosen)).join('')}
   </div>
  </div>
  <div class="government-footer">${icon('clock')}${last?`<span>Dernière faveur</span><strong>${esc(E.GOVERNMENT_FAVORS[last.type].name)}${last.country?' · '+esc(COUNTRY[last.country].name):''}</strong><small>Tour ${last.turn}</small>`:'<span>Aucune faveur sollicitée</span>'}</div>
 </section>`;
}

export function foreignProgress(s){const intel=s.factions[s.player].foreignIntel||{};return `<details class="panel cooperation-panel foreign-progress"><summary>Enquêtes des autres puissances · renseignements échangés</summary><p>État communiqué au moment du dernier échange, sans mise à jour automatique. Un nouvel échange actualise ces informations. Les ordres des agents et le contenu des pièces brutes restent privés.</p>${Object.keys(s.factions).filter(id=>id!==s.player).map(id=>{const v=intel[id];return `<article class="foreign-dossier"><h3>${nation(id)} ${v?`<small>Échange T${v.turn} · ${s.turn-v.turn} tour(s) écoulé(s)</small>`:''}</h3>${v?`<div class="table-scroll"><table><thead><tr><th>Cible</th><th>Preuves</th><th>Préparation</th><th>Localisation</th><th>Arrestation</th></tr></thead><tbody>${v.cases.map(k=>`<tr><td>${s.suspects.find(t=>t.id===k.id).name}</td><td>${k.verified} vérifiées · ${k.raw} brutes</td><td>${k.prepared?'Prête':'Non'}</td><td>${k.locationUntil>=v.turn?`Valable à l’échange, jusqu’à T${k.locationUntil}`:'Non confirmée'}</td><td>${k.arrested?'Effectuée':'Non'}</td></tr>`).join('')}</tbody></table></div>`:'<p>Progression inconnue. Aucun état reçu.</p>'}</article>`;}).join('')}</details>`;}

export function energyHelp(a){const energy=100-a.fatigue,penalty=a.fatigue>=75?20:a.fatigue>=50?10:0;return `<details class="exposure-card energy-card"><summary>Énergie · effets sur les actions${penalty?` · −${penalty} pts`:''}</summary><p>51–100 énergie : aucun malus.<br>26–50 : −10 points de réussite.<br>0–25 : −20 points de réussite.</p><p>Ces malus concernent les actions avec un jet de réussite. Voyage sous passeport, repos, soins et profil bas restent automatiques.</p><p>À 0 énergie, la plupart des missions sont indisponibles. Restent possibles : voyage sous passeport, repos au QG, soins, profil bas, trouver une planque et repos en planque.</p><p>Repos au QG : +50 énergie · planque : +30 · profil bas : +10 · soins : +40. Le Soutien médical rend jusqu’à 12 points d’énergie immédiatement à l’équipe et soigne tous ses blessés en fin de tour. Endurance réduit de 25 % la fatigue des voyages, passages clandestins, localisations, arrestations et extractions.</p></details>`;}

export function exposureBar(a){const n=Math.max(0,Math.min(100,a.exposure));return `<div class="fatigue exposure-meter"><span>${n}/100 exposition · ${E.exposureLabel(a)}</span><i role="meter" aria-label="Exposition" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${n}"><b class="${n>=40?'warm':''}" style="width:${n}%"></b></i></div>`;}
