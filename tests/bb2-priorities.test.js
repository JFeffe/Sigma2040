import * as E from '../dist/client/engine.js';import * as D from '../dist/client/game-setup.js';import test from 'node:test';import assert from 'node:assert/strict';
export function fixture(){const d=D.createDraft(['FR','US'],42,'cooperative');d.humans=[];D.advanceNpcDraft(d);const s=E.createGame('FR',d.teams.FR,42,'bb2',{gameMode:'cooperative',participants:d.countries,teams:d.teams});s.humanFactions=['FR','US'];s.plots.forEach(p=>p.resolved=true);const f=s.factions.FR,m=E.team(s,'FR');for(const ff of Object.values(s.factions)){ff.budget=0;ff.confidence=0;ff.evidence.splice(0);for(const k of Object.keys(ff.known))delete ff.known[k];}for(const a of s.agents){a.task=null;a.fatigue=a.exposure=0;a.chief=false;a.weapon=false;a.country=a.faction;a.status='ready';}return {s,f,m};}
export function dossier(s,f,t,c='DE'){t.country=c;f.known[t.id]={country:c,identified:true,intimidated:true,prepared:true,locationUntil:40};f.access[c]=f.authorized[c]=true;f.cooperation[c]=2;for(const p of s.proofs.filter(p=>p.suspect===t.id&&p.authentic).slice(0,2))f.evidence.push({id:p.id,verified:true,contested:false});}


function busy(s,m,free){for(const a of m)if(a!==free)E.assign(s,a.id,'rest');}
test('BB2 lets the field analyst attempt immediate victory even when exhausted',()=>{
 const {s,f,m}=fixture();s.turn=30;s.suspects.filter(t=>[0,1,2].includes(t.cell)).forEach(t=>t.arrested=true);const t=s.suspects.find(t=>t.cell===3);dossier(s,f,t);
 for(const a of m){a.stats=[3,5,7];a.talents=[];}const a=m[0];a.stats=[10,8,9];a.talents=['enquete','informatique'];a.country='DE';a.fatigue=75;busy(s,m,a);
 E.planFaction(s,'FR');assert.equal(a.task?.type,'arrest');assert.equal(a.task.target,t.id);
});
test('BB2 closes the winning third cell rather than a higher-probability fourth-cell arrest',()=>{
 const {s,f,m}=fixture();s.turn=30;s.suspects.filter(t=>[0,1,3].includes(t.cell)).forEach(t=>t.arrested=true);const [t,partner]=s.suspects.filter(t=>t.cell===2);partner.arrested=true;const other=s.suspects.find(t=>t.cell===4);dossier(s,f,t);dossier(s,f,other);f.known[other.id].tacticalArrestBonus=true;
 const a=m[1];a.country='DE';a.stats=[5,5,7];a.talents=[];m[0].stats=[10,10,1];m[0].talents=['enquete','informatique'];busy(s,m,a);E.planFaction(s,'FR');assert.equal(a.task?.target,t.id);
});
test('BB2 prioritizes survival over an unrelated Architect arrest only when crisis requires it',()=>{
 for(const crisis of [12,95]){const {s,f,m}=fixture();s.turn=8;s.crisis=crisis;const t=s.suspects.find(t=>t.cell===3);dossier(s,f,t);Object.assign(s.plots.find(p=>p.cell===0),{resolved:false,turn:9,country:'DE'});const a=m[1];a.country='DE';a.stats=[7,9,8];a.talents=[];m[0].stats=[10,5,1];m[0].talents=['enquete','informatique'];busy(s,m,a);E.planFaction(s,'FR');assert.equal(a.task?.type,crisis===95?'protect':'arrest');}
});
test('BB2 does not treat an already covered attack as a fatal threat',()=>{
 const {s,f,m}=fixture();s.turn=8;s.crisis=95;const t=s.suspects.find(t=>t.cell===3);dossier(s,f,t);Object.assign(s.plots.find(p=>p.cell===0),{resolved:false,turn:9,country:'DE'});s.factions.US.defense.DE=12;const a=m[1];a.country='DE';a.stats=[7,9,8];a.talents=[];m[0].stats=[10,5,1];busy(s,m,a);E.planFaction(s,'FR');assert.equal(a.task?.type,'arrest');
});
test('BB2 counts allied pending evidence across different action types',()=>{
 const {s,f,m}=fixture();const t=s.suspects[0];dossier(s,f,t);f.evidence.splice(1);f.known[t.id].prepared=false;f.known[t.id].intimidated=false;const ally=E.team(s,'US')[0];ally.country='DE';E.assign(s,ally.id,'collect',t.id);
 for(const a of m){a.stats=[3,6,7];a.talents=[];}m[0].stats=[10,5,1];m[0].talents=['enquete','informatique'];const a=m[1];a.country='DE';busy(s,m,a);E.planFaction(s,'FR');assert.ok(!(a.task?.target===t.id&&['collect','hack','intimidate'].includes(a.task.type)));
});
test('BB2 gives immediate victory precedence over a fatal threat and the analyst role',()=>{
 const {s,f,m}=fixture();s.turn=8;s.crisis=95;s.suspects.filter(t=>[0,1,2].includes(t.cell)).forEach(t=>t.arrested=true);const t=s.suspects.find(t=>t.cell===3);dossier(s,f,t);Object.assign(s.plots.find(p=>p.cell===4),{resolved:false,turn:9,country:'DE'});const a=m[0];a.country='DE';a.stats=[10,9,9];a.talents=['enquete','informatique'];busy(s,m,a);E.planFaction(s,'FR');assert.equal(a.task?.type,'arrest');assert.equal(a.task.target,t.id);
});
test('BB2 crisis response respects an allied protection already in progress',()=>{
 const {s,f,m}=fixture();s.turn=8;s.crisis=95;const t=s.suspects.find(t=>t.cell===3);dossier(s,f,t);Object.assign(s.plots.find(p=>p.cell===0),{resolved:false,turn:9,country:'DE'});const ally=E.team(s,'US')[0];ally.country='DE';E.assign(s,ally.id,'protect');const a=m[1];a.country='DE';a.stats=[7,9,8];a.talents=[];m[0].stats=[10,5,1];busy(s,m,a);E.planFaction(s,'FR');assert.equal(a.task?.type,'arrest');
});
test('BB2 final-cell goal follows legacy cooperative saves as well as shared ones',()=>{
 for(const marker of [undefined,1,2]){const {s,f,m}=fixture();if(marker===undefined)delete s.coopCampaignRules;else s.coopCampaignRules=marker;s.turn=30;s.suspects.filter(t=>t.cell===0||t.cell===3).forEach(t=>t.arrested=true);const [t,partner]=s.suspects.filter(t=>t.cell===1);partner.arrested=true;dossier(s,f,t);const a=m[0];a.country='DE';a.stats=[10,8,9];a.talents=['enquete','informatique'];busy(s,m,a);E.planFaction(s,'FR');const terminal=f.bb2.decisions.some(d=>d.reason==='Priorité absolue : tenter la victoire immédiate.');assert.equal(terminal,marker===undefined);}
});
