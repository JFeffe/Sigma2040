import {countryOnMap} from './operation-map.js?v=244';
import {createFloatingWindows} from './floating-windows.js?v=244';
import {createCountryInquiryController} from './country-inquiry.js?v=244';
import {countryOperationsMarkup,countryOperationModel,floatingAgentMarkup} from './country-operations.js?v=244';
import {COUNTRY,ACTIONS} from './data.js?v=244';
import {visibleTeam} from './cooperative.js?v=244';

export function createGameWorkspace(api){
 const windows=createFloatingWindows();let context=null;
 function refresh(){
  const s=api.state(),next=s?api.context():null;
  if(context!==next){windows.clear();context=next;}
  const active=api.active();windows.setVisible(active);if(!active||!s)return;
  for(const r of windows.values()){
   if(r.kind==='country')r.setHTML(countryOperationsMarkup(s,r.id,r.selection,r.pending?'Confirmation en cours…':api.readOnlyReason()));
   if(r.kind==='agent')r.setHTML(floatingAgentMarkup(s,r.id));
   if(r.controller)r.controller.refreshCountryInquiry();
  }
 }
 function orderForAgent(countryId,agentId,type){
  const s=api.state(),agent=s.agents.find(a=>a.id===agentId&&a.faction===s.player&&a.country===countryId);
  if(agent&&!api.readOnlyReason())api.openAgent(agent.id,type,type==='cyberSupport'&&countryId!==s.player?countryId:null);
 }
 function country(id,preferred=null,agent=null,group=null,agentId=null){
  if(!api.active()||!countryOnMap(api.state(),id))return;if(COUNTRY[id].power&&id!==api.state().player){api.selectCountry(id);return;}
  if(preferred&&agentId){orderForAgent(id,agentId,preferred);return;}
  api.showWorld();refresh();const key=(group==='access'?'country-access:':'country:')+id+(agentId?':'+agentId:''),title=group==='access'?'Actions du pays':'Pays';
  const r=windows.open(key,title+' · '+COUNTRY[id].name,{width:610,legacyWidth:440,className:'country-operations-window'});r.kind='country';r.id=id;r.selection??={group,agentId,boost:false};
  if(preferred&&!r.pending)r.selection={group,agentId,type:preferred,agent,boost:false};
  refresh();
 }
 function inquiry(id,threat=false,agentId=null){
  if(!api.active())return;api.showWorld();refresh();const key=(threat?'threat:':'case:')+id+(agentId?':'+agentId:''),existing=windows.get(key);
  if(existing){windows.open(key,'');return;}
  const s=api.state(),title=threat?'Menace':'Dossier · '+(s.suspects.find(t=>t.id===id)?.name||id),r=windows.open(key,title,{width:630,legacyWidth:480,className:'country-inquiry-modal'});
  r.controller=createCountryInquiryController({...api,modal:r.el,setContent:r.setHTML});r.controller.openCountryInquiry(id,threat,agentId);
  if(!r.el.querySelector('.country-inquiry'))r.close();
 }
 async function command(cmd,id,el){
  if(cmd==='workspace-country'){country(id,el?.dataset.type||null,null,el?.dataset.group||null,el?.dataset.agent||null);return true;}
  if(cmd==='country-inquiry'||cmd==='country-threat'||cmd==='suspect'){inquiry(id,cmd==='country-threat',el?.dataset.agent||null);return true;}
  if(cmd==='workspace-travel'){if(!api.readOnlyReason())api.travel(id);return true;}
  if(cmd==='workspace-deploy'){if(!api.readOnlyReason())api.deploy(id);return true;}
  const root=el?.closest('[data-workspace-window]'),r=root&&windows.get(root.dataset.workspaceWindow);if(!r)return false;
  if(cmd.startsWith('inquiry-')){await r.controller?.handleInquiryCommand(cmd,id);return true;}
  if(!cmd.startsWith('workspace-'))return false;
  if(r.pending)return true;
  if(cmd==='workspace-action'){
   if(r.selection.agentId){orderForAgent(r.id,r.selection.agentId,id);return true;}
   r.selection={group:r.selection.group,type:id,boost:false};refresh();
   r.el.querySelector('.country-operation-types [aria-pressed="true"]')?.focus({preventScroll:true});
  }
  if(cmd==='workspace-proof'){
   r.selection.target=id;r.selection.message='';refresh();
   r.el.querySelector('.country-proof-choice[aria-pressed="true"]')?.focus();
  }
  if(cmd==='workspace-agent'){
   r.selection.agent=id;r.selection.message='';refresh();
   r.el.querySelector('.country-operation-choice[aria-pressed="true"]')?.focus({preventScroll:true});
  }
  if(cmd==='workspace-boost'){
   r.selection.boost=!r.selection.boost;refresh();
   r.el.querySelector('[data-cmd="workspace-boost"]')?.focus({preventScroll:true});
  }
  if(cmd==='workspace-confirm'){
   const s=api.state(),m=countryOperationModel(s,r.id,r.selection),row=m.selected,reason=api.readOnlyReason()||row?.reason||(!row?'Agent indisponible.':'');
   if(reason){api.notify(reason);refresh();return true;}
   r.pending=true;refresh();
   try{await api.assign({id:row.a.id,type:m.type,target:row.target,useCredits:!!r.selection.boost});r.selection.message=`${row.a.name} · ${ACTIONS[m.type].name} : ordre confirmé.`;r.selection.agent=null;r.selection.boost=false;}
   catch(e){api.notify(e.message);r.selection.message=e.message;}
   finally{r.pending=false;refresh();}
  }
  return true;
 }
 function change(el){
  const root=el.closest('[data-workspace-window]'),r=root&&windows.get(root.dataset.workspaceWindow);if(!r)return false;
  if(el.matches('[data-country-target]')){
   r.selection.target=el.value;r.selection.message='';refresh();
   r.el.querySelector('[data-country-target]')?.focus({preventScroll:true});
  }else r.controller?.handleInquiryChange(el);
  return true;
 }
 return {country,agent:api.openAgent,inquiry,command,change,refresh,readOnlyReason:api.readOnlyReason,clear:()=>windows.clear()};
}
