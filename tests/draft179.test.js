import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,COUNTRY,DISPLAY_ROSTER,ROSTER,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {selectParticipants,createDraft,draftCountry,pickDraftAgent,advanceNpcDraft,availableDraftAgents,validateDraft,reorderTeam} from '../dist/client/game-setup.js';
import {newRoom,joinRoom,execute,startRoom,roomView,restoreRoom,PROTOCOL} from '../dist/client/multiplayer-core.js';
import {Multiplayer} from '../dist/client/multiplayer.js';
import {setupScreen,makeScreens} from '../dist/client/screens.js';
import {draftScreen} from '../dist/client/draft-ui.js';
import {missionCostsMarkup} from '../dist/client/operations-ui.js';
import {missionCards,missionRevealMarkup} from '../dist/client/mission-reveal.js';
import {gameShell} from '../dist/client/shell.js';

const powers=COUNTRIES.filter(c=>c.power).map(c=>c.id),token=i=>'draft-player-token-0000000'+i;
function lobby(count=2,observer=false){const r=newRoom('draft-room-00000000000179','draft-invite-00000000179',token(0),'Hôte','FR');if(observer)send(r,r.members[0],'observer',{observer:true});for(let i=1;i<count+(observer?1:0);i++)joinRoom(r,{invite:r.invite,token:token(i),name:'Joueur '+i});return r;}
function send(r,m,kind,payload={}){return execute(r,m.token,{protocol:PROTOCOL,seq:m.lastSeq+1,turn:r.game?.turn,kind,payload});}
function begin(r){send(r,r.members[0],'game-mode',{mode:'advanced'});for(const m of r.members.filter(m=>!m.observer))send(r,m,'confirm-country');send(r,r.members[0],'begin-draft');return r;}
function finish(r){while(r.phase==='draft'){const c=draftCountry(r.draft),m=r.members.find(m=>m.country===c);assert.ok(m);send(r,m,'draft-pick',{id:availableDraftAgents(r.draft)[0].id});}return r;}
function advancedGame(seed=42){const d=advanceNpcDraft(createDraft(['FR'],seed));while(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}return E.createConfiguredGame('FR',d.teams.FR,seed,'normal',{gameMode:'advanced',participants:d.countries,teams:d.teams});}

test('Four participants include every human country, random unused NPCs and all six selectable powers',()=>{
 const combinations=new Set();
 for(let seed=0;seed<120;seed++)for(const home of powers){const selected=selectParticipants([home],seed);assert.equal(selected.length,4);assert.equal(new Set(selected).size,4);assert.ok(selected.includes(home));assert.deepEqual(selectParticipants([home],seed),selected);if(home==='FR')combinations.add(selected.join(','));}
 assert.ok(combinations.size>3);
 for(let count=2;count<=4;count++){const humans=powers.slice(0,count),selected=selectParticipants(humans,82);assert.ok(humans.every(c=>selected.includes(c)));assert.equal(selected.filter(c=>!humans.includes(c)).length,4-count);}
 for(const bad of [[],['FR','FR'],['DE'],powers])assert.throws(()=>selectParticipants(bad));
 const html=setupScreen('FR',[],false);for(const c of powers)assert.match(html,new RegExp('data-id="'+c+'"'));assert.match(html,/id="gameMode"/);assert.match(html,/value="regular" selected/);
});

test('New solo campaigns have four factions; six-country historical campaigns remain loadable',()=>{
 for(const home of powers){const s=E.createConfiguredGame(home,DEFAULT_TEAM_IDS,41);assert.equal(Object.keys(s.factions).length,4);assert.equal(s.agents.length,16);assert.ok(s.factions[home]);assert.equal(s.gameMode,'regular');assert.equal(E.validateSave(structuredClone(s)).agents.length,16);}
 const old=E.createGame('FR',DEFAULT_TEAM_IDS,41);assert.equal(E.validateSave(structuredClone(old)).agents.length,24);assert.equal(old.participantRules,undefined);
 const malformed=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,41);delete malformed.factions[Object.keys(malformed.factions).find(c=>c!=='FR')];assert.throws(()=>E.validateSave(malformed));
});
test('A historical six-human multiplayer save keeps its participants and resumes under the new protocol',()=>{
 const r=lobby(4);delete r.participantRules;delete r.gameMode;delete r.draft;for(let i=4;i<6;i++)joinRoom(r,{invite:r.invite,token:token(i),name:'Ancien joueur '+i});for(const m of r.members){m.agents=[...DEFAULT_TEAM_IDS];m.confirmed=true;}startRoom(r,179);r.protocol=16;const restored=restoreRoom(structuredClone(r));assert.equal(restored.protocol,PROTOCOL);assert.equal(restored.members.length,6);assert.equal(restored.game.agents.length,24);assert.equal(Object.keys(restored.game.factions).length,6);
});

test('Two, three and four multiplayer humans receive respectively two, one and zero NPC teams',()=>{
 for(let n=2;n<=4;n++){const r=lobby(n);for(const m of r.members)send(r,m,'team',{agents:DEFAULT_TEAM_IDS});startRoom(r,100+n);assert.equal(Object.keys(r.game.factions).length,4);assert.equal(r.game.agents.length,16);assert.ok(r.members.every(m=>r.game.factions[m.country]));assert.equal(Object.keys(r.game.factions).filter(c=>!r.game.humanFactions.includes(c)).length,4-n);assert.doesNotThrow(()=>restoreRoom(structuredClone(r)));}
 const full=lobby(4);assert.throws(()=>joinRoom(full,{invite:full.invite,token:token(5),name:'Cinquième'}),/quatre places/);
});

test('Draft order is random, seeded, snake-shaped and uses each of the sixteen agents exactly once',()=>{
 const orders=new Set();for(let seed=0;seed<80;seed++){const d=createDraft(powers.slice(0,4),seed);orders.add(d.order.join(','));assert.deepEqual(d,createDraft(powers.slice(0,4),seed));const expected=[...d.order,...[...d.order].reverse(),...d.order,...[...d.order].reverse()];for(let i=0;i<16;i++){assert.equal(draftCountry(d),expected[i]);pickDraftAgent(d,expected[i],DISPLAY_ROSTER[i].id);}assert.equal(draftCountry(d),null);assert.equal(new Set(d.picks.map(p=>p.id)).size,16);assert.ok(Object.values(d.teams).every(t=>t.length===4));assert.doesNotThrow(()=>validateDraft(d));}
 assert.ok(orders.size>4);
});

test('NPC draft picks stop at the next human, remain deterministic and never take an already reserved agent',()=>{
 for(const count of [1,2,3]){const humans=powers.slice(0,count),d=advanceNpcDraft(createDraft(humans,170)),control=structuredClone(d);while(draftCountry(d)){const c=draftCountry(d),id=availableDraftAgents(d)[0].id;assert.ok(humans.includes(c));pickDraftAgent(d,c,id);advanceNpcDraft(d);pickDraftAgent(control,c,id);advanceNpcDraft(control);}assert.deepEqual(d,control);assert.equal(d.picks.length,16);assert.equal(new Set(d.picks.map(p=>p.id)).size,16);assert.doesNotThrow(()=>validateDraft(d));}
});

test('Country confirmation and host draft start lock joining, mode edits and out-of-turn picks without rerolling',()=>{
 const r=lobby(3),h=r.members[0];send(r,h,'game-mode',{mode:'advanced'});assert.throws(()=>send(r,r.members[1],'game-mode',{mode:'regular'}));assert.throws(()=>send(r,h,'begin-draft'));
 send(r,h,'confirm-country');send(r,r.members[1],'confirm-country');assert.throws(()=>send(r,h,'begin-draft'));send(r,r.members[2],'confirm-country');assert.equal(r.phase,'lobby');assert.throws(()=>send(r,r.members[1],'begin-draft'));send(r,h,'begin-draft');
 const current=r.members.find(m=>m.country===draftCountry(r.draft)),other=r.members.find(m=>m!==current),before=structuredClone(r.draft);
 assert.throws(()=>send(r,other,'draft-pick',{id:availableDraftAgents(r.draft)[0].id}),/tour/);assert.deepEqual(r.draft,before);
 assert.throws(()=>send(r,h,'game-mode',{mode:'regular'}));assert.throws(()=>send(r,h,'country',{country:'CN'}));assert.throws(()=>joinRoom(r,{invite:r.invite,token:token(9),name:'Tardif'}));
 const seq=current.lastSeq+1;execute(r,current.token,{protocol:PROTOCOL,seq,kind:'draft-pick',payload:{id:availableDraftAgents(r.draft)[0].id}});const saved=structuredClone(r.draft);assert.deepEqual(execute(r,current.token,{protocol:PROTOCOL,seq,kind:'draft-pick',payload:{id:'p0'}}),{duplicate:true});assert.deepEqual(r.draft,saved);
 const view=roomView(r,current.token);assert.equal(view.draft.seed,undefined);assert.equal(view.draft.rng,undefined);assert.equal(view.members[0].token,undefined);assert.equal(view.game,null);
});

test('Finishing multiplayer draft permits only owned-team reorder, requires every confirmation and respects chiefs',()=>{
 const r=finish(begin(lobby(3)));assert.equal(r.phase,'teams');assert.ok(r.members.every(m=>m.agents.length===4&&!m.confirmed));assert.throws(()=>send(r,r.members[0],'start'));
 const h=r.members[0],ordered=reorderTeam(h.agents,h.agents[3],'chief');assert.equal(ordered[0],h.agents[3]);const stolen=[...ordered];stolen[0]=r.members[1].agents[0];assert.throws(()=>send(r,h,'team',{agents:stolen}),/uniquement/);
 send(r,h,'team',{agents:ordered});assert.throws(()=>send(r,h,'start'));for(const m of r.members.slice(1))send(r,m,'team',{agents:[...m.agents].reverse()});assert.throws(()=>send(r,r.members[1],'start'),/hôte/);send(r,h,'start');
 assert.equal(r.phase,'playing');assert.equal(r.game.gameMode,'advanced');assert.equal(r.game.agents.length,16);assert.equal(new Set(r.game.agents.map(a=>a.templateId||a.id)).size,16);for(const m of r.members)assert.equal(E.team(r.game,m.country).find(a=>a.chief).templateId,m.agents[0]);assert.doesNotThrow(()=>restoreRoom(structuredClone(r)));
});

test('Advanced draft and ordered teams survive export, host resume and guest reconnect',()=>{
 let r=begin(lobby(2));const current=r.members.find(m=>m.country===draftCountry(r.draft));send(r,current,'draft-pick',{id:availableDraftAgents(r.draft)[0].id});const original=structuredClone(r.draft);
 r=restoreRoom(structuredClone(r));assert.deepEqual(r.draft,original);assert.equal(r.members[1].connected,false);joinRoom(r,{invite:r.invite,token:r.members[1].token});finish(r);send(r,r.members[0],'team',{agents:[...r.members[0].agents].reverse()});const ordered=[...r.members[0].agents];
 r=restoreRoom(structuredClone(r));assert.deepEqual(r.members[0].agents,ordered);assert.equal(r.members[0].confirmed,true);joinRoom(r,{invite:r.invite,token:r.members[1].token});send(r,r.members[1],'team',{agents:r.members[1].agents});send(r,r.members[0],'start');assert.equal(E.team(r.game).find(a=>a.chief).templateId,ordered[0]);
});

test('Malformed snake history, duplicate agents, extra countries and stolen saved teams are rejected',()=>{
 const r=finish(begin(lobby(2)));for(const corrupt of [x=>x.draft.picks[0].country=x.draft.order[1],x=>x.draft.picks[1].id=x.draft.picks[0].id,x=>x.draft.order[1]=x.draft.order[0],x=>x.draft.countries.push('DE'),x=>x.members[0].agents[0]=x.members[1].agents[0],x=>x.phase='draft',x=>x.draft.humans=[]]){const bad=structuredClone(r);corrupt(bad);assert.throws(()=>restoreRoom(bad));}
});

test('Replacing a disconnected drafter retains all four countries and existing picks, and NPC finishes their choices',()=>{
 const r=begin(lobby(3)),h=r.members[0],target=r.members.find(m=>!m.host&&m.country===draftCountry(r.draft))||r.members[1],countries=[...r.draft.countries],order=[...r.draft.order],picked=[...r.draft.picks];target.connected=false;send(r,h,'replace',{country:target.country});assert.deepEqual(r.draft.countries,countries);assert.deepEqual(r.draft.order,order);assert.deepEqual(r.draft.picks.slice(0,picked.length),picked);assert.ok(!r.draft.humans.includes(target.country));finish(r);assert.equal(r.draft.teams[target.country].length,4);assert.doesNotThrow(()=>restoreRoom(structuredClone(r)));
});

test('Observer host holds no draft picks or country and can start four human teams after confirmation',()=>{
 const r=finish(begin(lobby(4,true)));assert.equal(r.members.length,5);assert.equal(r.draft.humans.length,4);assert.equal(r.members[0].country,null);assert.throws(()=>send(r,r.members[0],'draft-pick',{id:'p0'}));for(const m of r.members.filter(m=>!m.observer))send(r,m,'team',{agents:m.agents});send(r,r.members[0],'start');assert.equal(r.game.humanFactions.length,4);assert.equal(r.game.agents.length,16);assert.equal(roomView(r,r.members[0].token).observer,true);assert.doesNotThrow(()=>restoreRoom(structuredClone(r)));
});

test('Successful clandestine travel resets exposure, including forecast and saved multiplayer outcome; failure retains its penalty',()=>{
 for(const armed of [false,true])for(const infiltration of [false,true]){const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=Object.keys(s.factions);s.plots=[];s.fracture.cells.forEach(c=>c.resources=0);const a=E.team(s)[0];a.exposure=73;a.weapon=armed;if(infiltration)a.talents.push('infiltration');assert.equal(E.missionExposure(a,'sneak',true),-73);assert.match(missionCostsMarkup(s,a.id,'sneak','DE'),/-73/);E.assign(s,a.id,'sneak','DE');a.task.chance=100;E.advance(s);assert.equal(a.country,'DE');assert.equal(a.exposure,0);assert.equal(a.weapon,armed);assert.equal(s.operationReports.find(r=>r.agentId===a.id).exposure,-73);}
 const r=finish(begin(lobby(2)));for(const m of r.members)send(r,m,'team',{agents:m.agents});startRoom(r,42);r.game.plots=[];r.game.fracture.cells.forEach(c=>c.resources=0);const guest=r.members[1],a=E.team(r.game,guest.country)[0];a.exposure=52;send(r,guest,'assign',{id:a.id,type:'sneak',target:'DE'});r.game.agents.find(b=>b.id===a.id).task.chance=100;while(r.game.agents.find(b=>b.id===a.id).task)for(const m of r.members)send(r,m,'ready',{ready:true});const view=roomView(r,guest.token);assert.equal(view.game.agents.find(b=>b.id===a.id).exposure,0);assert.doesNotThrow(()=>restoreRoom(structuredClone(r)));
 const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=Object.keys(s.factions);s.plots=[];s.fracture.cells.forEach(c=>c.resources=0);const b=E.team(s)[0];b.exposure=35;E.assign(s,b.id,'sneak','DE');b.task.chance=0;E.advance(s);assert.equal(b.exposure,35+E.missionExposure(b,'sneak',false));
});

test('Advanced replacements use only legacy agents and reserve identities across all NPCs and pending hires',()=>{
 const s=advancedGame(),old=ROSTER.filter(a=>!DISPLAY_ROSTER.some(b=>b.id===a.id));assert.equal(old.length,11);assert.ok(E.recruitmentCandidates(s).every(a=>old.some(b=>b.id===a.id)));assert.throws(()=>E.recruit(s,DISPLAY_ROSTER[0].id));
 const a=E.team(s)[0];a.status='dead';const candidate=E.recruitmentCandidates(s)[0];E.recruit(s,candidate.id);const npc=Object.keys(s.factions).find(c=>c!=='FR');E.team(s,npc)[0].status='dead';E.queueNpcRecruitment(s,npc);const queued=s.recruitments.find(r=>r.faction===npc);assert.ok(old.some(a=>a.id===queued.templateId));assert.notEqual(queued.templateId,candidate.id);
 let loaded=E.validateSave(structuredClone(s));assert.equal(loaded.recruitments.find(r=>r.faction===npc).templateId,queued.templateId);loaded.humanFactions=Object.keys(loaded.factions);loaded.plots=[];E.advance(loaded);E.advance(loaded);assert.equal(loaded.agents.find(a=>a.id===queued.id).templateId,queued.templateId);assert.equal(loaded.agents.find(a=>a.id===candidate.id).name,candidate.name);loaded=E.validateSave(structuredClone(loaded));assert.equal(loaded.agents.find(a=>a.id===queued.id).templateId,queued.templateId);assert.equal(new Set(loaded.agents.map(a=>a.templateId||a.id)).size,loaded.agents.length);
 const view=roomView({protocol:PROTOCOL,id:'view',revision:1,phase:'playing',gameMode:'advanced',members:[{token:'owner',country:'FR',agents:[],connected:true}],game:loaded,offers:[]},'owner').game;assert.ok(view.unavailableRecruits.includes(queued.templateId));assert.ok(!E.recruitmentCandidates(view).some(a=>a.id===queued.templateId));
 const bad=structuredClone(loaded);bad.agents.find(a=>a.id===queued.id).templateId=candidate.id;assert.throws(()=>E.validateSave(bad));
});
test('An actual advanced-mode death proposes three saved legacy replacements in the illustrated alert',()=>{
 let s,a;for(let seed=1;seed<200;seed++){s=advancedGame(seed);s.humanFactions=Object.keys(s.factions);s.plots=[];s.fracture.cells.forEach(c=>c.resources=0);a=E.team(s)[0];a.country='TR';E.assign(s,a.id,'sneak','JP');a.task.remaining=1;a.task.chance=0;E.advance(s);if(a.status==='dead')break;}
 assert.equal(a.status,'dead');const offer=s.factions.FR.recruitOffer;assert.equal(offer.length,3);assert.ok(offer.every(id=>!DISPLAY_ROSTER.some(a=>a.id===id)));const card=missionCards(s).find(r=>r.type==='death');assert.ok(card);const html=missionRevealMarkup(card,0,1,true,a,s);for(const id of offer)assert.match(html,new RegExp('data-id="'+id+'"'));assert.deepEqual(E.validateSave(structuredClone(s)).factions.FR.recruitOffer,offer);E.recruit(s,offer[0]);assert.equal(s.recruitments[0].remaining,2);
});

test('Regular and Advanced four-country campaigns remain valid through all bot difficulties and render all screens',()=>{
 for(const level of ['easy','normal','expert','bb1'])for(const mode of ['regular','advanced']){const s=mode==='advanced'?advancedGame(44):E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,44);s.aiDifficulty=level;s.humanFactions=[];while(!s.ended){E.advance(s);E.validateSave(structuredClone(s));}assert.equal(Object.keys(s.factions).length,4);for(const c of Object.keys(s.factions)){s.player=c;const screens=makeScreens(s,c,null,[],{});for(const view of ['agents','inquiry','operations','diplomacy','government','journal'])assert.equal(typeof screens[view](),'string');}assert.ok(s.ended);}
});

test('Advanced setup shows country selection first, disabled taken draft agents, ordered team controls and no Agents-menu relief button',()=>{
 const initial=setupScreen('FR',[],false,null,'normal','advanced');assert.match(initial,/solo-confirm-country/);assert.doesNotMatch(initial,/data-cmd="select-recruit"|class="recruit-grid"/);assert.match(initial,/id="gameMode"/);
 const d=advanceNpcDraft(createDraft(['FR'],42)),html=draftScreen(d,'FR');assert.match(html,/solo-draft-pick/);if(d.picks.length)assert.match(html,/draft-owner/);
 while(draftCountry(d)){pickDraftAgent(d,'FR',availableDraftAgents(d)[0].id);advanceNpcDraft(d);}const final=draftScreen(d,'FR');assert.match(final,/solo-draft-chief/);assert.match(final,/solo-confirm-team/);assert.match(final,/data-cmd="start" disabled/);
 const s=advancedGame();const shell=gameShell(s,'agents','');assert.doesNotMatch(shell,/Renforts & relève/);assert.match(shell,/Retour à la carte/);
});

test('Actual solo setup handlers draft four agents, reorder chief and launch the complete exclusive game',()=>{
 const app=readFileSync(new URL('../dist/client/app.js',import.meta.url),'utf8'),cases=app.slice(app.indexOf(" case 'ai-difficulty':"),app.indexOf(" case 'resume':"));
 const context={setupDifficulty:'normal',setupMode:'advanced',setupDraft:null,setupConfirmed:false,setupCountry:'FR',setupAgents:[],E,createDraft,draftCountry,pickDraftAgent,advanceNpcDraft,reorderTeam,render:()=>{},toast:()=>{},resetExperience:()=>{},clearSignals:()=>{},persist:()=>{},camera:{},focusCountry:()=>{},menuOpen:false,AI_LEVELS:{},state:null};
 const handle=runInNewContext('(cmd,id)=>{switch(cmd){'+cases+'}}',context);handle('solo-confirm-country');assert.equal(context.setupDraft.humans[0],'FR');while(draftCountry(context.setupDraft))handle('solo-draft-pick',availableDraftAgents(context.setupDraft)[0].id);const chosen=context.setupAgents[3];handle('solo-draft-chief',chosen);handle('start');assert.equal(context.state,null);handle('solo-confirm-team');handle('start');assert.equal(context.state.agents.length,16);assert.equal(context.state.gameMode,'advanced');assert.equal(E.team(context.state).find(a=>a.chief).id,chosen);
});

test('Actual multiplayer controller renders all draft phases and confirms a reordered team without losing picks',async()=>{
 const original={document:globalThis.document,location:globalThis.location,localStorage:globalThis.localStorage};let html='';globalThis.document={querySelector:()=>null};globalThis.location={href:'https://sigma.test/'};globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 const mp=new Multiplayer({lobby:value=>{html=value;},close:()=>{},render:()=>mp.panel(),state:()=>{},toast:()=>{}});
 try{mp.room=lobby(2);mp.active=true;mp.token=mp.room.members[0].token;mp.details={id:mp.room.id,invite:mp.room.invite};mp.publish();assert.match(html,/id="mpGameMode"/);await mp.command('game-mode',{mode:'advanced'});assert.match(html,/mp-confirm-country/);assert.doesNotMatch(html,/data-cmd="mp-select"/);await mp.handle('mp-confirm-country');send(mp.room,mp.room.members[1],'confirm-country');await mp.handle('mp-begin-draft');assert.match(html,/mp-draft-pick/);finish(mp.room);mp.publish();assert.match(html,/mp-draft-chief/);const chief=mp.draft[3];await mp.handle('mp-draft-chief',chief);await mp.handle('mp-team');assert.equal(mp.room.members[0].agents[0],chief);assert.equal(mp.room.members[0].confirmed,true);await mp.handle('mp-draft-after',chief);assert.equal(mp.room.members[0].confirmed,false);await mp.handle('mp-team');send(mp.room,mp.room.members[1],'team',{agents:mp.room.members[1].agents});await mp.handle('mp-start');assert.equal(mp.room.phase,'playing');assert.equal(E.team(mp.room.game).find(a=>a.chief).templateId,mp.draft[0]);}
 finally{clearInterval(mp.timer);Object.assign(globalThis,original);}
});
