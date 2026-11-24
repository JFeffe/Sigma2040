import {gameLanguage,setGameLanguage,translateText,localizeContent,setLocalizedHTML} from './localization.js?v=245';
import {mapCountries,countryOnMap,selectOperationMap} from './operation-map.js?v=245';
import {isCompactTutorial} from './tutorial-compact.js?v=245';
import {dismissAttackDelays} from './attack-delay-ui.js?v=245';
import {createGameWorkspace} from './workspace-windows.js?v=245';
import {isNpcTutorial,tutorialGuaranteed,tutorialRiskNote} from './tutorial-mode.js?v=245';
import {readPreference,writePreference} from './browser-preferences.js?v=245';
import {tutorialPendingOrders,tutorialHint} from './tutorial-rules.js?v=245';
import {isTutorial,createTutorialGame,tutorialObjective,tutorialMission,readTutorialProgress,saveTutorialProgress} from './tutorial.js?v=245';
import {newGameMenu} from './new-game-menu.js?v=245';
import {tutorialMenu,tutorialGuide,markTutorialControls} from './tutorial-ui.js?v=245';
import {createMapAgentActivation} from './map-agent-activation.js?v=245';
import {GAME_MODES,usesDraft,createDraft,selectParticipants,draftCountry,pickDraftAgent,advanceNpcDraft,reorderTeam} from './game-setup.js?v=245';
import {draftScreen,draftCandidate} from './draft-ui.js?v=245';
import {agentTravelPickerMarkup,deploymentPickerMarkup,assignDeployment} from './deployment.js?v=245';
import {refreshCountryInquiry,handleInquiryCommand,handleInquiryChange} from './country-inquiry.js?v=245';
import {setRecruitFilter,resetRecruitFilters,toggleRecruitSelection,updateRecruitFaces,isRecruitPortrait,recruitDetails} from './recruit-selection.js?v=245';
import {aiDifficultyControl,AI_LEVELS} from './ai-difficulty.js?v=245';
let setupDifficulty='bb2',setupMode='regular',setupDraft=null,setupConfirmed=false,setupDraftCandidate=null,setupMap=null;
import {selectOrderTarget} from './order-targets.js?v=245';
import {patchNotesPage} from './patch-notes.js?v=245';
let menuPage='home',multiplayerPage='';
import './report-tooltips.js?v=245';
import {createInquiryTracker} from './inquiry-notifications.js?v=245';
import {campaignRules} from './campaign-rules.js?v=245';
import {patchOrderDialog} from './order-dialog.js?v=245';
import {setGraphicsQuality} from './graphics.js?v=245';
import {forgetLegacyCampaign,readCampaign} from './save-compat.js?v=245';
import {canDeleteCampaignSlot,createBrowserCampaignStore,createCampaignSaves,firstFreeCampaignSlot,isCampaignSlot,latestCampaignSlot} from './campaign-slots.js?v=245';
import {saveScreen,saveSlotPicker,saveConfirmation,saveDeletionConfirmation} from './save-ui.js?v=245';
import {endingScreen,mountEnding} from './ending-ui.js?v=245';
import {wikiPanel,wikiResults} from './wiki.js?v=245';
import {sortTable} from './data-tables.js?v=245';
import {startClock,elapsedMs,formatDuration,clockMarkup} from './campaign-clock.js?v=245';
import {selectTechnology,technologyCancellationMarkup} from './technology-ui.js?v=245';
import {campaignSummary} from './campaign-stats.js?v=245';
import {missionCards,missionRevealMarkup,revealDelay} from './mission-reveal.js?v=245';
import {cooperationRules} from './cooperation.js?v=245';
import {bindBackdropDismiss,confirmInGame} from './dialog-behavior.js?v=245';
import {eventsGuide} from './events-ui.js?v=245';
import {prestigeHistory} from './prestige.js?v=245';
import {Multiplayer} from './multiplayer.js?v=245';
import {mainMenu,optionPage,menuChromeMarkup,menuSkyMarkup,menuMotionReduced,mountMenuEarth,mountMenuIntro,slideMenuPage} from './main-menu.js?v=245';
import {initMusic,setMusic,nextTrack} from './music.js?v=245';
import {suspectProfile} from './fracture-profiles.js?v=245';
import {investigationSnapshot,investigationHighlights,milestoneBanner} from './milestones.js?v=245';
import {trackExperience,resetExperience,paintResourceFeedback,settingsMarkup,applyPreferences,updatePreference,playCue,dismissNotices} from './experience.js?v=245';
import {stageSignal,turnSignals,orderFeedback,paintSignals,clearSignals} from './feedback.js?v=245';
import {selectGovernmentFavor} from './command-ui.js?v=245';
import {proofTitle} from './intelligence.js?v=245';
import {missionCostsMarkup,missionTimingMarkup,missionBoostLabel,forecastMarkup,caseBrief} from './operations-ui.js?v=245';
import {agentMenuActions,locationActions,actionOptions,actionEffects,actionResources,actionUnavailable,countryOptions,progressMarkup} from './presentation.js?v=245';
import {syncCameraTurn,createCamera,mountMap,focusCountry,renderMap} from './map.js?v=245';
import {gameShell} from './shell.js?v=245';
import {COUNTRIES,COUNTRY,DISPLAY_ROSTER as ROSTER,ROSTER as FULL_ROSTER,DEFAULT_TEAM_IDS,TALENTS,STAT_NAMES,ACTIONS,CELLS,TECH} from './data.js?v=245';
import * as E from './engine.js?v=245';
import {esc,icon,button,flag,nationalities,nationalityFlags,portrait,statlines,talents,fatigue,brand,formatScore,countryOption,countrySelect} from './ui.js?v=245';
import {setupScreen,makeScreens} from './screens.js?v=245';
let inquiryStorage;try{inquiryStorage=localStorage;}catch{}
const inquiryTracker=createInquiryTracker(inquiryStorage);
const inquiryRoom=()=>isTutorial(state)?'tutorial:'+state.tutorial.mission:multiplayer.active?multiplayer.details?.id||'multi':'solo';
const camera=createCamera();let stopMap=()=>{},stopHud=()=>{},stopEnding=()=>{},menuOpen=true;
let menuView=null,stopMenuIntro=()=>{},menuNavigating=false;
const $=s=>document.querySelector(s),app=$('#app'),modal=$('#modal'),pc=globalThis.shadowMandatePC;
const hoverNavigation=matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)');
let navigationPointer=null,navigationNear=false,navigationFrame=0;
function pointerWithin({left,top,right,bottom},margin){
 const {x,y}=navigationPointer;
 return x>=left-margin&&x<=right+margin&&y>=top-margin&&y<=bottom+margin;
}
function syncNavigationProximity(){
 const nav=app.querySelector('.deck-nav');
 const team=app.querySelector('.field-team');
 if(team){
  const near=navigationPointer&&hoverNavigation.matches
   &&pointerWithin(team.getBoundingClientRect(),team.hasAttribute('data-pointer-near')?38:20);
  team.toggleAttribute('data-pointer-near',!!near);
 }
 if(!nav)return;
 if(!navigationPointer||!hoverNavigation.matches){
  navigationNear=false;
  nav.removeAttribute('data-pointer-near');
  return;
 }
 const {left,top,right,bottom}=nav.getBoundingClientRect();
 const margin=navigationNear?38:20;
 const fullWidth=Number.parseFloat(getComputedStyle(nav).getPropertyValue('--atlas-rail-width'))||0;
 const edge=navigationNear?Math.max(right,left+fullWidth):right;
 navigationNear=pointerWithin({left,top,right:edge,bottom},margin);
 nav.toggleAttribute('data-pointer-near',navigationNear);
}
window.addEventListener('pointermove',event=>{
 if(event.pointerType!=='mouse')return;
 navigationPointer={x:event.clientX,y:event.clientY};
 if(!navigationFrame)navigationFrame=requestAnimationFrame(()=>{
  navigationFrame=0;
  syncNavigationProximity();
 });
},{passive:true});
function clearNavigationPointer(){
 navigationPointer=null;
 syncNavigationProximity();
}
document.documentElement.addEventListener('pointerleave',clearNavigationPointer);
window.addEventListener('blur',clearNavigationPointer);
hoverNavigation.addEventListener('change',syncNavigationProximity);
const saves=createCampaignSaves(pc??createBrowserCampaignStore(E.validateSave),E.validateSave,
 ()=>readCampaign(inquiryStorage,E.validateSave),()=>forgetLegacyCampaign(inquiryStorage));
let campaignWriteError=false,saveCandidate=null,saveCommandPending=false;
let workspace=null;
let wikiCategory='qg',wikiQuery='',wikiReturnView='world',reportTab='overview',reportCountry=null;
let tutorialProgress=readTutorialProgress(inquiryStorage),campaignBeforeTutorial=null,tutorialGuideCollapsed=readPreference('sigma2040-tutorial-minimized','false')==='true';
let state=null,view='world',selectedCountry='DE',selectedAgent=null,setupCountry='FR',setupAgents=[],setup=true,world=[],order={},saveWarning=false;
const multiplayer=new Multiplayer({
 modal:showModal,toast,render,close:()=>modal.close(),
 openEntry(html){
  const changing=menuView?.page==='multiplayer';
  multiplayerPage=html;
  void showMenuPage('multiplayer',changing?'.mp-entry-tabs [aria-pressed="true"]':'#multiplayerTitle');
 },
 lobby(html){workspace?.clear();stopMap();stopHud();modal.close();document.body.classList.remove('map-open');renderMenuView('lobby',html);},
 state(next,previous){const before=previous?investigationSnapshot(previous):null;state=next;menuOpen=false;setup=false;if(!previous){view='world';selectedCountry=next.player;selectedAgent=null;camera.k=1.65;focusCountry(camera,next.player);resetExperience();clearSignals();}if(previous&&next.player!==previous.player){selectedAgent=null;selectedCountry=next.player;clearSignals();modal.close();}if(next.ended&&!previous){ending();return;}render();if(next.multiplayer?.observer&&!next.ended){if(previous&&next.turn!==previous.turn)modal.close();return;}if(previous&&(next.turn!==previous.turn||next.ended!==previous.ended)){modal.close();const highlights=investigationHighlights(before,next);turnSignals(next,previous.turn);showReveals(()=>showHighlights(highlights,returnToCommand));}},
 async leave(){
  state=await saves.load();setup=!state;
  if(menuView?.page!=='lobby'){showMainMenu();return;}
  const previous=previousMenuPage();
  if(previous==='multiplayer')multiplayer.entry();
  else void showMenuPage(previous);
 }
});
const menuParents={options:'home',settings:'options',rules:'options',saves:'options','patch-notes':'options',
 'new-game':'home',setup:'new-game',multiplayer:'new-game',tutorials:'new-game',lobby:'home'};
const menuHistory=[];
const menuFocus={
 home:'.main-menu [data-cmd="new"]',options:'#optionsTitle',settings:'#settingsTitle',rules:'.rules-page h1',
 saves:'#saveDialogTitle','patch-notes':'.patch-notes-page h1','new-game':'#newGameTitle',
 setup:'.setup-shell h2',multiplayer:'#multiplayerTitle',tutorials:'.training-menu h1'
};

function previousMenuPage(){
 return menuHistory.at(-1)??menuParents[menuView?.page]??'home';
}

function renderMenuView(page,markup){
 stopMenuIntro();
 stopMenuIntro=()=>{};
 const from=menuView?.page;
 if(page==='home')menuHistory.length=0;
 else if(from&&from!==page){
  if(previousMenuPage()===page)menuHistory.pop();
  else menuHistory.push(from);
 }
 if(!menuView){
  app.innerHTML='<div class="menu-scene" aria-hidden="true">'+menuSkyMarkup()+'</div>'+menuChromeMarkup(!!pc)+'<div class="menu-viewport"></div>';
  const scene=app.querySelector('.menu-scene');
  const chrome=app.querySelector('.menu-chrome');
  menuView={scene,chrome,content:app.querySelector('.menu-viewport'),earth:mountMenuEarth(scene,page),
   build:chrome.querySelector('.menu-build'),back:chrome.querySelector('[data-cmd="menu-back"]')};
 }
 menuView.page=page;
 if(page!=='options')menuView.chrome.append(menuView.back);
 menuView.build.hidden=page!=='home'&&page!=='options';
 if(!pc)menuView.build.title=translateText('Voir la mise à jour sur GitHub');
 menuView.back.hidden=page==='home';
 menuView.back.classList.toggle('options-back',page==='options');
 menuView.back.lastElementChild.textContent=translateText('Retour');
 menuView.earth.face(page);
 setLocalizedHTML(menuView.content,markup);
 if(page==='options')menuView.content.querySelector('.menu-panel nav').append(menuView.back);
}

function clearMenuView(){
 if(!menuView)return;
 stopMenuIntro();
 stopMenuIntro=()=>{};
 menuView?.earth.dispose();
 menuView=null;
 menuHistory.length=0;
}

async function navigateMenu(page,update,{focus}={}){
 if(menuNavigating)return;
 const previous=menuView;
 const from=previous?.page;
 const outgoing=previous?.content.firstElementChild;
 const animate=(page||outgoing)&&page!==from&&Element.prototype.animate&&!menuMotionReduced();
 function focusPage(){
  const target=focus&&app.querySelector(focus);
  if(!target)return;
  if(target.tabIndex<0)target.tabIndex=-1;
  target.focus({preventScroll:true});
 }
 if(!animate){update();focusPage();return;}

 menuNavigating=true;
 let changed=false;
 try{
  stopMenuIntro();
  if(outgoing){
   previous.content.inert=true;
   previous.chrome.inert=true;
   if(page)previous.earth.face(page);
   await slideMenuPage(outgoing,false);
   if(menuView!==previous||from!==menuView.page)return;
  }
  update();
  changed=true;
  const incoming=menuView?.content.firstElementChild;
  if(incoming&&!menuMotionReduced()){
   menuView.content.inert=true;
   menuView.chrome.inert=true;
   await slideMenuPage(incoming,true);
  }
 }finally{
  if(previous){previous.content.inert=false;previous.chrome.inert=false;}
  if(menuView){menuView.content.inert=false;menuView.chrome.inert=false;}
  menuNavigating=false;
  if(changed)focusPage();
 }
}

function showMenuPage(page,focus=menuFocus[page]){
 return navigateMenu(page,()=>{
  modal.close();
  menuOpen=page!=='setup';
  if(menuOpen)menuPage=page;
  else setup=true;
  render();window.scrollTo(0,0);app.scrollTop=0;
 },{focus});
}
function showMainMenu(){
 void showMenuPage('home');
}
function menuMarkup(){
 switch(menuPage){
  case 'tutorials':return tutorialMenu(tutorialProgress);
  case 'patch-notes':return patchNotesPage();
  case 'new-game':return newGameMenu();
  case 'multiplayer':return multiplayerPage;
  case 'settings':return optionPage(settingsMarkup(),'settings-page');
  case 'rules':return optionPage(wikiPanel(wikiCategory,wikiQuery),'rules-page');
  case 'saves':return optionPage(saveScreenMarkup(),'saves-page');
 }
 const slots=saves.slots;
 const saveStatus=slots.some(({previous})=>previous.status==='ready')?'Campagne à récupérer'
  :slots.some(({current})=>current.status==='invalid')?'Sauvegarde illisible'
  :slots.every(({current})=>current.status==='unavailable')?'Sauvegarde inaccessible':'';
 return mainMenu(state,{options:menuPage==='options',desktop:!!pc,saveStatus});
}
function persist(){
 if(multiplayer.active||!state)return;
 if(isTutorial(state)){
  try{tutorialProgress=saveTutorialProgress(inquiryStorage,state,tutorialProgress);saveWarning=false;}
  catch{saveWarning=true;toast('Progression de formation non enregistrée. Gardez cette page ouverte.');}
  return;
 }
 return saves.update(state).then(()=>{campaignWriteError=false;}).catch(()=>{
  campaignWriteError=true;
  toast('L’enregistrement de la campagne a échoué.');
 });
}
function leaveTutorial(){if(!isTutorial(state))return;persist();clearTimeout(showReveals.timer);revealSession=null;cinematic=null;state=campaignBeforeTutorial;campaignBeforeTutorial=null;setup=!state;view='world';selectedAgent=null;saveWarning=false;clearSignals();resetExperience();}
function launchTutorial(id,restart=false){workspace?.clear();clearTimeout(toast.timer);$('#toast').classList.remove('show');$('#toast').textContent='';if(multiplayer.active){toast('Quittez le salon pour commencer une formation.');return;}if(!tutorialMission(id))return;if(isTutorial(state))persist();else campaignBeforeTutorial=state;const saved=tutorialProgress.sessions[id];state=!restart&&saved&&!tutorialObjective(saved).done&&!tutorialObjective(saved).failed?structuredClone(saved):createTutorialGame(id);if(isCompactTutorial(state)&&!saved)tutorialGuideCollapsed=false;menuOpen=false;setup=false;view='world';selectedCountry=state.tutorial.mission==='contact'&&state.agents[0].country==='FR'?'FR':(state.factions.FR.known.s0?.country||Object.values(state.factions.FR.known)[0]?.country||'FR');selectedAgent=null;Object.assign(camera,{mode:'globe',k:1.65,panelOpen:true});focusCountry(camera,selectedCountry);resetExperience();clearTimeout(showReveals.timer);revealSession=null;cinematic=null;modal.close();clearSignals();persist();render();window.scrollTo(0,0);app.querySelector('#tutorialObjectiveTitle')?.focus({preventScroll:true});}
function toast(msg){clearTimeout(orderFeedback.timer);$('#toast').textContent=translateText(msg);$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>{const notice=$('#toast');notice.classList.remove('show');notice.textContent='';},4500);}
function change(fn){try{fn();persist();render();return true;}catch(e){toast(e.message);return false;}}
function render(){workspace?.refresh();refreshCountryInquiry();stopMap();stopHud();stopEnding();if(state){if(!countryOnMap(state,selectedCountry))selectedCountry=state.player;syncCameraTurn(camera,state,inquiryRoom());}if(multiplayer.active&&multiplayer.snapshot?.phase!=='playing'){multiplayer.panel();return;}if(menuOpen){document.body.classList.remove('map-open');renderMenuView(menuPage,menuMarkup());return;}document.body.classList.toggle('map-open',camera.expanded&&!setup&&view==='world');if(setup){const content=setupDraft?draftScreen(setupDraft,setupCountry,{agents:setupAgents,confirmed:setupConfirmed,candidate:setupDraftCandidate,controls:`<div class="setup-game-options">${aiDifficultyControl(setupDifficulty,false,false)}</div>`}):setupScreen(setupCountry,setupAgents,!!state,null,setupDifficulty,setupMode,setupMap?.countries??false);renderMenuView('setup',content);return;}clearMenuView();if(!multiplayer.active&&!state.campaignClock){startClock(state,Date.now(),state.turn>1||!!state.ended);persist();}if(!isTutorial(state))trackExperience(state);if(view==='ending'&&state.ended){clearTimeout(showReveals.timer);revealSession=null;cinematic=null;modal.close();document.body.classList.remove('map-open');app.innerHTML=endingScreen(state,{tab:reportTab,country:reportCountry||state.player});localizeContent(app);stopEnding=mountEnding(app);return;}app.innerHTML=gameShell(state,view,(view==='archives'?`<header class="campaign-panel-heading archive-heading"><h1>${icon('people')} Statistiques des agents</h1><div class="archive-actions">${state.ended?button('Retour au bilan','ending'):''}${button('Journal des événements','nav','','data-id="journal"')}</div></header><div id="campaign-report">${campaignSummary(state,{country:reportCountry||state.player,tab:reportTab})}</div>`:view==='wiki'?wikiPanel(wikiCategory,wikiQuery,{closeable:true})+wikiUtilities():makeScreens(state,selectedCountry,selectedAgent,world,camera,workspace.readOnlyReason())[view]()),isTutorial(state)?saveWarning:campaignWriteError,view==='world'?'':renderMap(state,selectedCountry,world,camera),inquiryTracker.count(state,inquiryRoom()),inquiryTracker.dismissed(state,inquiryRoom()));
 if(navigationNear)app.querySelector('.deck-nav').setAttribute('data-pointer-near','');
 if(isTutorial(state)){app.querySelector('.immersive-deck').insertAdjacentHTML('beforeend',tutorialGuide(state,tutorialGuideCollapsed));markTutorialControls(app,state,{selectedCountry});}localizeContent(app);multiplayer.decorate();stopMap=mountMap(camera,()=>camera.panelOpen?selectedCountry:null,render);paintResourceFeedback();const header=app.querySelector('.deck-header'),deck=app.querySelector('.immersive-deck');const ticker=header.querySelector('.news-ticker');const status=app.querySelector('.mp-status'),fieldTeam=app.querySelector('.field-team'),objectiveStrip=app.querySelector('.objective-strip');const positionHud=()=>{const top=Math.ceil(Math.max(header.getBoundingClientRect().bottom,ticker?.getBoundingClientRect().bottom||0)+12);deck.style.setProperty('--mp-top',top+'px');const guide=app.querySelector('.tutorial-guide');if(guide)guide.style.top=top+'px';const hudTop=Math.max(top,status?Math.ceil(status.getBoundingClientRect().bottom)+12:0,guide?Math.ceil(guide.getBoundingClientRect().bottom)+10:0);deck.style.setProperty('--hud-top',hudTop+'px');
 syncNavigationProximity();
 if(fieldTeam){
  const objective=objectiveStrip?.getBoundingClientRect();
  const objectiveClearance=objective?.height?Math.ceil(window.innerHeight-objective.top)+8:0;
  deck.style.setProperty('--objective-clearance',objectiveClearance+'px');
 }
};positionHud();const resizeHud=new ResizeObserver(positionHud);resizeHud.observe(header);if(ticker)resizeHud.observe(ticker);if(status)resizeHud.observe(status);const guide=app.querySelector('.tutorial-guide');if(guide)resizeHud.observe(guide);
 if(fieldTeam){resizeHud.observe(fieldTeam);if(objectiveStrip)resizeHud.observe(objectiveStrip);window.addEventListener('resize',positionHud);}
 stopHud=()=>{resizeHud.disconnect();if(fieldTeam)window.removeEventListener('resize',positionHud);};}
function showModal(html,cls=''){delete modal.dataset.orderAgent;modal.className=cls;modal.innerHTML=`${revealSession||cinematic?'':button(icon('close'),'close','modal-close','aria-label="Fermer"')}${html}`;const title=modal.querySelector('#deploymentDialogTitle,#saveDialogTitle,#settingsTitle,#expressOrderTitle');if(title)modal.setAttribute('aria-labelledby',title.id);else if(['deploymentDialogTitle','saveDialogTitle'].includes(modal.getAttribute('aria-labelledby')))modal.removeAttribute('aria-labelledby');localizeContent(modal);if(!modal.open)modal.showModal();}
const mapCountryActivation=createMapAgentActivation(id=>{if(!state||!countryOnMap(state,id)||setup||menuOpen)return;selectedAgent=null;selectedCountry=id;camera.panelOpen=true;focusCountry(camera,id);view='world';render();},id=>workspace?.country(id));
const mapAgentActivation={click:id=>openAgent(id),cancel(){}};
function agentPager(id){const team=E.team(state),i=team.findIndex(a=>a.id===id);return `<nav class="agent-pager" aria-label="Comparer les agents">${button('‹','agent','',`data-id="${team[(i+team.length-1)%team.length].id}" aria-label="Agent précédent"`)}<span>${i+1} / ${team.length}</span>${button('›','agent','',`data-id="${team[(i+1)%team.length].id}" aria-label="Agent suivant"`)}</nav>`;}
function openAgent(id,type=null,target=null,useCredits=false){if(type){openOrder(id,type,target,useCredits);return;}const a=state?.agents.find(a=>a.id===id);if(!a||setup||menuOpen)return;if(multiplayer.observer&&a.faction!==state.player)multiplayer.observe(a.faction);camera.panelOpen=true;modal.close();selectedAgent=id;selectedCountry=a.country;focusCountry(camera,selectedCountry);view='world';render();}
function openOrder(id,type=null,target=null,useCredits=false){if(multiplayer.observer){agentJournal(id);return;}selectedAgent=id;const a=state.agents.find(a=>a.id===id);if(!a)return;if(a.faction!==state.player){view='agents';render();return;}if(view==='agents')render();if(a.status==='captured'){showModal(`<div class="simple-modal">${agentPager(a.id)}<span class="eyebrow">AGENT RETENU</span><h2>${a.name} ${nationalityFlags(a)}</h2><p>Votre agent est détenu en ${COUNTRY[a.country].name}. Envoyez un coéquipier dans ce pays, puis choisissez « Extraire un agent capturé ».</p><p>Le poste reste occupé jusqu’à sa libération.</p>${button('Voir le pays','map-country','primary','data-id="'+a.country+'"')}</div>`);return;}
 if(a.task){showModal(`<div class="simple-modal">${agentPager(a.id)}<span class="eyebrow">OPÉRATION ${a.task.queued?'PLANIFIÉE':'EN COURS'}</span><h2>${a.name} ${nationalityFlags(a)}</h2><h3>${ACTIONS[a.task.type].name}</h3><p><strong>${a.task.chance} % de réussite</strong></p><p>${a.task.remaining} tour(s) restant(s). ${E.travelInProgress(a)?'Le déplacement est commencé : il ne peut plus être annulé.':'Une annulation abandonne la progression et libère l’agent.'}</p>${(E.travelInProgress(a)?'<span class="muted">Déplacement en cours · non annulable</span>':button('Annuler cette opération','cancel','primary','data-id="'+a.id+'"'))}</div>`);return;}
 const preferred=a.country===selectedCountry?'contacts':'travel',allowed=agentMenuActions(a,state),suggested=allowed.some(([key])=>key===preferred)&&!actionUnavailable(state,a,preferred)?preferred:allowed.find(([key])=>!actionUnavailable(state,a,key))?.[0]||preferred;order={useCredits,id,contextType:type,type:type||suggested,target:target||selectedCountry};orderModal();}
function showOrderModal(html,agentId){
 if(patchOrderDialog(modal,html,agentId))return;
 showModal(html,'order-modal');modal.dataset.orderAgent=agentId;
 modal.querySelector('[autofocus]')?.focus({preventScroll:true});
}
function orderModal(){const a=state.agents.find(a=>a.id===order.id),allowed=locationActions(a,state).filter(([id])=>id===order.contextType||agentMenuActions(a,state).some(([key])=>key===id));if(!allowed.some(([id])=>id===order.type))order.type=allowed[0][0];const d=ACTIONS[order.type];let list=[];if(['travel','sneak','cyberSupport'].includes(order.type))list=mapCountries(state).filter(c=>c.id!==a.country&&(!c.power||c.id===a.faction)&&(order.type!=='cyberSupport'||!c.power)).map(c=>[c.id,c.name]);else if(['collect','surveil','hack','prepare','arrest','intimidate'].includes(order.type))list=E.knownTargets(state).filter(t=>!t.arrested&&t.country===a.country).map(t=>[t.id,`${t.name} · ${COUNTRY[t.country].name}${order.type==='intimidate'?' · '+(t.intimidated?'0/1 restante':'1/1 restante'):order.type==='prepare'&&t.prepared?' · Déjà préparée':''}`]);else if(order.type==='analyze')list=E.evidenceQueue(state,state.player).filter(e=>!E.analysisAgent(state,state.player,e.id)).map(e=>{const p=state.proofs.find(p=>p.id===e.id),t=state.suspects.find(t=>t.id===p.suspect);return [e.id,proofTitle(p)+' · '+t.name];});else if(order.type==='rescue')list=E.rescueTargets(state,state.player).filter(b=>b.country===a.country).map(b=>[b.id,b.name]);
 if(order.type==='drone')list=[['','Tous les suspects du pays']];
 ({list,target:order.target}=selectOrderTarget(state,a.id,order.type,list,order.target));
 const normal=E.options(state,a.id,order.type,order.target),reinforced=E.options(state,a.id,order.type,order.target,true);
 const guaranteed=tutorialGuaranteed(state),canShowBoost=!d.safe&&!guaranteed;
 if(!canShowBoost||normal.boostGain===0||reinforced.error)order.useCredits=false;
 const o=order.useCredits?reinforced:normal,blocked=workspace?.readOnlyReason()||o.error;
 const travel=['travel','sneak'].includes(order.type);
 const compact=!!order.contextType&&!travel;
 const actionPicker=`<label>Action<select id="orderType" ${!compact&&!list.length?'autofocus':''}>${actionOptions(allowed,order.type,state,a,order.target)}</select></label>`;
 const proof=state.proofs.find(p=>p.id===order.target);
 const targetLabel=order.type==='analyze'?'Pièce à vérifier · '+(state.suspects.find(t=>t.id===proof?.suspect)?.name||''):order.type==='cyberSupport'?'Pays soutenu':travel?'Destination':'Cible';
 const countryTarget=travel||order.type==='cyberSupport';
 const targetOptions=travel?countryOptions(order.target,a.country,false,a.faction,state):list.map(([id,name,reason])=>{
  const label=name+(reason?' · '+reason:''),selected=id===order.target;
  return countryTarget?countryOption(id,label,{selected,disabled:!!reason})
   :`<option value="${esc(id)}" ${reason?'disabled':''} ${selected?'selected':''}>${esc(label)}</option>`;
 }).join('');
 const targetPicker=countryTarget?countrySelect(targetOptions,'id="orderTarget" autofocus')
  :`<select id="orderTarget" autofocus>${targetOptions}</select>`;
 const boost=canShowBoost?`<div class="mission-boost-control"><label class="mission-boost-toggle">
  <input type="checkbox" id="orderCredits" ${order.useCredits?'checked':''} ${reinforced.error||normal.boostGain===0||blocked?'disabled':''}>
  ${missionBoostLabel(normal,reinforced,state.factions[state.player].budget)}</label>
  ${reinforced.error&&!blocked?`<small class="mission-boost-reason">${esc(reinforced.error)}</small>`:''}</div>`:'';
 const training=isTutorial(state)?`<p class="training-order-note">${guaranteed?'Formation scénarisée : cette opération réussira à 100 %. En campagne, les chances dépendent des agents et de la situation.':'Formation en conditions réelles : les chances affichées s’appliquent. Un échec et ses conséquences restent possibles.'}</p>`:'';
 const feedback=blocked?`<p class="notice warning express-order-feedback" id="orderBlockReason" role="status">${icon('lock')} ${esc(blocked)}</p>`:'';
 showOrderModal(`<div class="order-layout"><section class="order-form" aria-labelledby="expressOrderTitle">
  <header class="express-order-heading">
   <div><span class="eyebrow">Ordre express · ${esc(COUNTRY[a.country].city)}</span><h2 id="expressOrderTitle">${esc(d.name)}</h2></div>
   <div class="express-order-agent">${portrait(a)}<strong>${esc(a.name)}</strong></div>
  </header>
  <div class="express-order-body">
   ${training}
   ${!compact||list.length?`<div class="express-order-fields">
    ${compact?'':actionPicker}
    ${list.length?`<label>${esc(targetLabel)}${targetPicker}</label>`:''}
   </div>`:''}
   ${actionResources(order.type,a)}
   ${o.clandestine?'<div class="notice warning">Intervention sans mandat : risque de blessure, capture ou décès accru.</div>':''}
   <div class="mission-quick-metrics">${missionCostsMarkup(state,a.id,order.type,order.target)}</div>
   <details class="mission-briefing" id="orderDetails">
    <summary id="orderDetailsSummary" ${compact&&!list.length?'autofocus':''}>Détails</summary>
    <div class="mission-briefing-content">
     ${compact?actionPicker:''}
     ${actionEffects(order.type)}
     <div class="order-checks"><p>${icon('scan')} Stat mobilisée <strong>${d.safe?'Aucune · réussite automatique':STAT_NAMES[o.stat]+' · '+a.stats[o.stat]}</strong></p>${o.explanations.map(x=>`<p class="modifier">${icon('plus')} ${esc(x)}</p>`).join('')}</div>
     ${forecastMarkup(state,a.id,order.type,order.target)}
     <p class="action-description">${esc(d.desc)}</p>
     ${canShowBoost?'<p class="muted">L’ordre commencera lorsque vous terminerez le tour. Le renfort facultatif est payé immédiatement, puis remboursé si vous annulez l’ordre avant le début de la mission.</p>':''}
    </div>
   </details>
  </div>
  <footer class="express-order-footer">
   ${feedback}
   <div class="express-order-estimate" aria-label="Prévision de la mission"><span><strong aria-label="Chances de réussite : ${o.chance} %">${o.chance} %</strong> <small>de réussite</small></span>${missionTimingMarkup(a,order.type,o,{showEnergy:false})}${o.cost?`<small class="mission-credit-cost">${o.cost} crédits</small>`:''}</div>
   ${boost}
   ${button(`${icon('check')} Confirmer l’ordre`,'confirm-order','primary',`id="orderConfirm" ${blocked?'disabled aria-describedby="orderBlockReason"':''}`)}
  </footer>
 </section></div>`,a.id);
}
function deploy(type='travel',target=selectedCountry){
 if(['travel','sneak'].includes(type)){showModal(deploymentPickerMarkup(state,type,target));return;}
 const location=E.rescueTargets(state,state.player).find(t=>t.id===target)?.country||E.knownTargets(state).find(t=>t.id===target)?.country||COUNTRY[target]?.id;
 const ready=E.team(state).filter(a=>!a.task&&a.status!=='captured'&&locationActions(a,state).some(([id])=>id===type)&&(!location||['analyze','cyberSupport'].includes(type)||a.country===location));
 showModal(`<div class="simple-modal action-assignment">
  <span class="eyebrow">AFFECTATION</span><h2>Choisir un agent</h2>
  <p class="order-budget">Crédits disponibles <strong>${state.factions[state.player].budget}</strong></p>
  ${ready.length?ready.map(a=>`<button class="agent-picker" data-cmd="pick-agent" data-id="${a.id}" data-type="${type}" data-target="${target||''}">${portrait(a)}<div><strong>${a.name}</strong><span>${COUNTRY[a.country].city} · ${E.fatigueName(a.fatigue)}</span></div>${icon('chevron')}</button>`).join(''):'<p>Aucun agent disponible au lieu requis. Déployez un agent dans le pays de la cible, ou libérez un analyste au QG pour vérifier une pièce.</p>'}
 </div>`);
}
async function confirmDeployment(){
 if(multiplayer.observer)throw Error('Observateur : consultation uniquement.');
 const picker=modal.querySelector('.deployment-picker'),confirm=picker?.querySelector('[data-cmd="confirm-deployment"]');if(!picker||confirm.disabled)return;
 const ids=[...picker.querySelectorAll('[name="deployAgent"]:checked')].map(input=>input.value),type=picker.dataset.deploymentType,target=picker.dataset.deploymentTarget;
 const names=ids.map(id=>state.agents.find(a=>a.id===id)?.name||id);confirm.disabled=true;
 try{if(multiplayer.active)await multiplayer.command('deploy',{ids,type,target});else{assignDeployment(state,ids,type,target);for(const id of ids)stageSignal(state.agents.find(a=>a.id===id));persist();render();}modal.close();toast(`${names.join(', ')} : déploiement vers ${COUNTRY[target].name} confirmé.`);}catch(e){confirm.disabled=false;throw e;}
}
let lastAgentClick={id:null,time:0};
function agentJournal(id){const a=state.agents.find(a=>a.id===id);if(!a||!state.ended&&a.faction!==state.player)return;const reports=(state.operationReports||[]).filter(r=>r.agentId===id||!r.agentId&&(!r.faction||r.faction===a.faction)&&r.agent===a.name).slice(0,12),logs=E.visibleLogs(state).filter(l=>(!l.faction||l.faction===a.faction)&&l.text.includes(a.name)).slice(0,12);showModal(`<div class="simple-modal agent-journal"><span class="eyebrow">JOURNAL DE L’AGENT</span><h2>${esc(a.name)}</h2><p>${esc(a.role)} · ${COUNTRY[a.country].name}</p><h3>Opérations</h3>${reports.length?reports.map(r=>`<article class="decision-box"><strong>T${r.turn} · ${esc(ACTIONS[r.type]?.name||r.type)}</strong> <span class="tag ${r.status==='RÉUSSITE'?'good':r.status==='ÉCHEC'?'danger':''}">${esc(r.status)}</span><p>${r.notes.map(esc).join(' · ')||esc(r.next)}</p></article>`).join(''):'<p>Aucune opération terminée.</p>'}<h3>Transmissions</h3>${logs.length?logs.map(l=>`<p><strong>T${l.turn}</strong> · ${esc(l.text)}</p>`).join(''):'<p>Aucune transmission consignée.</p>'}</div>`);}
function proofModal(id){const entry=state.factions[state.player].evidence.find(e=>e.id===id);if(!entry)return;const p=state.proofs.find(p=>p.id===id),target=E.knownTargets(state).find(t=>t.id===p.suspect),agent=E.analysisAgent(state,state.player,id);showModal(`<div class="simple-modal"><span class="eyebrow">REGISTRE DES PREUVES</span><h2>${esc(proofTitle(p))}</h2><span class="tag ${entry.contested?'danger':entry.verified?'good':''}">${entry.contested?'ÉCARTÉE':entry.verified?'VÉRIFIÉE':agent?'EN VÉRIFICATION':'À VÉRIFIER'}</span><p>${entry.contested?'Les sources indépendantes ont invalidé cette pièce. Elle ne compte pas pour une arrestation.':entry.verified?'Pièce vérifiée. Elle contribue au dossier d’arrestation.':agent?`${esc(agent.name)} examine cette pièce : ${agent.task.remaining} tour(s) restant(s).`:'Pièce reçue, authenticité non établie. Affectez un analyste au QG.'}</p><div class="suspect-actions">${target?button('Dossier de '+esc(target.name),'suspect','small',`data-id="${target.id}"`):''}${!entry.contested&&!entry.verified&&!agent?button('Affecter une vérification','verify','primary',`data-id="${id}"`):''}</div></div>`);}

let revealSession=null;
function showReveals(done){const items=missionCards(state);if(!items.length){done();return;}clearTimeout(showReveals.timer);revealSession={items,index:0,done,revealed:false};paintReveal();}
function paintReveal(revealed=false){
 clearTimeout(showReveals.timer);
 const r=revealSession;if(!r)return;
 const current=r.items[r.index],delay=revealDelay(current),automatic=current.type==='automatic-summary';
 revealed=revealed||delay===0;r.revealed=revealed;
 const scope=['cell','attack','threat','postponement'].includes(current.type)?'Bilan mondial':'Bilan de votre équipe';
 showModal((automatic?'':debriefNavigation(scope))+missionRevealMarkup(current,r.index,r.items.length,revealed,state.agents.find(a=>a.id===current.agentId),state),
  automatic?'mission-reveal-dialog automatic-reveal-dialog':'mission-reveal-dialog');
 if(!revealed)showReveals.timer=setTimeout(()=>{if(revealSession===r&&modal.open&&modal.classList.contains('mission-reveal-dialog'))paintReveal(true);},delay);
}
function finishReveals(){clearTimeout(showReveals.timer);const done=revealSession?.done;revealSession=null;done?.();}
let cinematic=null;
function showHighlights(items,done,index=0){if(!items.length){done();return;}cinematic={items,index,done};playCue('discovery');showModal(debriefNavigation('Temps forts')+milestoneBanner(items[index],index,items.length),'milestone-dialog');}
function finishHighlights(){if(!cinematic)return;const done=cinematic.done;cinematic=null;done();}
function debriefNavigation(scope){return `<div class="debrief-navigation"><strong>${scope}</strong>${button('Passer','debrief-skip','small','title="Passer le débriefing"')}</div>`;}
function returnToCommand(){
 if(state.ended){ending();return;}
 if(state.event&&!isTutorial(state)){eventModal();return;}
 modal.close();
 if(isTutorial(state))render();
}
function eventModal(){const ev=state.event;if(!ev)return;showModal(`<div class="dialogue-modal"><div class="dialogue-portrait">${portrait(ROSTER[0])}<span>CANAL PRIVÉ / 04</span></div><div class="dialogue-copy"><span class="eyebrow">COMMUNICATION ENTRANTE</span><h2>${ev.title}</h2><div class="speech-bubble"><strong>${ev.speaker}</strong><p>${ev.text}</p></div><div class="dialogue-consult">${button(icon('world')+' Consulter le jeu avant de répondre','consult-game','wide')}<small>La communication reste en attente. Le tour n’avance pas.</small></div><div class="dialogue-options">${ev.choices.map((c,i)=>{const reason=E.eventChoiceUnavailable(state,i);return `<button data-cmd="event" data-id="${i}" ${reason?'disabled':''}><span>0${i+1}</span><div><strong>${c.label}</strong><small>${c.detail}</small>${reason?`<small class="disabled-reason">${esc(reason)}</small>`:''}</div>${icon('chevron')}</button>`;}).join('')}</div></div></div>`,'dialogue-shell');}
function ending(){clearTimeout(showReveals.timer);revealSession=null;cinematic=null;modal.close();view='ending';reportTab='overview';reportCountry=state.player;render();}
function recruitModal(){
 const pending=state.recruitments.filter(r=>r.faction===state.player);
 const candidates=E.recruitmentCandidates(state);
 const needsReplace=E.team(state).length+pending.length>=4;
 const relievable=E.team(state).filter(a=>!a.task&&a.country===state.player&&a.status!=='captured');
 const blocked=!!state.ended||needsReplace&&!relievable.length;
 showModal(`<div class="simple-modal"><span class="eyebrow">BUREAU DE RECRUTEMENT</span><h2>Renforts & relève</h2><p>Le recrutement est gratuit et prend deux tours. Votre unité reste limitée à quatre postes.</p>${pending.map(r=>`<p class="notice">${icon('clock')} ${esc(FULL_ROSTER.find(a=>a.id===(r.templateId||r.id))?.name||r.id)} est recruté · arrivée dans ${r.remaining} tour(s).</p>`).join('')}${needsReplace?`<label>Agent relevé au QG<select id="replaceAgent"><option value="">Choisir un agent disponible au QG</option>${relievable.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label><p class="muted">La relève est définitive. Les agents capturés conservent leur poste.</p>`:''}${state.ended?'<p class="notice warning">La campagne est terminée.</p>':needsReplace&&!relievable.length?'<p class="notice warning">Aucun agent disponible au QG pour une relève.</p>':''}${candidates.length?candidates.map(a=>`<div class="recruit-option">${portrait(a)}<div><h3>${esc(a.name)} ${nationalityFlags(a)}</h3><p>${esc(a.role)}</p>${statlines(a)}${button('Recruter · gratuit','hire','small',`data-id="${a.id}" ${blocked?'disabled':''}`)}</div></div>`).join(''):'<p>La réserve disponible est épuisée.</p>'}<p id="recruitError" class="notice warning" role="alert" hidden></p></div>`);
}
function recruitFailure(error){const message=$('#recruitError');if(message){message.textContent=translateText(error.message);message.hidden=false;}else toast(error.message);}
function beginSoloSetup(mode){
 modal.close();menuOpen=false;resetRecruitFilters('solo');setupAgents=[];setupMode=mode;
 setupMap=null;setupDraft=null;setupConfirmed=false;setupDraftCandidate=null;setup=true;render();window.scrollTo(0,0);
}
function help(){showModal(settingsMarkup(),'settings-dialog');}
function toggleWiki(){
 modal.close();
 if(view==='wiki')view=wikiReturnView;
 else{wikiReturnView=view;view='wiki';}
 render();
 app.querySelector('[data-cmd="open-wiki"]')?.focus({preventScroll:true});
}
function wikiUtilities(){if(isTutorial(state))return `<section class="panel wiki-utilities"><h2>Votre formation</h2><div class="command-shortcuts">${button('Briefing de la mission','tutorial-help','small')}${button('Dernier débriefing','reveal-replay','small')}${button('Choisir une mission','tutorial-menu','small')}</div><p>Progression enregistrée séparément. Votre campagne est conservée.</p></section>`;return `<section class="panel wiki-utilities"><h2>Votre campagne</h2><div class="command-shortcuts">${button('Briefing','briefing','small')}${(state?.turnActivities?.length||state?.cellReports?.length||state?.attackReports?.length||state?.threatReports?.length||state?.attackDelayReports?.length)?button('Dernier débriefing','reveal-replay','small'):''}${multiplayer.active?'':button('Sauvegardes','save-menu','small')}</div></section>`;}

function saveScreenMarkup(){
 return saveScreen(saves.slots,{activeSlot:saves.activeSlot,writeError:campaignWriteError});
}

function showSaveModal(markup){
 showModal(markup,'save-dialog');
 $('#saveDialogTitle')?.focus({preventScroll:true});
}

async function openSaveScreen(){
 if(multiplayer.active||saveCommandPending||openSaveScreen.pending)return;
 const fullPage=menuOpen,origin=menuOpen?menuPage:view;
 openSaveScreen.pending=true;
 try{
  await saves.refresh();
  if(multiplayer.active||saveCommandPending||menuOpen!==fullPage||(menuOpen?menuPage:view)!==origin)return;
  saveCandidate=null;
  if(fullPage)await showMenuPage('saves','#saveDialogTitle');
  else showSaveModal(saveScreenMarkup());
 }finally{openSaveScreen.pending=false;}
}

function activateCampaign(campaign){
 modal.close();
 return navigateMenu(null,()=>{
  workspace?.clear();resetExperience();clearSignals();
  clearTimeout(showReveals.timer);revealSession=null;cinematic=null;
  state=campaign;menuOpen=false;setup=false;view='world';reportCountry=null;
  selectedAgent=null;selectedCountry=campaign.player;camera.k=1.65;focusCountry(camera,selectedCountry);
  campaignWriteError=false;
  if(campaign.ended)ending();else render();
 });
}

async function saveOperation(operation,button,failure='La sauvegarde a changé ou n’a pas pu être enregistrée.'){
 if(saveCommandPending)return;
 saveCommandPending=true;
 if(button)button.disabled=true;
 try{await operation();}
 catch{toast(failure);}
 finally{
  saveCommandPending=false;
  if(button?.isConnected)button.disabled=false;
 }
}

async function applySaveChoice({ campaign, action, slot, expected, recoveryRaw }){
 try{await saves.replace(campaign,slot,expected,recoveryRaw);}
 catch(error){
  if(action==='new'){
   await saves.refresh();
   saveCandidate={action,campaign};
   showSaveModal(saveSlotPicker(saves.slots));
  }
  throw error;
 }
 saveCandidate=null;
 await activateCampaign(campaign);
 if(action==='new')toast('Commandement établi. Le briefing est disponible depuis le bouton « ? ».');
 if(action==='restore')toast('Copie de récupération restaurée.');
}

function chooseSaveSlot(slot){
 if(!saveCandidate?.campaign||!isCampaignSlot(slot))return;
 const record=saves.slots[slot];
 if(record.current.status==='unavailable'||record.previous.status==='unavailable')return;
 const expected=saveCandidate.action==='restore'?record.current.raw??null:{...record};
 saveCandidate={...saveCandidate,slot,expected};
 showSaveModal(saveConfirmation(saveCandidate,record));
}

function previewRecovery(slot){
 const entry=saves.slots[slot]?.previous;
 if(entry?.status!=='ready')return;
 saveCandidate={action:'restore',campaign:E.validateSave(JSON.parse(entry.raw)),recoveryRaw:entry.raw};
 chooseSaveSlot(slot);
}

function previewSaveDeletion(slot){
 if(multiplayer.active||!isCampaignSlot(slot))return;
 const expected=saves.slots[slot];
 if(!canDeleteCampaignSlot(expected))return;
 saveCandidate={action:'delete',slot,expected};
 showSaveModal(saveDeletionConfirmation(slot,expected,!menuOpen&&slot===saves.activeSlot));
}

function returnToSaveScreen(){
 saveCandidate=null;
 if(menuOpen){
  modal.close();
  render();
  $('#saveDialogTitle')?.focus({preventScroll:true});
 }else showSaveModal(saveScreenMarkup());
}

async function deleteSave({slot,expected}){
 let wasActive;
 try{wasActive=await saves.remove(slot,expected);}
 catch(error){
  await saves.refresh();
  returnToSaveScreen();
  throw error;
 }
 if(wasActive){
  workspace?.clear();resetExperience();clearSignals();
  clearTimeout(showReveals.timer);revealSession=null;cinematic=null;
  state=saves.select(latestCampaignSlot(saves.slots));
  setup=!state;view='world';selectedAgent=null;campaignWriteError=false;
 }
 if(wasActive&&!menuOpen){
  saveCandidate=null;
  await showMenuPage('saves','#saveDialogTitle');
 }else returnToSaveScreen();
 toast('Sauvegarde supprimée.');
}

function startCampaign(button){
 if(!setupDraft&&(!setupMap||setupAgents.length!==4))return;
 if(usesDraft(setupMode)&&(!setupDraft||draftCountry(setupDraft)||!setupConfirmed)){
  toast('Terminez le repêchage et confirmez votre équipe.');return;
 }
 void saveOperation(async()=>{
  const draftOptions={gameMode:setupMode,participants:setupDraft?.countries,teams:{...setupDraft?.teams,[setupCountry]:[...setupAgents]}};
  const campaign=E.createConfiguredGame(setupCountry,setupAgents,setupDraft?.seed??setupMap.seed,setupDifficulty,
   setupDraft?draftOptions:{gameMode:'regular',participants:setupMap.participants});
  await saves.refresh();
  const slot=firstFreeCampaignSlot(saves.slots);
  if(slot>=0){await applySaveChoice({campaign,action:'new',slot,expected:{...saves.slots[slot]}});return;}
  saveCandidate={campaign,action:'new'};
  showSaveModal(saveSlotPicker(saves.slots));
 },button);
}

function resumeSaveSlot(slot,button){
 if(!isCampaignSlot(slot)||multiplayer.active)return;
 void saveOperation(async()=>{
  const visible=saves.slots[slot]?.current;
  await saves.refresh();
  if(visible?.raw!==saves.slots[slot]?.current.raw)throw Error('Campaign slot changed');
  const campaign=saves.select(slot);
  if(campaign){saveCandidate=null;await activateCampaign(campaign);}
 },button);
}

function nextTurn(){if(finishTurn.pending)return;if(state.ended){ending();return;}if(isTutorial(state)){const pending=tutorialPendingOrders(state);if(!tutorialObjective(state).unguided&&pending.length&&state.agents.some(a=>a.task)){showModal(`<div class="simple-modal"><h2>Des actions peuvent avancer en parallèle</h2><p>Affectez les autres agents disponibles avant de terminer le tour.</p><ul>${pending.map(o=>`<li>${esc(state.agents.find(a=>a.id===o.agentId).name)} · ${esc(ACTIONS[o.type].name)}${o.optional?' (soutien facultatif)':''}</li>`).join('')}</ul><div class="suspect-actions">${button('Compléter les ordres','close','primary')}${button('Terminer quand même','advance-confirm')}</div></div>`);return;}finishTurn();return;}if(state.ended){ending();return;}if(multiplayer.active&&multiplayer.me?.ready){multiplayer.command('ready',{ready:false}).catch(e=>toast(e.message));return;}if(state.ended){ending();return;}if(state.event){eventModal();return;}const idle=E.team(state).filter(a=>!a.task&&a.status!=='captured');if(idle.length){showModal(`<div class="simple-modal"><span class="eyebrow">CONFIRMER LA FIN DU TOUR</span><h2>${idle.length} agent(s) sans ordre</h2><p>${idle.map(a=>a.name).join(', ')} resteront inactifs. Ils ne récupéreront pas de fatigue sans ordre de repos.</p><div class="suspect-actions">${button('Revenir aux ordres','close')}${button('Terminer quand même','advance-confirm','primary')}</div></div>`);}else finishTurn();}
async function finishTurn(){
 if(multiplayer.active){modal.close();multiplayer.command('ready',{ready:true}).catch(e=>toast(e.message));return;}
 if(finishTurn.pending)return;
 finishTurn.pending=true;
 try{
  const turn=state.turn,before=investigationSnapshot(state);
  clearSignals();E.advance(state);const highlights=investigationHighlights(before,state);
  await persist();
  render();turnSignals(state,turn);
  if(isCompactTutorial(state)){modal.close();return;}
  showReveals(()=>showHighlights(highlights,returnToCommand));
 }catch(e){toast(e.message);}
 finally{finishTurn.pending=false;}
}
document.addEventListener('click',event=>{
 const confirmed=event.target.closest('[data-cmd="confirm-government"]');if(confirmed){const o=E.governmentOptions(state,'diplomacy',confirmed.dataset.id);if(multiplayer.observer||o.error||o.cost!==Number(confirmed.dataset.cost)){event.stopImmediatePropagation();modal.close();toast(o.error||'La situation a changé. Vérifiez à nouveau la démarche.');}return;}
 const el=event.target.closest('[data-cmd="government-favor"][data-id="diplomacy"]');if(!el||el.disabled)return;
 event.stopImmediatePropagation();if(multiplayer.observer)return;
 const country=$('#governmentCountry')?.value,o=E.governmentOptions(state,'diplomacy',country);
 if(o.error){toast(o.error);return;}
 showModal(`<div class="simple-modal"><h2>Confirmer la démarche diplomatique</h2><h3>${flag(country)} ${COUNTRY[country].name}</h3><p>Coût : <strong>${o.cost} confiance</strong></p><p>Augmenter la coopération d’un niveau.</p><div class="suspect-actions">${button('Annuler','close')}${button('Valider','confirm-government','primary',`data-id="${country}" data-cost="${o.cost}"`)}</div></div>`);
});
// Route every multiplayer mutation through the authoritative host, including host UI actions.
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-cmd]');if(!el||el.disabled)return;const cmd=el.dataset.cmd,id=el.dataset.id;
 if(isTutorial(state)&&['mp-entry','new','new-mode','new-confirm','start','save-menu','save-restore','save-delete','save-resume'].includes(cmd)){event.stopImmediatePropagation();toast('Revenez au menu principal pour gérer votre campagne ou le multijoueur.');return;}
 if(cmd.startsWith('mp-')){event.stopImmediatePropagation();multiplayer.handle(cmd,id).catch(e=>toast(e.message));return;}
 if(cmd==='confirm-deployment'){event.stopImmediatePropagation();confirmDeployment().catch(e=>toast(e.message));return;}
 if(!multiplayer.active)return;
 if(multiplayer.observer){if(['deploy','travel','agent-rest','recruit','confidence','government-favor','tech','tech-drone','confirm-order','cancel','confirm-cancel','cancel-tech','confirm-cancel-tech','cancel-cyber','confirm-cancel-cyber','hire','event','request-accept','request-decline','advance-confirm'].includes(cmd)){event.stopImmediatePropagation();toast('Observateur : consultation uniquement.');return;}}
 if(['new','new-mode','new-confirm','start','resume','save-menu','save-restore','save-delete','save-resume'].includes(cmd)){event.stopImmediatePropagation();toast('Quittez la session depuis le salon pour ouvrir une campagne solo.');return;}
 const mutations={
  'confirm-order':['assign',()=>({id:order.id,type:order.type,target:order.target||null,useCredits:!!order.useCredits})],
  'confirm-cancel':['cancel',()=>({id})], 'confirm-cancel-tech':['cancel-tech',()=>({id})], 'confirm-cancel-cyber':['cancel-cyber',()=>({country:id})],'confirm-government':['government-favor',()=>({type:'diplomacy',country:id})],'government-favor':['government-favor',()=>({type:id,country:$('#governmentCountry')?.value||null})],tech:['tech',()=>({type:id,country:$('#guardCountry')?.value||selectedCountry})],
  'request-accept':['request',()=>({plot:id,accept:true})], 'request-decline':['request',()=>({plot:id,accept:false})],
  event:['event',()=>({index:Number(id)})],hire:['hire',()=>({id,replaceId:$('#replaceAgent')?.value||null})]
 };
 if(mutations[cmd]){event.stopImmediatePropagation();if(cmd==='confirm-order'&&modal.dataset.orderAgent!==order.id){toast('Sélection de l’agent modifiée : rouvrez son ordre.');return;}const [kind,payload]=mutations[cmd];multiplayer.command(kind,payload()).then(()=>{if(kind==='tech'||kind==='assign'&&order.type==='drone'){selectTechnology(null);render();}if(kind==='cancel'||kind==='cancel-tech')clearSignals();if(kind==='hire'&&revealSession)paintReveal();else modal.close();if(kind==='hire')toast('Recrutement confirmé. Le poste affichera la recrue en attente pendant deux tours.');if(kind==='share')toast('Échange transmis. Un joueur humain doit accepter votre proposition.');}).catch(e=>kind==='hire'?recruitFailure(e):toast(e.message));}
},true);
document.addEventListener('change',event=>{
 if(event.target.id==='deploymentMode'||event.target.id==='deploymentDestination'){
  const picker=event.target.closest('.deployment-picker');
  if(!picker)return;
  const modeChanged=event.target.id==='deploymentMode';
  const type=modeChanged?event.target.value:picker.dataset.deploymentType;
  const target=modeChanged?picker.dataset.deploymentTarget:event.target.value;
  if(!['travel','sneak'].includes(type))return;
  const selected=[...picker.querySelectorAll('[name="deployAgent"]:checked')].map(input=>input.value);
  showModal(deploymentPickerMarkup(state,type,target,selected));
  modal.querySelector('#'+event.target.id)?.focus();return;
 }

 if(event.target.name==='deployAgent'){const picker=event.target.closest('.deployment-picker'),count=picker.querySelectorAll('[name="deployAgent"]:checked').length;picker.querySelector('#deploymentCount').textContent=translateText(`${count} agent${count>1?'s':''} sélectionné${count>1?'s':''}`);const confirm=picker.querySelector('[data-cmd="confirm-deployment"]');confirm.disabled=!count;confirm.textContent=translateText(count?`Déployer ${count} agent${count>1?'s':''}`:'Déployer les agents');return;}
 if(event.target.dataset.recruitFilter){const {recruitMode,recruitFilter}=event.target.dataset,id=event.target.id;setRecruitFilter(recruitMode,recruitFilter,event.target.type==='checkbox'?event.target.checked:event.target.value);render();document.getElementById(id)?.focus();return;}
 if(event.target.name==='mpAgent'){const count=document.querySelectorAll('[name="mpAgent"]:checked').length;document.querySelector('#mpTeamCount').textContent=translateText(`${count} / 4 agents sélectionnés`);document.querySelector('[data-cmd="mp-team"]').disabled=count!==4;}
 if(event.target.id==='mpObserveCountry')multiplayer.observe(event.target.value);
 if(event.target.id==='mpChooseCountry')multiplayer.command('country',{country:event.target.value}).catch(e=>toast(e.message));
 if(event.target.id==='mpImport'){const file=event.target.files[0];if(!file)return;if(file.size>5000000){toast('Fichier trop volumineux.');return;}file.text().then(async text=>{if(multiplayer.hasSave()&&!await confirmInGame('Remplacer la sauvegarde multijoueur locale par ce fichier ?'))return;return multiplayer.resume(JSON.parse(text));}).catch(e=>toast(e.message));}
});
document.addEventListener('click',event=>{const el=event.target.closest('[data-cmd]');if(!el||el.disabled||menuNavigating||saveCommandPending||finishTurn.pending)return;const cmd=el.dataset.cmd,id=el.dataset.id;if(cmd!=='map-agent')mapAgentActivation.cancel();if(cmd!=='map-country')mapCountryActivation.cancel();if(cmd.startsWith('workspace-')||['country-inquiry','country-threat','suspect'].includes(cmd)||cmd.startsWith('inquiry-')&&el.closest('[data-workspace-window]')){workspace.command(cmd,id,el).catch(e=>toast(e.message));return;}switch(cmd){
 case 'rescue-captive':deploy('rescue',id);break;
 case 'dismiss-attack-delays':dismissAttackDelays(state);render();break;
 case 'inquiry-step':case 'inquiry-substep':case 'country-threat':case 'inquiry-open-agent':case 'country-inquiry':case 'inquiry-action':case 'inquiry-agent':case 'inquiry-boost':case 'inquiry-effects':case 'inquiry-confirm':handleInquiryCommand(cmd,id);break;
 case 'patch-notes':void showMenuPage('patch-notes');break;
 case 'tutorial-menu':if(isTutorial(state))leaveTutorial();void showMenuPage('tutorials');break;
 case 'tutorial-start':void navigateMenu(null,()=>launchTutorial(id));break;
 case 'tutorial-guide-toggle':tutorialGuideCollapsed=!tutorialGuideCollapsed;writePreference('sigma2040-tutorial-minimized',String(tutorialGuideCollapsed));render();break;
 case 'tutorial-restart':showModal(`<div class="simple-modal"><h2>Recommencer cette mission ?</h2><p>Seul cet exercice revient à son état de départ. Vos autres missions et votre campagne sont conservées.</p><div class="suspect-actions">${button('Continuer l’exercice','close')}${button('Recommencer','tutorial-restart-confirm','primary')}</div></div>`);break;
 case 'tutorial-restart-confirm':if(isTutorial(state))launchTutorial(state.tutorial.mission,true);break;
 case 'tutorial-help':if(isTutorial(state))showModal(`<div class="simple-modal"><span class="eyebrow">FORMATION / FILIGRANE</span><h2>${esc(tutorialMission(state.tutorial.mission).title)}</h2><p>${esc(tutorialMission(state.tutorial.mission).brief)}</p><h3>À faire maintenant</h3><p>${esc(tutorialHint(state))}</p><h3>À retenir</h3><p>${esc(tutorialMission(state.tutorial.mission).lesson)}</p><p>Affectez les agents disponibles en parallèle, confirmez leurs ordres, puis terminez le tour. Les missions de plusieurs tours continuent automatiquement. Vous pouvez annuler un ordre avant son départ.</p><p>${esc(tutorialRiskNote(state))}</p>${button('Reprendre','close','primary')}</div>`);break;
 case 'menu-back':
  if(menuView?.page==='lobby'&&multiplayer.active)multiplayer.handle('mp-leave').catch(e=>toast(e.message));
  else if(menuView&&menuView.page!=='home')void showMenuPage(previousMenuPage());
  break;
 case 'main-menu':if(multiplayer.active){multiplayer.handle('mp-leave').catch(e=>toast(e.message));break;}if(isTutorial(state))leaveTutorial();showMainMenu();break;
 case 'continue-game':if(state)void navigateMenu(null,()=>{menuOpen=false;setup=false;if(state.ended)ending();else render();});break;
 case 'settings':if(menuOpen)void showMenuPage('settings');else help();break;
 case 'options':void showMenuPage('options');break;
 case 'rules':void showMenuPage('rules');break;
 case 'save-menu':void openSaveScreen();break;
 case 'save-resume':resumeSaveSlot(Number(id),el);break;
 case 'save-restore':previewRecovery(Number(id));break;
 case 'save-delete':previewSaveDeletion(Number(id));break;
 case 'save-delete-cancel':returnToSaveScreen();break;
 case 'save-delete-confirm':if(saveCandidate?.action==='delete')void saveOperation(()=>deleteSave(saveCandidate),el,'La sauvegarde a changé ou n’a pas pu être supprimée.');break;
 case 'save-slot-select':chooseSaveSlot(Number(id));break;
 case 'save-commit':if(saveCandidate?.campaign&&isCampaignSlot(saveCandidate.slot))void saveOperation(()=>applySaveChoice(saveCandidate),el);break;
 case 'quit-game':pc?.quit();break;
 case 'settings-tab':{
  const settings=el.closest('.settings-modal');
  if(!settings?.querySelector('[data-settings-panel="'+id+'"]'))break;
  for(const panel of settings.querySelectorAll('[data-settings-panel]'))panel.hidden=panel.dataset.settingsPanel!==id;
  for(const tab of settings.querySelectorAll('[data-cmd="settings-tab"]'))tab.setAttribute('aria-pressed',String(tab.dataset.id===id));
  break;
 }
 case 'music-next':nextTrack();break;
 case 'ai-difficulty':if(!setupDraft&&Object.hasOwn(AI_LEVELS,id)){setupDifficulty=id;render();}break;
 case 'country':if(!setupDraft&&setupCountry!==id){setupCountry=id;setupMap=null;setupAgents=[];render();}break;
 case 'solo-confirm-country':if(!setupDraft&&!setupMap){const seed=Date.now();if(usesDraft(setupMode)){setupDraft=advanceNpcDraft(createDraft([setupCountry],seed,setupMode));setupAgents=[];setupConfirmed=false;}else{const participants=selectParticipants([setupCountry],seed);setupMap={seed,participants,countries:selectOperationMap(participants,seed,'regular')};}render();}break;
 case 'solo-draft-preview':if(setupDraft&&draftCandidate(setupDraft,setupCountry,id)){setupDraftCandidate=id;render();}break;
 case 'solo-draft-confirm':if(setupDraft&&draftCandidate(setupDraft,setupCountry,setupDraftCandidate)){try{pickDraftAgent(setupDraft,setupCountry,setupDraftCandidate);setupDraftCandidate=null;advanceNpcDraft(setupDraft);if(!draftCountry(setupDraft))setupAgents=[...setupDraft.teams[setupCountry]];render();}catch(e){toast(e.message);}}break;
 case 'solo-draft-chief':case 'solo-draft-before':case 'solo-draft-after':if(setupDraft&&!draftCountry(setupDraft)){setupAgents=reorderTeam(setupAgents,id,cmd.split('-').at(-1));setupConfirmed=false;render();}break;
 case 'solo-confirm-team':if(setupDraft&&!draftCountry(setupDraft)&&setupAgents.length===4){setupConfirmed=true;render();}break;
 case 'select-recruit':if(usesDraft(setupMode)||!setupMap)break;if(!setupAgents.includes(id)&&setupAgents.length===4)toast('Désélectionnez un agent avant d’en choisir un autre.');else setupAgents=toggleRecruitSelection(setupAgents,id,'solo');render();break;
 case 'recruit-details':showModal(recruitDetails(id),'recruit-dossier-modal');break;
 case 'recruit-flip':updateRecruitFaces(document,el.dataset.recruitMode,id,!isRecruitPortrait(id,el.dataset.recruitMode));break;
 case 'recruit-view':updateRecruitFaces(document,el.dataset.recruitMode,null,id==='portrait');break;
 case 'start':startCampaign(el);break;
 case 'resume':menuOpen=false;setup=false;render();break;
 case 'new':void showMenuPage('new-game');break;
 case 'new-mode':if(Object.hasOwn(GAME_MODES,id))void navigateMenu('setup',()=>beginSoloSetup(id),{focus:menuFocus.setup});break;
 case 'nav':{
  const tab=el.classList.contains('deck-tab');
  if(tab&&event.pointerType==='mouse'){
   navigationPointer={x:event.clientX,y:event.clientY};
   navigationNear=true;
  }
  view=tab&&id===view?'world':id;
  inquiryTracker.read(state,inquiryRoom(),view);render();
  if(tab)app.querySelector(`.deck-tab[data-id="${CSS.escape(id)}"]`)?.focus({preventScroll:true});
  break;
 }
 case 'map-agent':mapAgentActivation.click(id);break;
 case 'map-country':mapCountryActivation.click(id);break;
 case 'agent':openAgent(id);break;
 case 'suggest-action':openOrder(id,el.dataset.type);break;
 case 'agent-rest':{
  const a=E.team(state).find(agent=>agent.id===id);
  if(a)workspace.country(a.country,{type:a.country===state.player?'rest':E.hasSafehouse(state,a.faction,a.country)?'fieldRest':'hide',agent:id});
  break;
 }
 case 'agent-journal':agentJournal(id);break;
 case 'select-agent':selectedAgent=id;render();document.querySelector('.personnel-member.selected')?.focus({preventScroll:true});break;
 case 'focus-map':if(camera.mode==='dome')camera.k=Math.max(1.65,camera.k);focusCountry(camera,selectedCountry);render();break;
 case 'deploy':deploy();break;
 case 'pick-agent':openAgent(id,el.dataset.type,el.dataset.target||null);break;
 case 'confirm-order':try{if(modal.dataset.orderAgent!==order.id)throw Error('Sélection de l’agent modifiée : rouvrez son ordre.');E.assign(state,order.id,order.type,order.target||null,order.useCredits);if(order.type==='drone')selectTechnology(null);stageSignal(state.agents.find(a=>a.id===order.id));persist();modal.close();render();clearTimeout(toast.timer);orderFeedback(state,order.id);}catch(e){toast(e.message);}break;
 case 'cancel':{const a=state.agents.find(a=>a.id===id);if(!a?.task||a.faction!==state.player)break;if(E.travelInProgress(a)){toast('Un déplacement commencé ne peut pas être annulé.');break;}showModal(`<div class="simple-modal"><span class="eyebrow">ANNULER L’OPÉRATION</span><h2>Libérer ${esc(a.name)} ?</h2><p>${ACTIONS[a.task.type].name} sera abandonnée. Aucun résultat futur ne sera produit par cet ordre.</p><p>L’agent sera immédiatement disponible.${a.task.bonusCredits?a.task.queued?' Le renfort non commencé sera remboursé : '+a.task.bonusCredits+' crédits.':' Le renfort de cette mission commencée reste consommé.':''}${ACTIONS[a.task.type].tech?' Le Module sera également libéré.':''}</p><div class="suspect-actions">${button('Garder l’ordre','close')}${button('Annuler l’opération','confirm-cancel','primary','data-id="'+id+'"')}</div></div>`);break;}
 case 'confirm-cancel':clearSignals();if(change(()=>E.cancel(state,id)))modal.close();break;
 case 'cancel-tech':{const t=state.factions[state.player].tech.find(t=>t.id===id&&t.until>=state.turn);if(t)showModal(technologyCancellationMarkup(state,t));break;}
 case 'cancel-cyber':if(COUNTRY[id])showModal(`<div class="simple-modal"><h2>Arrêter le hack d’un pays en ${COUNTRY[id].name} ?</h2><p>Votre source de hack sera arrêtée. Le bonus sera retiré des opérations encore en cours qui en dépendent, y compris celles du partenaire en coop. Une autre source active conservera le bonus. Les missions continueront.</p><p>${E.cyberSupportRefund(state.factions[state.player].cyberSupport[id])} crédit(s) seront remboursés. Ce soutien n’occupe aucun Module ni opérateur dédié.</p><div class="suspect-actions">${button('Conserver le soutien','close')}${button('Annuler et rembourser','confirm-cancel-cyber','primary','data-id="'+id+'"')}</div></div>`);break;
 case 'confirm-cancel-cyber':if(change(()=>E.cancelCyberSupport(state,id)))modal.close();break;
 case 'confirm-cancel-tech':if(change(()=>E.cancelTech(state,id)))modal.close();break;
 case 'tech-select':{const main=app.querySelector('.deck-main'),scroll=main?.scrollTop||0;selectTechnology(id);render();const next=app.querySelector('.deck-main');if(next)next.scrollTop=scroll;break;}
 case 'tech-drone':{const agentId=$('#consoleDroneAgent')?.value;if(agentId)openAgent(agentId,'drone',null);break;}
 case 'advance':nextTurn();break;
 case 'advance-confirm':finishTurn();break;
 case 'debrief-skip':clearTimeout(showReveals.timer);revealSession=null;cinematic=null;returnToCommand();break;
 case 'milestone-next':if(cinematic){const {items,index,done}=cinematic;if(index+1<items.length)showHighlights(items,done,index+1);else finishHighlights();}break;
 case 'milestone-skip':finishHighlights();break;
 case 'close':if(!revealSession&&!cinematic)modal.close();break;
 case 'consult-game':modal.close();render();break;
 case 'communication':eventModal();break;
 case 'suspect':handleInquiryCommand('country-inquiry',id);break;
 case 'mission-target':{const t=E.knownTargets(state).find(t=>t.id===id),next=E.nextOperation(state,t);deploy(next.type||'surveil',next.type==='analyze'?null:next.type==='contacts'?t.country:id);break;}
 case 'verify':deploy('analyze',id||null);break;
 case 'confirm-government':change(()=>E.requestGovernmentFavor(state,'diplomacy',id));modal.close();break;
 case 'government-select':selectGovernmentFavor(el);break;
 case 'government-favor':change(()=>E.requestGovernmentFavor(state,id,$('#governmentCountry')?.value||null));break;
 case 'national':modal.close();view='government';render();break;
 case 'tech':{const before=investigationSnapshot(state);if(change(()=>{E.activateTech(state,id,$('#guardCountry')?.value||selectedCountry);selectTechnology(null);}))showHighlights(investigationHighlights(before,state),()=>modal.close());break;}

 case 'request-accept':change(()=>E.answerRequest(state,id,true));break;
 case 'request-decline':change(()=>E.answerRequest(state,id,false));break;
 case 'event':try{const before=investigationSnapshot(state);E.answerEvent(state,Number(id));persist();modal.close();render();showHighlights(investigationHighlights(before,state),()=>modal.close());}catch(e){toast(e.message);}break;
 case 'reveal-now':paintReveal(true);break;
 case 'reveal-next':if(revealSession){if(++revealSession.index<revealSession.items.length)paintReveal();else finishReveals();}break;
 case 'reveal-skip':finishReveals();break;
 case 'reveal-replay':showReveals(()=>modal.close());break;
 case 'ending-report':clearTimeout(showReveals.timer);revealSession=null;cinematic=null;modal.close();$('#campaign-report')?.scrollIntoView({behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('#campaign-report')?.focus({preventScroll:true});break;
 case 'campaign-archives':modal.close();menuOpen=false;setup=false;view='archives';reportTab='agents';reportCountry=state.player;render();break;
 case 'ending':ending();break;
 case 'recruit':recruitModal();break;
 case 'hire':try{E.recruit(state,id,$('#replaceAgent')?.value||null);persist();render();if(revealSession)paintReveal();else modal.close();toast('Recrutement confirmé. Le poste affichera la recrue en attente pendant deux tours.');}catch(e){recruitFailure(e);}break;
 case 'briefing':if(isTutorial(state)){showModal(`<div class="simple-modal"><h2>${esc(tutorialMission(state.tutorial.mission).title)}</h2><p>${esc(tutorialMission(state.tutorial.mission).brief)}</p><p>${esc(tutorialObjective(state).text)}</p>${button('Reprendre','close','primary')}</div>`);break;}showModal(`<div class="simple-modal"><h2>Briefing initial</h2><p>Deux pistes connues. Envoyez vos agents dans les pays concernés et gardez un analyste au QG. Ouvrez un accès, recueillez deux preuves et vérifiez-les. Préparez l’arrestation, obtenez un mandat et localisez la cible avant d’intervenir.</p>${button('Prendre le commandement','close','primary')}</div>`);break;
 case 'open-wiki':toggleWiki();break;
 case 'help':help();break;
 case 'test-sound':playCue('discovery');break;
 case 'dismiss-feedback':dismissNotices();render();break;
 case 'proof':proofModal(id);break;
 }});
document.addEventListener('change',event=>{if(workspace?.change(event.target))return;handleInquiryChange(event.target);if(event.target.id==='graphicsQuality')setGraphicsQuality(event.target.value);if(event.target.id==='musicEnabled'){setMusic('enabled',event.target.checked);$('#musicVolume').disabled=!event.target.checked;event.target.closest('.settings-modal').querySelector('[data-cmd="music-next"]').disabled=!event.target.checked;}if(event.target.id==='feedbackSound'){updatePreference('sound',event.target.checked);$('#feedbackVolume').disabled=!event.target.checked;event.target.closest('.settings-modal').querySelector('[data-cmd="test-sound"]').disabled=!event.target.checked;if(event.target.checked)playCue();}if(event.target.id==='feedbackMotion')updatePreference('motion',event.target.value);if(event.target.id==='showInfoBar')updatePreference('infoBar',event.target.checked);if(event.target.id==='mapSelect'){camera.panelOpen=true;selectedAgent=null;selectedCountry=event.target.value;focusCountry(camera,selectedCountry);render();}if(event.target.id==='orderType'){order.type=event.target.value;order.useCredits=false;orderModal();}if(event.target.id==='orderCredits'){order.useCredits=event.target.checked;orderModal();}if(event.target.id==='orderTarget'){order.target=event.target.value;orderModal();}});
app.addEventListener('contextmenu',event=>{
 if(!event.target.closest('.view-world'))return;
 event.preventDefault();
 mapCountryActivation.cancel();
 if(!camera.panelOpen&&!selectedAgent)return;
 selectedAgent=null;
 camera.panelOpen=false;
 render();
});
document.addEventListener('input',event=>{if(event.target.id==='musicVolume'){setMusic('volume',event.target.value);$('#musicVolumeValue').textContent=event.target.value+'%';}if(event.target.id==='feedbackVolume'){updatePreference('volume',event.target.value);$('#feedbackVolumeValue').textContent=event.target.value+'%';}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.map-pin-v2')){e.preventDefault();mapCountryActivation.click(e.target.dataset.id);}});
modal.addEventListener('cancel',e=>{if(revealSession||cinematic||saveCommandPending)e.preventDefault();});
modal.addEventListener('close',()=>{if(cinematic){finishHighlights();return;}const svg=document.querySelector('#strategicMap');if(svg)paintSignals(svg);});
bindBackdropDismiss(modal,()=>{if(!revealSession&&!cinematic&&!saveCommandPending)modal.close();});
async function loadMap(){try{const r=await fetch('./assets/world.json');if(!r.ok)throw Error('Carte indisponible.');world=await r.json();if(!menuOpen&&!setup)render();}catch(e){toast('Fond cartographique indisponible. Utilisez le sélecteur de pays.');}}
function registerTools(){const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();const common={type:'object',properties:{},additionalProperties:false};const entries=[{name:'read_sigma_multiplayer',title:'Lire le salon Sigma',description:'Lire les places, connexions et états prêts ; uniquement les renseignements du pays courant.',inputSchema:common,annotations:{readOnlyHint:true},execute(){return multiplayer.snapshot||{active:multiplayer.active,status:multiplayer.status};}},{name:'open_sigma_multiplayer',title:'Ouvrir une session multijoueur Sigma',description:'Créer un salon avec sauvegarde chez l’hôte, rejoindre une invitation ou reprendre la sauvegarde multijoueur locale. Ne démarre pas la campagne.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['host','join','resume']},name:{type:'string'},country:{type:'string',enum:COUNTRIES.filter(c=>c.power).map(c=>c.id)},invitation:{type:'string'}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(isTutorial(state))throw Error('Quittez la formation depuis le menu avant d’ouvrir un salon.');if(multiplayer.active)throw Error('Une session est déjà ouverte.');if(input.mode==='host'){if(multiplayer.hasSave())throw Error('Une sauvegarde multijoueur existe : reprenez-la ou confirmez son remplacement dans le menu.');await multiplayer.create(input.name||'Joueur',input.country||'FR');}else if(input.mode==='resume')await multiplayer.resume();else if(input.mode==='join')await multiplayer.connect(null,multiplayer.parseInvitation(input.invitation),input.name||'Joueur');else throw Error('Mode invalide.');return {active:multiplayer.active,status:multiplayer.status};}},{name:'start_sigma_multiplayer',title:'Lancer la campagne multijoueur',description:'L’hôte lance le salon avec au moins deux humains connectés ayant tous confirmé leur équipe ; les places restantes deviennent des PNJ.',inputSchema:common,annotations:{readOnlyHint:false},async execute(){return await multiplayer.command('start');}},{name:'read_sigma_campaign',title:'Lire la campagne Sigma',description:'Lire le tour, les agents et les renseignements connus du joueur. Ne révèle pas les secrets adverses.',inputSchema:common,annotations:{readOnlyHint:true},execute(){if(!state)throw Error('Aucune campagne commencée.');return E.publicState(state);}},{name:'stage_sigma_operation',title:'Affecter une opération',description:'Affecter gratuitement un ordre ; renfort facultatif de 6 crédits pour +10 points. Ne termine pas le tour.',inputSchema:{type:'object',properties:{agentId:{type:'string'},action:{type:'string',enum:Object.keys(ACTIONS).filter(id=>!ACTIONS[id].disabled)},target:{type:'string'},useCredits:{type:'boolean'}},required:['agentId','action'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!state||typeof input?.agentId!=='string'||!ACTIONS[input.action]||state.agents.find(a=>a.id===input.agentId)?.faction!==state.player)throw Error('Agent ou action invalide.');if(multiplayer.active){await multiplayer.command('assign',{id:input.agentId,type:input.action,target:input.target||null,useCredits:!!input.useCredits});return E.publicState(state);}E.assign(state,input.agentId,input.action,input.target||null,!!input.useCredits);stageSignal(state.agents.find(a=>a.id===input.agentId));persist();render();clearTimeout(toast.timer);orderFeedback(state,input.agentId);return E.publicState(state);}},{name:'advance_sigma_turn',title:'Terminer le tour',description:'En solo, termine le tour. En multijoueur, déclare le pays prêt ; la journée avance uniquement quand tous les humains sont prêts. Des agents peuvent rester inactifs.',inputSchema:common,annotations:{readOnlyHint:false},async execute(){if(!state)throw Error('Aucune campagne commencée.');if(isTutorial(state)){finishTurn();return E.publicState(state);}if(multiplayer.active){await multiplayer.command('ready',{ready:true});return E.publicState(state);}const turn=state.turn;clearSignals();E.advance(state);await persist();render();turnSignals(state,turn);returnToCommand();return E.publicState(state);}}];for(const tool of entries){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch(e){}}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
const pageTitle=document.title,pageDescription=$('meta[name="description"]'),description=pageDescription.content;
function applyLanguage(){
 document.documentElement.lang=gameLanguage();
 globalThis.shadowMandatePC?.setLanguage?.(gameLanguage());
 document.title=translateText(pageTitle);
 pageDescription.content=translateText(description);
}
document.addEventListener('change',event=>{
 if(event.target.id!=='gameLanguage'||!setGameLanguage(event.target.value))return;
 const settingsPage=menuOpen&&menuPage==='settings';
 applyLanguage();render();if(!settingsPage)help();$('#gameLanguage')?.focus();
});
async function initialize(){
 state=await saves.load();setup=!state;
 applyLanguage();applyPreferences();initMusic();render();
 const menu=app.querySelector('.main-menu:not(.options-menu)');
 if(menu&&!multiplayer.invitation())stopMenuIntro=mountMenuIntro(menu,menuView.scene.querySelector('.menu-earth'));
 loadMap();registerTools();
 try{if(!await multiplayer.restoreSession()&&multiplayer.invitation())multiplayer.entry();}
 catch(e){toast(e.message);multiplayer.entry('host');}
}
void initialize();

app.addEventListener('dragstart',event=>{const card=event.target.closest('[data-tech-drag]');if(!card||card.draggable===false||state?.ended||!event.dataTransfer)return;event.dataTransfer.setData('text/x-sigma-tech',card.dataset.techDrag);event.dataTransfer.effectAllowed='copy';});
app.addEventListener('dragover',event=>{const slot=event.target.closest('[data-tech-drop]');if(!slot||state?.ended||!event.dataTransfer?.types.includes('text/x-sigma-tech'))return;event.preventDefault();slot.classList.add('drag-over');});
app.addEventListener('dragleave',event=>{const slot=event.target.closest('[data-tech-drop]');if(slot&&!slot.contains(event.relatedTarget))slot.classList.remove('drag-over');});
app.addEventListener('dragend',()=>app.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over')));
app.addEventListener('drop',event=>{const slot=event.target.closest('[data-tech-drop]');if(!slot||state?.ended)return;event.preventDefault();slot.classList.remove('drag-over');const type=event.dataTransfer?.getData('text/x-sigma-tech');if(!['ai','relay','logistics'].includes(type))return;const confirm=app.querySelector('[data-tech-drag="'+type+'"] [data-cmd="tech"]');if(confirm&&!confirm.disabled)confirm.click();});

setInterval(()=>{if(state)document.querySelectorAll('[data-campaign-clock]').forEach(el=>{el.textContent=formatDuration(elapsedMs(state));});},1000);

document.addEventListener('click',event=>{
 const sort=event.target.closest('[data-sort-column]');if(sort){sortTable(sort);return;}
 const wikiTab=event.target.closest('[data-wiki-tab]');if(wikiTab){wikiCategory=wikiTab.dataset.wikiTab;wikiQuery='';render();document.getElementById('wiki-search')?.focus();return;}
 const report=event.target.closest('[data-report-tab]');if(report){reportTab=report.dataset.reportTab;document.querySelectorAll('[data-report-panel]').forEach(el=>el.hidden=el.dataset.reportPanel!==reportTab);document.querySelectorAll('[data-report-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el===report)));}
});
document.addEventListener('input',event=>{if(event.target.id==='wiki-search'){wikiQuery=event.target.value;setLocalizedHTML(document.getElementById('wiki-results'),wikiResults(wikiCategory,wikiQuery));}});
document.addEventListener('change',event=>{
if(state?.ended&&event.target.id==='report-country'&&Object.hasOwn(state.factions,event.target.value)){reportCountry=event.target.value;setLocalizedHTML(document.getElementById('campaign-report'),campaignSummary(state,{country:reportCountry,tab:reportTab}));}});

// Access the manual without changing campaign state or issuing an order.
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.code==='Space'&&!e.repeat&&!revealSession&&!cinematic&&state&&!setup&&!menuOpen&&!(multiplayer.active&&multiplayer.snapshot?.phase!=='playing')){e.preventDefault();toggleWiki();}});
document.addEventListener('change',e=>{const id=e.target.dataset.timelineToggle;if(id)document.querySelectorAll('[data-timeline-team]').forEach(row=>{if(row.dataset.timelineTeam===id)row.hidden=!e.target.checked;});});

document.addEventListener('change',event=>{
 const select=event.target;
 if(select.id!=='governmentCountry'||!state)return;
 const card=select.closest('.government-card'),panel=card.closest('.government-console');
 const {cost,error}=E.governmentOptions(state,'diplomacy',select.value);
 card.querySelector('[data-government-cost]').textContent=cost??'—';
 panel.querySelector('[data-cmd="government-select"][data-id="diplomacy"] [data-government-list-cost]').textContent=cost??'—';
 card.querySelector('[data-cmd="government-favor"]').disabled=!!error||multiplayer.observer||!!multiplayer.me?.ready;
 card.querySelector('.government-card-action>small').textContent=translateText(error||'');
});

document.addEventListener('click',event=>{const mark=event.target.closest('[data-timeline-detail]');if(mark){const detail=document.getElementById('timeline-detail');if(detail){detail.textContent=translateText(mark.dataset.timelineLabel)+' — '+translateText(mark.dataset.timelineDetail);document.querySelectorAll('.timeline-mark').forEach(b=>b.setAttribute('aria-pressed',String(b===mark)));}}});

document.addEventListener('click',event=>{const button=event.target.closest('[data-report-agent]');if(button){document.querySelectorAll('[data-agent-report]').forEach(card=>card.hidden=card.dataset.agentReport!==button.dataset.reportAgent);document.querySelectorAll('[data-report-agent]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}});

workspace=createGameWorkspace({
 state:()=>state,notify:toast,openAgent,selectCountry:id=>{selectedAgent=null;selectedCountry=id;camera.panelOpen=true;view='world';focusCountry(camera,id);render();},
 active:()=>!!state&&!setup&&!menuOpen&&!state.ended&&(!multiplayer.active||multiplayer.snapshot?.phase==='playing'),
 context:()=>inquiryRoom()+':'+state.seed+':'+state.player,
 deploy:id=>deploy('travel',id),
 travel:id=>showModal(agentTravelPickerMarkup(state,id)),
 showWorld:()=>{if(view!=='world'){view='world';render();}},
 readOnlyReason:()=>!state||setup||menuOpen?'Campagne inactive':state.ended?'Campagne terminée':multiplayer.active?(multiplayer.observer?'Observateur : consultation uniquement':multiplayer.me?.ready?'Tour confirmé : modifiez vos ordres pour agir':multiplayer.pending?'Confirmation de l’hôte en attente':multiplayer.status?'Connexion au salon indisponible':''):'',
 async assign(p){
  if(!state||state.agents.find(a=>a.id===p.id)?.faction!==state.player)throw Error('Agent indisponible.');
  if(multiplayer.active){await multiplayer.command('assign',p);if(p.type==='drone')selectTechnology(null);render();return;}
  E.assign(state,p.id,p.type,p.target||null,p.useCredits);
  if(p.type==='drone')selectTechnology(null);
  stageSignal(state.agents.find(a=>a.id===p.id));persist();render();
 }
});
