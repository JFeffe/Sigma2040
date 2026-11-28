import {localizeContent,translateText} from './localization.js?v=247';
import {confirmInGame} from './dialog-behavior.js?v=247';
import {resetRecruitFilters,toggleRecruitSelection} from './recruit-selection.js?v=247';
import {GAME_MODES,reorderTeam} from './game-setup.js?v=247';
import {draftScreen,draftCandidate} from './draft-ui.js?v=247';
import {aiDifficultyControl} from './ai-difficulty.js?v=247';
import {OBSERVER_COLORS} from './map-markers.js?v=247';
import {setupScreen} from './screens.js?v=247';
import {PROTOCOL,playingMembers,newRoom,joinRoom,disconnect,execute,roomView,restoreRoom} from './multiplayer-core.js?v=247';
import {RelayPeer} from './relay.js?v=247';
import {COUNTRIES,COUNTRY,DISPLAY_ROSTER,DEFAULT_TEAM_IDS} from './data.js?v=247';
import {brand,esc,button,flag,portrait,statlines,talents,nationalities,countryOption,countrySelect} from './ui.js?v=247';
const ACTIVE='sigma-active-multiplayer';
const SAVE='sigma2040-multiplayer-v1',BACKUP='sigma2040-multiplayer-before-free-actions-v82';
const PUBLIC_GAME_URL='https://sigma-2040.docile-hero-2836.chatgpt.site/';
const invitationId=/^[a-zA-Z0-9-]{20,80}$/;
function invitationFromHash(hash){
 const params=new URLSearchParams(hash);
 return params.get('shadow-mandate')||params.get('sigma')||'';
}
const uid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
const powers=COUNTRIES.filter(c=>c.power);
export class Multiplayer{
 constructor(hooks){this.hooks=hooks;this.active=false;this.snapshot=null;this.peer=null;this.links=new Map();this.pending=null;this.status='';this.savedError=false;this.epoch=0;this.seq=0;this.draftCandidate=null;this.timer=setInterval(()=>this.tick(),3000);}
 get observer(){return !!this.snapshot?.observer;}
 observe(country){if(!this.host||!this.observer)return;this.observedCountry=country;this.hooks.close();this.receive(roomView(this.room,this.token,country));}
 get host(){return !!this.room;}
 get me(){return this.snapshot?.members.find(m=>m.country===this.snapshot.country);}
 hasSave(){try{return !!localStorage.getItem(SAVE);}catch{return false;}}
 invitation(){try{return invitationFromHash(location.hash.slice(1));}catch{return '';}}
 parseInvitation(value){
  const input=String(value).trim();
  const hashIndex=input.indexOf('#');
  const code=hashIndex===-1?input:invitationFromHash(input.slice(hashIndex+1));
  const parts=code.split('.');
  if(parts.length!==2||!parts.every(part=>invitationId.test(part))){
   throw Error('Collez le code ou le lien d’invitation complet.');
  }
  const [id,invite]=parts;
  return {id,invite};
 }
 entry(mode=this.entryMode||(this.invitation()?'join':'host')){
  if(this.active){this.panel();return;}
  this.entryMode=mode;
  this.entryName=document.querySelector('#mpName')?.value||this.entryName||this.name||translateText('Joueur');
  this.entryGameMode=document.querySelector('#mpEntryGameMode')?.value||this.entryGameMode||'regular';
  this.entryInvitation=document.querySelector('#mpInvite')?.value??this.entryInvitation??this.invitation();
  const host=mode==='host';
  const buttonState=selected=>`aria-pressed="${selected}"`;
  const modeChoices=Object.entries(GAME_MODES).map(([id,label])=>`<option value="${id}" ${id===this.entryGameMode?'selected':''}>${label}</option>`).join('');
  const html=`<main class="command-menu multiplayer-entry">
   <header class="command-menu-header">${brand()}</header>
   <section class="command-menu-body">
    <h1 id="multiplayerTitle" tabindex="-1">Multijoueur</h1>
    <div class="mp-entry-card">
     <div class="mp-entry-tabs" role="group" aria-label="Entrée multijoueur">
      ${button('Créer une partie','mp-entry-host','',buttonState(host))}
      ${button('Rejoindre une partie','mp-entry-join','',buttonState(!host))}
     </div>
     <div class="mp-entry-form">
      <label>Votre pseudo<input id="mpName" maxlength="30" value="${esc(this.entryName)}" autocomplete="nickname"></label>
      ${host?`<label>Mode de jeu<select class="menu-select" id="mpEntryGameMode">${modeChoices}</select></label>
       <p>Le lien à partager s’affichera dans le salon.</p>
       ${button('Créer le salon','mp-create','primary wide')}`:`<label>Code ou lien d’invitation<input id="mpInvite" value="${esc(this.entryInvitation)}" placeholder="Collez l’invitation reçue de l’hôte" spellcheck="false"></label>
       ${button('Rejoindre la partie','mp-join','primary wide')}`}
     </div>
    </div>
    ${host?`<div class="mp-entry-saves">${this.hasSave()?button('Reprendre ma partie hébergée','mp-resume','small'):''}<input type="file" id="mpImport" accept=".json,application/json" hidden>${button('Importer une sauvegarde multijoueur','mp-import-file','small')}</div>`:''}
   </section>
  </main>`;
  if(this.hooks.openEntry)this.hooks.openEntry(html);else this.hooks.modal(html);
 }
 async restoreSession(){
  let saved,active;try{saved=JSON.parse(localStorage.getItem(SAVE)||'null');active=JSON.parse(sessionStorage.getItem(ACTIVE)||'null');}catch{}
  const invite=this.invitation();
  // A host opening their own invitation must resume the authoritative room, not join as a guest.
  if(saved&&(active?.host&&active.details?.id===saved.id||invite===saved.id+'.'+saved.invite)){await this.resume();return true;}
  if(active&&!active.host&&active.details){await this.connect(null,active.details,active.name||'Joueur');return true;}
  return false;
 }
 async loadPeer(){}
 async connect(room,details,name){
  if(this.active)throw Error('Quittez votre session actuelle avant de rejoindre une autre partie.');
  await this.loadPeer();this.active=true;this.room=room;this.details=room?{id:room.id,invite:room.invite}:details;this.status='Connexion au salon…';this.epoch++;const epoch=this.epoch;
  if(room)this.token=room.members.find(m=>m.host).token;
  else{try{this.token=sessionStorage.getItem('sigma-seat-'+details.id)||localStorage.getItem('sigma-seat-'+details.id)||uid();sessionStorage.setItem('sigma-seat-'+details.id,this.token);localStorage.setItem('sigma-seat-'+details.id,this.token);}catch{this.token=uid();}}
  this.name=name;try{sessionStorage.setItem(ACTIVE,JSON.stringify({host:!!room,details:this.details,name}));}catch{}if(this.host)this.publish();this.peer=new (globalThis.Peer||RelayPeer)(room?'shadow-mandate-2040-'+room.id:undefined,{details:this.details,hostToken:this.host?this.token:null});
  this.peer.on('open',()=>{if(epoch!==this.epoch)return;this.status=this.host?'':'Connexion à l’hôte…';if(this.host){this.publish();}else this.connectGuest();this.refreshPanel();});
  this.peer.on('connection',conn=>{if(epoch!==this.epoch||!this.host){conn.close();return;}this.attachHost(conn);});
  this.peer.on('disconnected',()=>{if(epoch===this.epoch&&!this.peer.destroyed){this.status='Connexion au service de liaison interrompue. Reconnexion…';try{this.peer.reconnect();}catch{}}});
  this.peer.on('error',e=>{if(epoch!==this.epoch)return;this.status=e.type==='unavailable-id'?'Ce salon est déjà ouvert ailleurs. Fermez l’autre session avant de le reprendre.':e.type==='peer-unavailable'?'Hôte introuvable. Il doit ouvrir ou reprendre la partie.':'Connexion impossible pour le moment. Vérifiez votre réseau puis réessayez.';this.hooks.toast(this.status);if(this.snapshot)this.hooks.render();this.refreshPanel();});
  this.peer.on('recovered',()=>{if(epoch!==this.epoch)return;this.status='';if(this.host)this.publish();else this.hooks.render();if(document.querySelector('dialog[open] #mpLobby'))this.panel();});
  this.panel();
 }
 async create(name,country,gameMode='regular'){if(this.hasSave()&&!await confirmInGame('Créer ce salon remplacera la sauvegarde multijoueur hébergée sur cet appareil. Continuer ?'))return;return this.connect(newRoom(uid(),uid(),uid(),name,country,gameMode),null,name);}
 resume(raw=null){const original=raw?JSON.stringify(raw):localStorage.getItem(SAVE),parsed=JSON.parse(original),room=restoreRoom(parsed);if(parsed.protocol===1&&!localStorage.getItem(BACKUP))localStorage.setItem(BACKUP,original);return this.connect(room,null,room.members.find(m=>m.host).name);}
 connectGuest(){if(!this.active||this.host||this.connection?.open||this.connecting)return;this.connecting=true;this.status='Connexion à l’hôte…';const conn=this.peer.connect('shadow-mandate-2040-'+this.details.id,{reliable:true,serialization:'binary'});this.connection=conn;const epoch=this.epoch;this.lastHost=Date.now();conn.on('open',()=>{if(epoch!==this.epoch||this.connection!==conn)return;this.connecting=false;conn.send({kind:'hello',protocol:PROTOCOL,invite:this.details.invite,token:this.token,name:this.name});});conn.on('data',data=>{if(epoch!==this.epoch||this.connection!==conn)return;this.lastHost=Date.now();if(data?.kind==='snapshot'){this.status='';this.receive(data.value);}else if(data?.kind==='ack'){this.finishPending(data);}else if(data?.kind==='error'){this.hooks.toast(data.message);this.status=data.message;this.refreshPanel();}else if(data?.kind==='pong'){}else if(data?.kind==='removed'){this.leave();this.hooks.toast('Votre pays a été confié à un PNJ par l’hôte.');}});conn.on('close',()=>{if(epoch!==this.epoch||this.connection!==conn)return;this.connecting=false;this.status='Hôte déconnecté — la partie est en pause.';this.hooks.render();});conn.on('error',()=>{if(epoch!==this.epoch||this.connection!==conn)return;this.connecting=false;this.status='Liaison avec l’hôte impossible. Réessayez depuis un autre réseau.';this.refreshPanel();});setTimeout(()=>{if(epoch===this.epoch&&this.connection===conn&&!conn.open){this.connecting=false;this.retryPaused=true;conn.close();this.status='La liaison avec l’hôte n’a pas abouti. Vérifiez qu’il est connecté ; certains réseaux peuvent bloquer la connexion.';this.refreshPanel();}},25000).unref?.();}
 attachHost(conn){let token=null,last=Date.now();const epoch=this.epoch;conn.on('data',data=>{
  if(epoch!==this.epoch||!this.room||!data||typeof data!=='object')return;
  try{
   if(JSON.stringify(data).length>20000)throw Error('Message trop volumineux.');
   if(!token){if(data.kind!=='hello'||data.protocol!==PROTOCOL)throw Error('Version incompatible. Rechargez le jeu.');const member=joinRoom(this.room,data);token=member.token;const old=this.links.get(token);if(old?.conn!==conn)old?.conn.close();this.links.set(token,{conn,last:Date.now()});this.publish();return;}
   const link=this.links.get(token);if(link?.conn!==conn)return;link.last=Date.now();last=link.last;
   if(data.kind==='ping'){const member=this.room.members.find(m=>m.token===token);if(member&&!member.connected){member.connected=true;member.ready=false;this.room.revision++;this.publish();}conn.send({kind:'pong'});return;}
   const member=this.room.members.find(m=>m.token===token);if(!member)throw Error('Place indisponible.');
   const result=execute(this.room,token,data);this.publish();conn.send({kind:'ack',seq:data.seq,ok:true,...result});
  }catch(e){if(data?.seq)conn.send({kind:'ack',seq:data.seq,ok:false,message:e.message});else{conn.send({kind:'error',message:e.message});setTimeout(()=>conn.close(),100);}}
 });conn.on('close',()=>{if(epoch===this.epoch&&token&&this.links.get(token)?.conn===conn){this.links.delete(token);disconnect(this.room,token);this.publish();}});conn.on('error',()=>{});setTimeout(()=>{if(!token&&epoch===this.epoch)conn.close();},35000).unref?.();}
 persist(){if(!this.room)return;try{localStorage.setItem(SAVE,JSON.stringify(this.room));this.savedError=false;}catch{this.savedError=true;this.hooks.toast('Sauvegarde multijoueur indisponible. Exportez la partie depuis le salon.');}}
 publish(){if(!this.room)return;this.persist();this.receive(roomView(this.room,this.token,this.observedCountry));for(const [token,link] of this.links){if(!this.room.members.some(m=>m.token===token)){link.conn.send({kind:'removed'});link.conn.close();this.links.delete(token);continue;}if(link.conn.open)link.conn.send({kind:'snapshot',value:roomView(this.room,token)});}if(document.querySelector('dialog[open] #mpLobby'))this.panel();}
 receive(snapshot){if(!snapshot||snapshot.protocol!==PROTOCOL)return;if(this.snapshot&&snapshot.revision<this.snapshot.revision)return;const previous=this.snapshot;if(previous?.draft?.picks.length!==snapshot.draft?.picks.length||previous?.phase!==snapshot.phase||previous?.country!==snapshot.country)this.draftCandidate=null;this.snapshot=snapshot;this.seq=Math.max(this.seq,snapshot.lastSeq);if(snapshot.game&&previous&&previous.phase!=='playing')this.hooks.close();if(snapshot.game)this.hooks.state(snapshot.game,previous?.game);else if(snapshot.phase==='playing')this.hooks.render();if(snapshot.phase!=='playing'||document.querySelector('dialog[open] #mpLobby'))this.panel();}
 command(kind,payload={}){if(!this.active||!this.snapshot)return Promise.reject(Error('Attendez la connexion au salon.'));if(this.pending)return Promise.reject(Error('Un ordre attend encore la confirmation de l’hôte.'));if(this.observer&&!['observer','start','replace','ai-difficulty','game-mode','begin-draft'].includes(kind))return Promise.reject(Error('Observateur : consultation uniquement.'));const message={protocol:PROTOCOL,seq:++this.seq,turn:this.snapshot.game?.turn,kind,payload};if(this.host){try{const result=execute(this.room,this.token,message);this.publish();return Promise.resolve(result);}catch(e){return Promise.reject(e);}}
  if(!this.connection?.open||this.status)return Promise.reject(Error('La connexion avec l’hôte est interrompue.'));
  return new Promise((resolve,reject)=>{this.pending={message,resolve,reject,sent:Date.now()};this.connection.send(message);this.hooks.render();});
 }
 finishPending(data){if(this.pending?.message.seq!==data.seq)return;const pending=this.pending;this.pending=null;data.ok?pending.resolve(data):pending.reject(Error(data.message));this.hooks.render();}
 tick(){if(!this.active)return;const now=Date.now();if(this.host){let changed=false;for(const [token,link] of this.links){const member=this.room.members.find(m=>m.token===token);if(member?.connected&&now-link.last>15000){disconnect(this.room,token);changed=true;}}if(changed)this.publish();}
  else{if(this.connection?.open){this.connection.send({kind:'ping'});if(now-this.lastHost>15000&&!this.status){this.status='Connexion perdue — attente de l’hôte.';this.hooks.render();}if(this.pending&&now-this.pending.sent>4000){this.pending.sent=now;this.connection.send(this.pending.message);}}else if(this.peer?.open&&!this.retryPaused)this.connectGuest();}}
 leave(){try{sessionStorage.removeItem(ACTIVE);}catch{}this.epoch++;this.active=false;this.peer?.destroy();this.peer=null;this.links.clear();this.room=null;this.snapshot=null;this.connection=null;this.connecting=false;this.retryPaused=false;this.pending?.reject(Error('Session quittée.'));this.pending=null;this.status='';this.seq=0;this.draft=null;this.draftCountry=null;this.observedCountry=null;return this.hooks.leave();}
 export(backup=false){if(backup){const raw=localStorage.getItem(BACKUP);if(!raw)throw Error('Aucune copie multijoueur antérieure dans ce navigateur.');const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='shadow-mandate-2040-multi-avant-economie-v82.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}if(!this.room)throw Error('Seul l’hôte possède la sauvegarde complète.');const url=URL.createObjectURL(new Blob([JSON.stringify(this.room)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`shadow-mandate-2040-multi-jour-${this.room.game?.turn||1}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 refreshPanel(){if(this.snapshot?.phase==='playing'){this.hooks.render();if(document.querySelector('dialog[open] #mpLobby'))this.panel();}else this.panel();}
 panel(){
  if(!this.active){this.entry();return;}
  const s=this.snapshot,me=this.me;
  const code=`${this.details.id}.${this.details.invite}`;
  const invitationUrl=new URL(PUBLIC_GAME_URL);
  invitationUrl.hash='shadow-mandate='+code;
  if(me&&(this.draft==null||this.draftRoom!==s.id||this.draftMode!==undefined&&this.draftMode!==s.gameMode||s.phase==='teams'&&this.draftPhase!=='teams')){resetRecruitFilters('multi');this.draft=[...(me.agents||[])];}
  this.draftRoom=s?.id;this.draftMode=s?.gameMode;this.draftPhase=s?.phase;this.draftCountry=me?.country;
  const selected=this.draft||me?.agents||[],lobby=s?.phase==='lobby',pregame=s?.phase!=='playing',advanced=['advanced','cooperative'].includes(s?.gameMode),players=s?playingMembers(s):[],observer=s?.members.find(m=>m.observer),editable=!this.pending&&!this.status;
  const countryStep=lobby&&s?.participantRules===1;
  const participating=s?.draft?.countries||s?.mapParticipants||Object.keys(s?.game?.factions||{});
  const members=powers.map(c=>{
   const member=s?.members.find(m=>m.country===c.id),npc=participating.includes(c.id);
   const role=member?'':npc?'PNJ':lobby?'Disponible':'Hors partie';
   const seatStatus=member
    ?!member.connected?'Déconnecté'
     :countryStep?member.countryConfirmed?'Pays confirmé':'Pays à confirmer'
     :pregame?member.confirmed?'Équipe confirmée':s?.phase==='draft'?'Repêchage':'Équipe à confirmer'
     :member.ready?'Prêt':'En préparation'
    :npc?'Automatique':'';
   const manageSeat=this.host&&member&&!member.host
    ?button(lobby?'Retirer':'Confier au PNJ','mp-replace','small mp-seat-action',`data-id="${c.id}"`)
    :'';
   return `<div class="mp-member" role="listitem"${me?.country===c.id?' data-local-seat':''}>
    ${flag(c.id)}<div class="mp-member-name"><strong>${c.name}</strong>
    <span>${member?`<span translate="no">${esc(member.name)}</span>${member.host?' · Hôte':''}`:role}</span></div>
    ${seatStatus?`<span class="mp-member-status">${seatStatus}</span>`:''}${manageSeat}
   </div>`;
  }).join('');
  const confirmation=me&&!me.observer&&(lobby||s?.phase==='teams')?`<div class="mp-team-confirmation">${countryStep?button(me.countryConfirmed?'Pays confirmé ✓':'Confirmer mon pays','mp-confirm-country','primary mp-confirm-team',me.countryConfirmed||!editable?'disabled':''):button(me.confirmed?'Équipe confirmée ✓':'Confirmer mes 4 agents','mp-team','primary mp-confirm-team',selected.length!==4||me.confirmed||!editable?'disabled':'')}<p role="status">${countryStep?(advanced?'Le repêchage commence après la confirmation des pays.':'Le tirage de la carte précède la sélection des agents.'):selected.length+'/4 agents sélectionnés'}</p></div>`:'';
  const startPhase=s?.phase==='teams'||!countryStep&&!advanced&&lobby,beginReady=players.length>=(s?.gameMode==='cooperative'?1:2)&&s?.members.every(m=>m.connected)&&players.every(m=>m.countryConfirmed),startReady=players.length>=(advanced?1:2)&&s?.members.every(m=>m.connected)&&players.every(m=>m.confirmed);
  const modeLabel=GAME_MODES[s?.gameMode];
  const lobbyTitle=lobby
   ?me?.observer?'Hôte observateur':countryStep?'Choisissez votre pays':'Composez votre équipe'
   :s?.phase==='draft'?'Repêchage des agents':s?.phase==='teams'?'Confirmez votre équipe':'Joueurs et invitation';
  const lobbyLabel=pregame?'PRÉPARATION MULTIJOUEUR':`SALON · ${me?.observer?'OBSERVATEUR':COUNTRY[me?.country]?.name||''}`;
  const roles=this.host&&lobby?`<section class="mp-role"><h3>Votre rôle</h3><div class="mp-lobby-choices">
   ${button('Hôte joueur','mp-role-player','',`aria-pressed="${!me?.observer}"`)}
   ${button('Hôte observateur','mp-role-observer','',`aria-pressed="${!!me?.observer}"`)}
  </div></section>`:'';
  const progress=countryStep
   ?{confirmed:players.filter(m=>m.countryConfirmed).length,label:'pays confirmés'}
   :{confirmed:players.filter(m=>m.confirmed).length,label:'équipes confirmées'};
  const top=`<section class="mp-lobby-header panel" id="mpLobby">
   <header class="mp-lobby-intro">
    <div><span class="eyebrow">${lobbyLabel}</span><h2>${lobbyTitle}</h2>${modeLabel?`<p class="mp-lobby-mode"><strong>${modeLabel}</strong></p>`:''}</div>
    ${confirmation}
   </header>
   ${observer?`<p class="notice mp-observer-notice"><span translate="no">${esc(observer.name)}</span> · Hôte observateur — accès à toutes les informations des joueurs. Aucune équipe ni place occupée.</p>`:''}
   ${this.status?`<p role="status" class="notice warning">${esc(this.status)}</p>${!this.host?button('Réessayer','mp-reconnect','wide'):''}`:''}
   ${this.pending?'<p role="status">Confirmation de l’hôte…</p>':''}
   ${this.savedError?'<p class="notice warning">Exportez la sauvegarde : la sauvegarde automatique a échoué.</p>':''}
   <div class="mp-lobby-controls">${roles}${aiDifficultyControl(s?.game?.aiDifficulty||s?.aiDifficulty||'bb1',true,this.host&&lobby&&editable)}</div>
   <div class="mp-invitation">
    <label for="mpLink">Lien d’invitation</label>
    <div class="mp-invitation-row"><input readonly id="mpLink" value="${esc(invitationUrl.href)}">${button('Copier le lien','mp-copy','small')}</div>
   </div>
   <div class="mp-lobby-actions">
    ${this.host&&countryStep?button(advanced?'Commencer le repêchage':'Tirer la carte','mp-begin-draft','primary',!beginReady||!editable?'disabled title="Tous les joueurs doivent confirmer leur pays et être connectés."':''):''}
    ${this.host&&startPhase?button('Lancer la partie','mp-start','primary',!startReady||!editable?'disabled title="Tous les joueurs doivent être connectés et avoir confirmé leur équipe."':''):''}
    ${!pregame?button('Retour au commandement','mp-play','primary'):''}
    ${this.host?button('Exporter la sauvegarde','mp-export')+button('Exporter la copie avant changement','mp-export-backup'):''}
    ${button('Paramètres','settings')}
   </div>
   <section class="mp-lobby-countries">
    <header><h3>Pays du salon</h3>
    ${pregame?`<p class="mp-lobby-progress" role="status">${progress.confirmed}/${players.length} ${progress.label}${lobby&&advanced?' · '+Math.max(0,(s?.gameMode==='cooperative'?2:4)-players.length)+' PNJ compléteront les pays actifs':''}</p>`:''}</header>
    <div class="mp-members" role="list" aria-label="Pays du salon">${members}</div>
   </section>
  </section>`;
  let html;
  if(s?.draft&&['draft','teams'].includes(s.phase))html=draftScreen(s.draft,me?.observer?null:me?.country,{multi:true,header:top,agents:selected,confirmed:me?.confirmed,editable:!!me&&!me.observer&&editable,candidate:this.draftCandidate});
  else if((lobby||s?.phase==='teams')&&me&&!me.observer)html=setupScreen(me.country,selected,false,{header:top,chooseMap:countryStep,locked:!lobby,taken:s.members.filter(m=>m.country!==me.country).map(m=>m.country)},s.aiDifficulty,s.gameMode,s.operationCountries);
  else if(pregame)html=`<main class="mp-observer-lobby">${top}</main>`;
  if(html){if(this.hooks.lobby)this.hooks.lobby(html);else this.hooks.modal(html);return;}
  this.hooks.modal(`<div class="simple-modal mp-dialog">${top}${button('Quitter la session','mp-leave','small')}</div>`);
 }
 decorate(){if(!this.active||!this.snapshot?.game)return;const s=this.snapshot,me=this.me,players=playingMembers(s);const advance=document.querySelector('[data-cmd="advance"]');if(advance){advance.textContent=translateText(s.game.ended?'Voir le bilan':this.observer?'Observation en cours':me.ready?'Modifier mes ordres':s.game.event?'Communication':'Je suis prêt');advance.disabled=!s.game.ended&&(!!this.pending||!!this.status||this.observer);}
 const container=document.querySelector('.deck-content');if(!container)return;const panel=document.createElement('section');panel.className='mp-status';panel.innerHTML=`<strong>${players.filter(m=>m.ready).length}/${players.length} prêts</strong><span>${players.map(m=>esc(COUNTRY[m.country].name)+': '+(!m.connected?'déconnecté':m.ready?'prêt':'en préparation')).join(' · ')}</span>${button('Salon','mp-panel','small')}${this.status?`<p role="status">${esc(this.status)}</p>`:''}${this.pending?'<p role="status">Confirmation de l’hôte…</p>':''}${this.savedError?'<p>Échec de sauvegarde : exportez la partie.</p>':''}`;
 if(this.observer){
  panel.classList.add('mp-observer-status');
  const observerCountry=countrySelect(players.map(m=>countryOption(m.country,
   `${translateText(COUNTRY[m.country].name)} · ${m.name}`,{selected:s.game.player===m.country,localize:false}
  )).join(''),'id="mpObserveCountry"');
  panel.innerHTML=`<div class="mp-observer-heading"><strong>HÔTE OBSERVATEUR</strong><span>Consultation uniquement · Carte : tous les agents des joueurs</span></div><label>Joueur observé ${observerCountry}</label><div class="mp-observer-legend">${players.map(m=>`<button class="btn small" data-cmd="mp-observe" data-id="${m.country}" style="--observer-color:${OBSERVER_COLORS[m.country]}" aria-pressed="${s.game.player===m.country}">${flag(m.country)} <span translate="no">${esc(m.name)}</span></button>`).join('')}</div>`+panel.innerHTML;
 }
 localizeContent(panel);container.prepend(panel);
 if(this.observer)for(const el of document.querySelectorAll('[data-tech-drag]'))el.draggable=false;
 if(me.ready||this.observer){for(const el of document.querySelectorAll('[data-cmd]'))if(['government-favor','deploy','travel','agent-rest','recruit','confidence','confirm-order','cancel','confirm-cancel','cancel-tech','confirm-cancel-tech','cancel-cyber','confirm-cancel-cyber','tech-drone','confidence','tech','hire','share-confirm','request-accept','request-decline','event','mp-share-yes','mp-share-no'].includes(el.dataset.cmd))el.disabled=true;}
 const footer=document.querySelector('.command-deck > footer span');if(footer)footer.textContent=translateText(this.observer?'HÔTE OBSERVATEUR · CONSULTATION UNIQUEMENT':this.host?'HÔTE · SAUVEGARDE MULTI LOCALE':'INVITÉ · SAUVEGARDE CHEZ L’HÔTE');
 }
 async handle(cmd,id){const $=q=>document.querySelector(q);switch(cmd){
  case 'mp-role-player':case 'mp-role-observer':await this.command('observer',{observer:cmd==='mp-role-observer'});this.draft=[];this.panel();break;
  case 'mp-observe':this.observe(id);break;
  case 'mp-entry':this.entry();break;
  case 'mp-entry-join':this.entry('join');break;
  case 'mp-entry-host':this.entry('host');break;
  case 'mp-confirm-country':await this.command('confirm-country');break;
  case 'mp-begin-draft':await this.command(this.snapshot?.gameMode==='regular'?'begin-map':'begin-draft');break;
  case 'mp-draft-preview':if(!this.pending&&draftCandidate(this.snapshot?.draft,this.me?.country,id)){this.draftCandidate=id;this.panel();}break;
  case 'mp-draft-confirm':if(!this.pending&&draftCandidate(this.snapshot?.draft,this.me?.country,this.draftCandidate)){await this.command('draft-pick',{id:this.draftCandidate});this.draftCandidate=null;}break;
  case 'mp-draft-chief':case 'mp-draft-before':case 'mp-draft-after':if(this.snapshot?.phase==='teams'&&!this.observer){if(this.me.confirmed)await this.command('unconfirm');this.draft=reorderTeam(this.draft,id,cmd.split('-').at(-1));this.panel();}break;
  case 'mp-country':await this.command('country',{country:id});break;
  case 'mp-select':{if(['advanced','cooperative'].includes(this.snapshot?.gameMode))break;if(this.draft.includes(id)||this.draft.length<4)this.draft=toggleRecruitSelection(this.draft,id,'multi');else{this.hooks.toast('Désélectionnez un agent avant d’en choisir un autre.');break;}if(this.me.confirmed)await this.command('unconfirm');this.panel();break;}
  case 'mp-create':await this.create($('#mpName').value,$('#mpCountry')?.value||'FR',$('#mpEntryGameMode')?.value||'regular');break;
  case 'mp-resume':await this.resume();break;
  case 'mp-import-file':$('#mpImport')?.click();break;
  case 'mp-join':await this.connect(null,this.parseInvitation($('#mpInvite').value),$('#mpName').value);break;
  case 'mp-panel':this.panel();break;
  case 'mp-reconnect':if(!this.host){this.retryPaused=false;this.connection?.close();this.connecting=false;if(this.peer?.disconnected)this.peer.reconnect();else this.connectGuest();this.refreshPanel();}break;
  case 'mp-copy':{
   const input=$('#mpLink');
   try{
    await navigator.clipboard.writeText(input.value);
    this.hooks.toast('Lien copié.');
   }catch{
    input.select();
    this.hooks.toast('Appuyez sur Ctrl+C pour copier l’invitation.');
   }
   break;
  }
  case 'mp-ai-difficulty':await this.command('ai-difficulty',{level:id});this.panel();break;
  case 'mp-start':await this.command('start');this.hooks.close();break;
  case 'mp-play':this.hooks.close();this.hooks.render();break;
  case 'mp-team':await this.command('team',{agents:[...this.draft]});break;
  case 'mp-export-backup':this.export(true);break;
  case 'mp-export':this.export();break;
  case 'mp-replace':if(await confirmInGame('Confier '+COUNTRY[id].name+' au PNJ ? Ce joueur perdra sa place dans la session.'))await this.command('replace',{country:id});break;
  case 'mp-share-yes':case 'mp-share-no':await this.command('share-answer',{from:id,accept:cmd==='mp-share-yes'});break;
  case 'mp-leave':{
   if(!this.active)break;
   if(this.host||this.snapshot){
    const question=this.host?'Sauvegarder et fermer la session ? Les invités seront déconnectés.':'Quitter la session ? Votre pays restera réservé et la partie attendra votre retour.';
    if(!await confirmInGame(question))break;
   }
   if(this.host){
    this.persist();
    if(this.savedError&&!await confirmInGame('La sauvegarde a échoué. Quitter tout de même ?'))break;
   }
   this.hooks.close();
   await this.leave();
   break;
  }
 }}
}
