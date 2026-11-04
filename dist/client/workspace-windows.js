import {createFloatingWindows} from './floating-windows.js?v=220';
import {createCountryInquiryController} from './country-inquiry.js?v=220';
import {countryOperationsMarkup,countryOperationModel,floatingAgentMarkup} from './country-operations.js?v=220';
import {countryTargetButtons} from './country-inquiry.js?v=220';
import {COUNTRY,ACTIONS} from './data.js?v=220';
import {visibleTeam} from './cooperative.js?v=220';

export function createGameWorkspace(api){
 const windows=createFloatingWindows();let context=null;
 function refresh(){
  const s=api.state(),next=s?api.context():null;
  if(context!==next){windows.clear();context=next;}
  const active=api.active();windows.setVisible(active);if(!active||!s)return;
  for(const r of windows.values()){
   if(r.kind==='country')r.setHTML(countryOperationsMarkup(s,r.id,r.selection,r.pending?'Confirmation en cours…':api.readOnlyReason()));
   if(r.kind==='territory')r.setHTML(countryTargetButtons(s,r.id));
   if(r.kind==='agent')r.setHTML(floatingAgentMarkup(s,r.id));
   if(r.controller)r.controller.refreshCountryInquiry();
  }
 }
 function country(id,preferred=null,agent=null){
  if(!COUNTRY[id]||!api.active())return;if(COUNTRY[id].power&&id!==api.state().player){api.selectCountry(id);return;}
  api.showWorld();refresh();const key='country:'+id,r=windows.open(key,'Pays · '+COUNTRY[id].name,{width:440});r.kind='country';r.id=id;r.selection??={boost:false};
  if(preferred){r.selection.type=preferred;r.selection.agent=agent;r.selection.message='';}refresh();
 }
 function agent(id){api.openAgent(id);}
 function inquiry(id,threat=false){
  if(!api.active())return;api.showWorld();refresh();const key=(threat?'threat:':'case:')+id,existing=windows.get(key);
  if(existing){windows.open(key,'');return;}
  const s=api.state(),title=threat?'Menace':'Dossier · '+(s.suspects.find(t=>t.id===id)?.name||id),r=windows.open(key,title,{width:480,className:'country-inquiry-modal'});
  r.controller=createCountryInquiryController({...api,modal:r.el,openAgent:agent,showModal(html){r.setHTML(html);}});r.controller.openCountryInquiry(id,threat);
  if(!r.el.querySelector('.country-inquiry'))r.close();
 }
 async function command(cmd,id,el){
  if(cmd==='workspace-inquiry'){const r=windows.open('territory:'+id,'Enquête · '+COUNTRY[id].name,{width:440});r.kind='territory';r.id=id;refresh();return true;}
  if(cmd==='workspace-country'){country(id,el?.dataset.type||null);return true;}
  if(cmd==='country-inquiry'||cmd==='country-threat'||cmd==='suspect'){inquiry(id,cmd==='country-threat');return true;}
  if(cmd==='workspace-deploy'){api.deploy(id);return true;}
  const root=el?.closest('[data-workspace-window]'),r=root&&windows.get(root.dataset.workspaceWindow);if(!r)return false;
  if(cmd.startsWith('inquiry-')){await r.controller?.handleInquiryCommand(cmd,id);return true;}
  if(cmd==='workspace-deploy'){api.deploy(r.id);return true;}
  if(!cmd.startsWith('workspace-'))return false;
  if(r.pending)return true;
  if(cmd==='workspace-action'){r.selection={type:id,boost:false};refresh();}
  if(cmd==='workspace-agent'){r.selection.agent=id;r.selection.message='';refresh();}
  if(cmd==='workspace-boost'){r.selection.boost=!r.selection.boost;refresh();}
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
 function change(el){const root=el.closest('[data-workspace-window]'),r=root&&windows.get(root.dataset.workspaceWindow);if(!r)return false;if(el.matches('[data-country-target]')){r.selection.target=el.value;r.selection.message='';refresh();}else r.controller?.handleInquiryChange(el);return true;}
 return {country,agent,inquiry,command,change,refresh,clear:()=>windows.clear()};
}
