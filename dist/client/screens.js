import {operationMapMarkup} from './draft-ui.js?v=243';
import {operationCountries} from './operation-map.js?v=243';
import {cellInfoBadge} from './cell-info.js?v=243';
import {agentLocation} from './agent-location.js?v=243';
import {attackDelayBanner} from './attack-delay-ui.js?v=243';
import {countrySidebarActions,floatingAgentMarkup} from './country-operations.js?v=243';
import {isCooperative,visibleTeam} from './cooperative.js?v=243';
import {isNpcTutorial,tutorialRecruitment} from './tutorial-mode.js?v=243';
import {isTutorial} from './tutorial-rules.js?v=243';
import {recruitCard,selectedRecruitSlots,recruitControls,visibleRecruits} from './recruit-selection.js?v=243';
import {aiDifficultyControl} from './ai-difficulty.js?v=243';
import {threatPanel} from './threats-ui.js?v=243';
import {personnelPanel} from './personnel-ui.js?v=243';
import {teamBalanceMarkup} from './team-balance.js?v=243';
import {COOPERATION,cooperationRules} from './cooperation.js?v=243';
import {technologyPanel} from './technology-ui.js?v=243';
import {prestigeHistory} from './prestige.js?v=243';
import {countryArtHeader,countrySignals,diplomacySignals} from './country-signals.js?v=243';
import {suspectPortrait,SUSPECT_PROFILES,identityKnown} from './fracture-profiles.js?v=243';
import {plotStage} from './fracture.js?v=243';
import {activityRows,techUnavailable} from './experience.js?v=243';
import {evidenceSummary,nationalPanel,foreignProgress} from './command-ui.js?v=243';
import {internationalActivity} from './operations-ui.js?v=243';
import {proofTitle} from './intelligence.js?v=243';
import {countryOptions,statusBadge,availability,caseProgress,sortedCaseTargets} from './presentation.js?v=243';
import {renderMap} from './map.js?v=243';
import {cityArt,fullBody} from './visuals.js?v=243';
import {COUNTRIES,COUNTRY,DISPLAY_ROSTER as ROSTER,ROSTER as FULL_ROSTER,TALENTS,STAT_NAMES,ACTIONS,CELLS,cellName,EVIDENCE_NAMES,TECH} from './data.js?v=243';
import * as E from './engine.js?v=243';
import {esc,icon,button,flag,nationalities,nationalityFlags,talentIcon,portrait,statlines,talents,brand,heading,formatScore,campaignHeading} from './ui.js?v=243';
export function setupScreen(country,agents,hasSave,mp=null,aiDifficulty='bb2',gameMode='regular',operationMap=null){const regularSetup=gameMode==='regular',choosingMap=regularSetup&&(mp?.chooseMap||!mp&&operationMap===false);return `<div class="setup-shell"><header>${brand()}<div class="classified">ACCÈS RESTREINT <span>● CONNEXION SÉCURISÉE</span></div></header><main class="setup-main">${mp?.header||''}${heading('','Opération Ligne de faille','')}<div class="setup-columns"><div class="setup-selection"><section class="setup-country"><div class="section-title"><h2><span>01</span> Choisir votre pays</h2></div><div class="country-grid">${COUNTRIES.filter(c=>c.power).map(c=>`<button class="nation ${c.id===country?'selected':''}" data-cmd="${mp?'mp-country':'country'}" data-id="${c.id}" ${mp?.locked||mp?.taken?.includes(c.id)?'disabled':''} aria-pressed="${c.id===country}">${flag(c.id)}<div><strong>${c.name}</strong></div>${c.id===country?icon('check'):''}</button>`).join('')}</div></section>${operationMapMarkup(operationMap)}${choosingMap?'<p class="notice">Confirmez votre pays pour découvrir les six pays d’opération avant de composer votre unité.</p>':['advanced','cooperative'].includes(gameMode)?`<p class="notice">${gameMode==='cooperative'?'Deux pays alliés, quatre agents chacun. Dossiers, preuves, contacts, mandats, planques et hack partagés. Victoire : 3 cellules et l’Architecte en 30 tours. Crise +3 par tour, +30 par attaque réussie. Budgets et diplomatie individuels. Le PNJ prépare ses ordres avant vous.':'Confirmez votre pays pour choisir seize agents parmi les vingt disponibles. Les PNJ complèteront les quatre pays participants.'}</p>`:`<div class="section-title"><h2><span>02</span> Composer votre unité</h2><span class="count">${agents.length} / 4 agents sélectionnés</span></div>${selectedRecruitSlots(agents,mp?'multi':'solo')}${recruitControls(mp?'multi':'solo')}<div class="recruit-grid">${visibleRecruits(mp?'multi':'solo').map(a=>recruitCard(a,agents,mp?'multi':'solo')).join('')}</div>`}</div><aside class="briefing panel">${['advanced','cooperative'].includes(gameMode)?`<h2>${gameMode==='cooperative'?'Deux pays, huit agents':'Quatre pays, seize agents'}</h2><p>Choix exclusifs en serpentin. Après le repêchage, réorganisez votre équipe et désignez son chef.</p>`:teamBalanceMarkup(agents)}${mp?'':`<div class="setup-game-options">${aiDifficultyControl(aiDifficulty)}</div>`}${mp?'':choosingMap||['advanced','cooperative'].includes(gameMode)?button('Confirmer mon pays','solo-confirm-country','primary setup-launch'):button('Lancer l’opération','start','primary setup-launch',agents.length!==4?'disabled':'')}</aside></div></main><footer>PROGRAMME SHADOW MANDATE / DIVISION RENSEIGNEMENT <span>2040 · LIGNE DE FAILLE</span></footer></div>`;}
export function makeScreens(state,selectedCountry,selectedAgent,world,camera,locked=''){
const f=state.factions[state.player];
function agentStatus(a){return a.status==='captured'?'En détention':a.status==='injured'?'Blessé':a.task?`${a.task.queued?'Ordre planifié':'En opération'} · ${a.task.remaining} t`:'Disponible';}
function teamCards(){const pending=state.recruitments.filter(r=>r.faction===state.player);return `<div class="team-grid">${E.team(state).map(a=>{const b=availability(a),t=a.task;return `<button class="agent-card ${a.faction!==state.player?'coop-ally':''} state-${b.kind} ${t?'busy':''}" data-cmd="map-agent" data-id="${a.id}" aria-pressed="${selectedAgent===a.id}" title="${a.faction===state.player?'Cliquez pour consulter':'Partenaire : consulter la fiche'} · ${esc(a.name)} · ${COUNTRY[a.country].city} · ${t?ACTIONS[t.type].name+' · '+t.remaining+' tour(s)':b.label} · ${100-a.fatigue}/100 énergie">${portrait(a)}<div class="agent-card-copy"><h3><span class="field-agent-name">${esc(a.name)}</span> <span class="agent-nationality" title="Nationalité">${nationalityFlags(a)}</span>${a.faction!==state.player?' · Allié':''}</h3><span class="availability ${b.kind}">${icon(b.icon)}${t?.queued?'PLANIFIÉ':b.label}${t?` <small>· ${t.remaining} t</small>`:''}</span><div class="agent-brief">${agentLocation(a,{compact:true,pin:true})}<span class="compact-energy" title="Énergie et exposition">É ${100-a.fatigue} · Exp ${a.exposure}</span></div>${t?`<progress class="compact-progress" aria-label="Progression de ${esc(ACTIONS[t.type].name)}" max="${t.total}" value="${t.total-t.remaining}"></progress>`:''}</div></button>`;}).join('')}${pending.map(r=>`<div class="empty-slot pending-recruit" role="status">${icon('clock')}<span><strong>${esc(FULL_ROSTER.find(a=>a.id===(r.templateId||r.id))?.name||r.id)}</strong><small>Arrivée dans ${r.remaining} tour(s)</small></span></div>`).join('')}${Array.from({length:isTutorial(state)&&!tutorialRecruitment(state)?0:Math.max(0,4-E.team(state).length-pending.length)},()=>`<button class="empty-slot" data-cmd="recruit">${icon('plus')} Recruter</button>`).join('')}</div>`;}
function worldScreen(){
 const c=COUNTRY[selectedCountry],active=visibleTeam(state).find(a=>a.id===selectedAgent);
 const heading=active
  ? `<span class="agent-sidebar-identity">${esc(active.name)} <span class="agent-nationality">${nationalityFlags(active)}</span></span>`
  : `${flag(c.id)} ${c.name}<span>${c.city}</span>`;
 const panel=active?floatingAgentMarkup(state,active.id,{locked}):`<aside class="country-dossier panel">${countryArtHeader(state,c.id)}<div class="country-sidebar-scroll">${c.power&&c.id!==state.player?`<p class="power-consultation">Superpuissance · consultation uniquement</p>${state.factions[c.id]?`<p>${formatScore(state.factions[c.id].score)} prestige</p>`:''}`:countrySidebarActions(state,c.id,locked)}</div></aside>`;
 const training=isTutorial(state)?'<div class="objective-strip"><span>FILIGRANE · Formation sur le terrain</span></div>':'';
 return `<h1 class="sr-only">Situation mondiale</h1>
 <details class="map-dossier ${active?'agent-sidebar':'country-sidebar'}" ${camera.panelOpen?'open':''}><summary${active?` aria-label="${esc(active.name)}"`:''}>${heading}</summary>${panel}</details>
 <div class="world-overview"><section class="world-center">${renderMap(state,selectedCountry,world,camera)}${training}</section></div>
 ${attackDelayBanner(state)}
 <section class="field-team panel">
  <div class="panel-bar"><span>VOS AGENTS SUR LE TERRAIN</span><span>${E.team(state).filter(a=>!a.task&&a.status!=='captured').length} DISPONIBLE(S)</span></div>
  <button type="button" class="btn foreign-agent-toggle" data-map="foreign" aria-pressed="${camera.foreign!==false}" aria-label="Agents étrangers" title="Agents étrangers">${icon('people')}</button>
  ${teamCards()}
 </section>`;
}
function agentsScreen(){return personnelPanel(state,selectedAgent);}

function suspectCard(t){
 const evidence=E.evidenceFor(state,state.player,t.id),verified=evidence.filter(e=>e.verified).length;
 const progress=caseProgress(state,t),profile=SUSPECT_PROFILES[t.templateId??t.id];
 const portraitNote=identityKnown(t)?profile?.trait:'Portrait non disponible';
 const cell=t.cell===3?'Commandement':cellName(t.cell);
 const arrestingCountry=t.arrestedBy&&(COUNTRY[t.arrestedBy]?.name||t.arrestedBy);
 const position=t.locationUntil>=state.turn?'Position confirmée':'Position à établir';
 return `<article class="case-overview-card${t.arrested?' resolved':''}${t.cell===3?' mastermind':''}">
  <div class="case-tab">${icon('file')} <span>${esc(cell)}</span></div>
  <div class="case-folder">
   <div class="dossier-sheet case-identity">
    ${suspectPortrait(t)}
    <div><h3>${esc(t.name)}</h3><p>${esc(t.role)}</p>${portraitNote?`<small>${esc(portraitNote)}</small>`:''}</div>
   </div>
   <div class="case-location"><span>${flag(t.country)} ${esc(COUNTRY[t.country].name)}</span>
    ${t.arrested?`<span class="case-arrested">${arrestingCountry?'Arrêté par '+esc(arrestingCountry):'Arrêté'}</span>`:`<small>${position}</small>`}
   </div>
   ${t.flightUntil&&!t.arrested?`<p class="case-flight">${icon('plane')} Départ signalé · fin du tour ${t.flightUntil}</p>`:''}
   <div class="case-overview-progress">
    <div><strong>${progress.done}/${progress.steps.length} étapes</strong><span>${evidence.length?`${verified}/${evidence.length} ${evidence.length===1?'preuve vérifiée':'preuves vérifiées'}`:'Aucune preuve recueillie'}</span></div>
    <progress max="${progress.steps.length}" value="${progress.done}" aria-label="Progression du dossier"></progress>
    <small>${esc(progress.label)}</small>
   </div>
   ${button('<span>Ouvrir le dossier</span>'+icon('chevron'),'country-inquiry','primary case-overview-open',
    `data-id="${esc(t.id)}" aria-label="Ouvrir le dossier de ${esc(t.name)}"`)}
  </div>
 </article>`;
}
function inquiryScreen(){
 const targets=sortedCaseTargets(state),discovered=targets.filter(t=>!t.arrested),closed=targets.filter(t=>t.arrested);
 const hidden=state.suspects.filter(t=>!E.dossier(state,state.player,t.id));
 const undiscovered=hidden.filter(t=>!t.arrested&&t.id!=='s6'),leaderHidden=hidden.some(t=>t.id==='s6'&&!t.arrested);
 const unknownArrests=hidden.filter(t=>t.arrested);
 const cells=[...new Set(state.suspects.filter(t=>t.cell!==3).map(t=>t.cell))],done=E.cellsDone(state);
 const research=E.leadResearch(state).progress,queue=E.evidenceQueue(state,state.player).length;
 const cellGoal=E.coopCellGoal(state),architectArrested=state.suspects.some(t=>t.id==='s6'&&t.arrested);
 const toVerify=queue===0?'Aucune preuve à vérifier au QG':queue===1?'1 preuve à vérifier au QG':`${queue} preuves à vérifier au QG`;
 const status=`<span class="campaign-status">${icon('file')} <span>${toVerify}</span></span>`;
 return `<section class="campaign-panel investigation-overview" aria-labelledby="investigationTitle">
  ${campaignHeading('investigationTitle','file','Le réseau Fracture',status)}
  <div class="campaign-card investigation-summary">
   <section class="investigation-research">
    <div class="investigation-metric"><h2>${icon('research')} Recherche</h2>${undiscovered.length?`<strong>${research} / 3 points</strong>`:''}</div>
    ${undiscovered.length?`<progress max="3" value="${research}" aria-label="Recherche"></progress>`:'<small>Tous les dossiers accessibles sont connus</small>'}
    <details class="investigation-research-details"><summary>Gains de recherche</summary><p>Contact / intrusion / IA +1 · Contre-espionnage +2</p><p>Tous les gains se cumulent · surplus conservé</p></details>
   </section>
   <section class="investigation-goal">
    <div class="investigation-metric"><h2>${icon('radar')} Objectif collectif</h2>
     <div class="investigation-goal-progress"><span>${Math.min(done.length,cellGoal)}/${cellGoal} cellules démantelées</span><span class="${architectArrested?'done':''}">${icon(architectArrested?'check':'cuffs')} ${architectArrested?'L’Architecte arrêté':'L’Architecte à arrêter'}</span></div>
    </div>
    <div class="cell-status">${cells.map(i=>`<span class="${done.includes(i)?'done':''}">${cellInfoBadge(state,i)} <b>${state.suspects.filter(t=>t.cell===i&&t.arrested).length}/2</b></span>`).join('')}</div>
   </section>
  </div>
  <div class="overview-list-heading"><h2>Dossiers actifs</h2>${evidenceSummary(state)}</div>
  <div class="campaign-grid case-grid">
   ${discovered.map(suspectCard).join('')}
   ${undiscovered.length||leaderHidden?`<article class="case-overview-card case-discovery">
    <div class="case-tab">${icon('lock')} <span>${undiscovered.length?`Dossiers à découvrir · ${undiscovered.length}`:'Direction inconnue'}</span></div>
    <div class="case-folder">
     ${undiscovered.length?'<p>Activez des contacts ou menez une opération de contre-espionnage.</p>':''}
     ${leaderHidden?`${undiscovered.length?'<strong>Direction inconnue</strong>':''}<p>Démantelez ${E.coopCellGoal(state)} cellules ou recoupez les preuves de ${state.gameMode==='cooperative'?4:3} suspects.</p>`:''}
    </div>
   </article>`:discovered.length?'':'<p class="case-empty">Aucun dossier actif.</p>'}
  </div>
  ${closed.length||unknownArrests.length?`<details class="campaign-disclosure case-archive">
   <summary>${icon('file')} <span>Dossiers clos</span> <small>${closed.length+unknownArrests.length}</small></summary>
   <div class="campaign-grid case-grid">${closed.map(suspectCard).join('')}${unknownArrests.map(t=>`<article class="case-overview-card resolved">
    <div class="case-tab">${icon('lock')} <span>Dossier clos</span></div>
    <div class="case-folder"><strong>Cible arrêtée</strong><p>Dossier non détenu par votre équipe.${t.arrestedBy?' Arrestation : '+esc(COUNTRY[t.arrestedBy]?.name||t.arrestedBy):''}</p></div>
   </article>`).join('')}</div>
  </details>`:''}
 </section>`;
}
function operationsScreen(){return `<div class="ops-layout technology-layout">${technologyPanel(state)}</div>`;}
function countryRelation(c,index){
 const own=c.id===state.player,faction=state.factions[c.id],level=f.cooperation[c.id],relation=COOPERATION[level];
 const playerName=state.multiplayer?.players?.find(p=>p.country===c.id)?.name;
 const support=f.cyberSupport?.[c.id],cyber=E.cyberStatus(state,state.player,c.id);
 const agents=E.team(state).filter(a=>a.country===c.id);
 const sightings=Object.values(f.publicAgents).filter(a=>a.country===c.id&&(a.source!=='counter'||a.until>=state.turn));
 const relationStatus=c.power
  ? `<div class="diplomacy-standing"><span class="sr-only">Prestige</span><strong class="diplomacy-score">${formatScore(faction.score)} <small>pts</small></strong></div>`
  : `<div class="diplomacy-standing"><span class="sr-only">Coopération des autorités</span><strong class="diplomacy-level" data-level="${level}">${esc(relation?.name||'—')}</strong></div>`;
 const cyberStatus=!c.power&&cyber.until>=state.turn?`<div class="diplomacy-support">
  ${icon('terminal')} <span>${cyber.active?'Hack actif':'Hack planifié'} · jusqu’à T${cyber.until}</span>
  ${support?.until>=state.turn?'':'<small>Géré par l’équipe alliée</small>'}
 </div>`:'';
 const actions=`<div class="diplomacy-actions">
  ${button(icon('world')+' <span class="diplomacy-control-label">Voir le pays</span>','map-country','small',`data-id="${c.id}" aria-label="Voir le pays" title="Voir le pays"`)}
  ${own?button(icon('seal'),'nav','primary small','data-id="government" aria-label="Gouvernement" title="Gouvernement"'):''}
 </div>`;
 const territoryDetails=c.power?'':`
   <dl>
    ${relation?`<div><dt>Appui des autorités</dt><dd>Mandat : ${relation.mandate>0?'+':''}${relation.mandate} points · Localisation et arrestation avec mandat : ${relation.field>0?'+':''}${relation.field} points${level===4?' · Surveillance +1 tour':''}</dd></div>`:''}
    <div><dt>Exposition de vos agents</dt><dd>${agents.length?agents.map(a=>esc(a.name)+' · '+a.exposure+'/100 · '+E.exposureLabel(a)).join('<br>'):'Aucun agent sur place'}</dd></div>
    <div><dt>Planque de l’équipe</dt><dd>${E.hasSafehouse(state,state.player,c.id)?'Disponible pour tous vos agents':'À trouver'}</dd></div>
   </dl>
   <p>${f.access[c.id]?'Accès local ouvert.':'Un contact réussi peut ouvrir l’accès local.'}</p>
   ${sightings.length?`<div class="diplomacy-sightings"><strong>Présences étrangères signalées</strong>
    ${sightings.map(a=>`<p>${flag(a.faction)} ${esc(a.name)} · Équipe ${esc(COUNTRY[a.faction].name)} · observé T${a.turn}</p>`).join('')}
    <small>Dernière observation connue ; mission et position actuelle non confirmées.</small></div>`:'<p>Aucune présence étrangère signalée.</p>'}`;
 return `<article class="campaign-card diplomacy-card" data-country="${c.id}">
  <div class="campaign-card-art diplomacy-art">
   <div class="campaign-city-image" aria-hidden="true">${cityArt(c.id,c.art?'':'diplomacy-city-tile')}</div>
   ${c.power?`<span class="diplomacy-rank" title="Classement par prestige">#${index+1}</span>`:''}
   <header class="campaign-place">
    ${flag(c.id)}
    <div class="diplomacy-place-copy">
     <h3>${esc(c.name)}</h3>
     <span>${esc(c.city)}${playerName?` <span class="diplomacy-player">· ${esc(playerName)}</span>`:''}${own?' · Votre pays':''}</span>
     ${c.power?'':relationStatus}
    </div>
   </header>
   ${c.power?relationStatus:''}
  </div>
  <div class="diplomacy-card-body">
   ${!c.power?`<div class="diplomacy-signals" role="group" aria-label="Indicateurs du pays">${diplomacySignals(state,c.id)}</div>`:''}
   ${actions}
   <details class="campaign-disclosure diplomacy-details">
    <summary title="Détails" aria-label="Détails"><span class="diplomacy-control-label">Détails</span></summary>
    <div class="diplomacy-detail-content">
     <div class="diplomacy-signal-details">${countrySignals(state,c.id,true)}</div>
     ${territoryDetails}
    </div>
   </details>
   ${cyberStatus}
  </div>
 </article>`;
}
function diplomacyScreen(){
 const powers=COUNTRIES.filter(c=>c.power&&state.factions[c.id]).sort((a,b)=>state.factions[b.id].score-state.factions[a.id].score);
 return `<section class="campaign-panel diplomacy-overview" aria-labelledby="diplomacyTitle">
  ${campaignHeading('diplomacyTitle','seal','Diplomatie',`<div class="diplomacy-tools">
   <details class="campaign-disclosure diplomacy-rules">
    <summary>Détails de la coopération</summary><div class="diplomacy-detail-content">${cooperationRules}</div>
   </details>
   <details class="campaign-disclosure diplomacy-activity"><summary>Activité internationale</summary>${internationalActivity(state)}</details>
  </div>`)}
  <div class="diplomacy-columns">
   <section class="diplomacy-group diplomacy-powers"><h2>Superpuissances <small>Classées par prestige</small></h2><div class="campaign-grid">${powers.map(countryRelation).join('')}</div></section>
   <section class="diplomacy-group diplomacy-countries"><h2>Autres pays <small>Hors classement</small></h2><div class="campaign-grid">${operationCountries(state).map(countryRelation).join('')}</div></section>
  </div>
 </section>`;
}
function governmentScreen(){return `${nationalPanel(state)}`;}
function journalScreen(){
 const archives=button(icon('people')+' Statistiques des agents','campaign-archives','campaign-header-action');
 const logs=E.visibleLogs(state);
 return `<section class="campaign-panel journal-overview" aria-labelledby="journalTitle">
  ${campaignHeading('journalTitle','clock','Journal d’opération',archives)}
  <details class="campaign-disclosure journal-prestige"><summary>${icon('seal')} <span>Historique du prestige</span> <small>${formatScore(f.score)} pts</small></summary>${prestigeHistory(state)}</details>
  <section class="campaign-card journal-list" aria-label="Événements">${logs.length?activityRows(state,logs):'<p>Aucun événement enregistré.</p>'}</section>
 </section>`;
}
return {threats:()=>threatPanel(state),world:worldScreen,agents:agentsScreen,inquiry:inquiryScreen,operations:operationsScreen,diplomacy:diplomacyScreen,government:governmentScreen,journal:journalScreen};
}

function activeMission(s,a){if(!a.task)return '';const t=a.task,locked=E.travelInProgress(a)||a.faction!==s.player,target=COUNTRY[t.target]?.city||s.suspects.find(x=>x.id===t.target)?.name||'';return `<section class="focus-mission" aria-label="Mission de l’agent"><div class="focus-mission-heading"><span>${t.queued?'MISSION PLANIFIÉE':'MISSION EN COURS'}</span>${button(icon('close'),'cancel','mission-cancel',`data-id="${a.id}" aria-label="Annuler la mission de ${esc(a.name)}" title="${locked?'Déplacement commencé : annulation impossible':'Annuler la mission'}" ${locked||s.ended?'disabled':''}`)}</div><h3>${ACTIONS[t.type].name}</h3>${target?`<p>${esc(target)}</p>`:''}<strong>${t.chance} % de réussite · ${t.remaining} tour(s) restant(s)</strong><p>Fin prévue : T${s.turn+t.remaining-1}</p><progress aria-label="Progression de la mission" max="${t.total}" value="${t.total-t.remaining}"></progress><small>${locked?'Déplacement commencé · non annulable':'Annulation : progression perdue.'}</small></section>`;}

function agentFocusHeading(a){
 const energy=100-a.fatigue,exposure=a.exposure;
 const energyColor=energy>=51?'green':energy>=26?'yellow':'red';
 const exposureColor=exposure<20?'green':exposure<40?'blue':exposure<60?'yellow':exposure<80?'orange':'red';
 return `<div class="focus-heading">${portrait(a)}<div class="focus-identity"><h2>${esc(a.name)} ${nationalityFlags(a)}</h2><p>${esc(a.role)}</p></div><div class="focus-readings" aria-label="État de l’agent"><p>Énergie <strong class="reading-${energyColor}">${energy}/100</strong></p><p>Exposition <strong class="reading-${exposureColor}">${exposure}/100</strong></p></div></div>`;
}
