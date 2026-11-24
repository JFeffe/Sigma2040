import * as D from '../dist/client/game-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRIES,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {countryOperationTypes} from '../dist/client/country-operations.js';
import {countryOptions} from '../dist/client/presentation.js';
import {assignDeployment} from '../dist/client/deployment.js';
import {countryOperationsMarkup,floatingAgentMarkup} from '../dist/client/country-operations.js';
import {icon} from '../dist/client/ui.js';
import {makeScreens} from '../dist/client/screens.js';
import {createCamera} from '../dist/client/globe.js';
const fresh=()=>{const s=E.createGame('FR',DEFAULT_TEAM_IDS,42);s.humanFactions=Object.keys(s.factions);return s;};
test('Every team is blocked from other superpowers by passport, clandestine travel and local actions; own HQ remains usable',()=>{
 const s=fresh();for(const a of s.agents){for(const c of COUNTRIES.filter(c=>c.power&&c.id!==a.faction)){
  for(const type of ['travel','sneak']){assert.match(E.options(s,a.id,type,c.id).error,/Superpuissance/);assert.throws(()=>E.assign(s,a.id,type,c.id),/Superpuissance/);}
  a.country=c.id;for(const type of ['equip','contacts','drone','protect','hide'])assert.match(E.options(s,a.id,type).error,/Superpuissance/);
  assert.equal(E.options(s,a.id,'travel',a.faction).error,null);a.country=a.faction;
 }assert.equal(E.options(s,a.id,'rest').error,null);assert.equal(E.options(s,a.id,'travel','DE').error,null);}
 assert.throws(()=>assignDeployment(s,[E.team(s)[0].id],'travel','US'),/Superpuissance/);assert.deepEqual(countryOperationTypes(s,'US'),[]);
 const h=countryOptions('FR','DE',false,'FR');assert.match(h,/value="FR"/);assert.doesNotMatch(h,/value="(?:US|CN|IN|RU|GB)"/);
});
test('Legacy forbidden queued orders are cancelled before fatigue, equipment loss or movement; safe return remains possible',()=>{
 const s=fresh(),a=E.team(s)[0];E.assign(s,a.id,'travel','JP');a.task.target='US';a.weapon=true;const fatigue=a.fatigue;E.advance(s);assert.equal(a.country,'FR');assert.equal(a.task,null);assert.equal(a.fatigue,fatigue);assert.ok(a.weapon);
 a.country='US';if(s.event)E.answerEvent(s,1);E.assign(s,a.id,'travel','FR');for(let i=0;i<2;i++){if(s.event)E.answerEvent(s,1);E.advance(s);}assert.equal(a.country,'FR');
});
test('Sidebar shows agent details on selection, superpower artwork without actions, and separate access and deployment controls',()=>{
 const s=fresh(),a=E.team(s)[0],camera=createCamera();camera.panelOpen=true;
 const agent=makeScreens(s,'FR',a.id,null,camera).world();assert.match(agent,/agent-sidebar/);assert.match(agent,/floating-agent/);assert.match(agent,/Énergie/);
 const power=makeScreens(s,'US',null,null,camera).world().split('class="map-dossier ')[1].split('<div class="world-overview">')[0];assert.match(power,/power-sidebar-art/);assert.match(power,/consultation uniquement/);assert.doesNotMatch(power,/data-cmd="workspace-(deploy|country)"/);
 const country=makeScreens(s,'JP',null,null,camera).world().split('class="map-dossier ')[1].split('<div class="world-overview">')[0];assert.match(country,/compact-country-signals/);assert.doesNotMatch(country,/data-group="access"/);assert.match(country,/data-cmd="country-inquiry"/);assert.ok(country.indexOf('Déployer un agent')<country.indexOf('Hack du pays'));
 assert.doesNotMatch(agent,/<details class="map-dossier/);
 camera.panelOpen=false;
 assert.doesNotMatch(makeScreens(s,'JP',null,null,camera).world(),/class="map-dossier /);
});
test('Cooperative diplomacy other countries exclude all six superpowers, even inactive ones',()=>{
 const d=D.createDraft(['FR','US'],42,'cooperative');while(D.draftCountry(d))D.pickDraftAgent(d,D.draftCountry(d),D.availableDraftAgents(d)[0].id);const s=E.createGame('FR',d.teams.FR,42,'normal',{gameMode:'cooperative',participants:d.countries,teams:d.teams});const html=makeScreens(s,'FR',null,null,createCamera()).diplomacy().split('diplomacy-countries')[1].split('</section>')[0];
 for(const c of COUNTRIES.filter(c=>!c.power&&!c.expansion))assert.ok(html.includes(c.name));for(const c of COUNTRIES.filter(c=>c.power))assert.ok(!html.includes('<h3>'+c.name+'</h3>'));
});

test('Diplomacy lists the active powers by descending prestige before the operation countries',()=>{
 const s=E.createConfiguredGame('FR',DEFAULT_TEAM_IDS,42),powers=Object.keys(s.factions);
 assert.equal(powers.length,4);
 powers.forEach((id,index)=>{s.factions[id].score=5*index;});
 const territory=s.operationCountries[0],player=s.factions.FR;
 player.access[territory]=true;player.cooperation[territory]=4;
 const html=makeScreens(s,'FR',null,null,createCamera()).diplomacy();
 const [,powerCards,otherCards]=html.split(/diplomacy-(?:powers|countries)/);
 const ids=cards=>[...cards.matchAll(/data-country="([A-Z]+)"/g)].map(match=>match[1]);
 assert.deepEqual(ids(powerCards),[...powers].reverse());
 assert.deepEqual(ids(otherCards),s.operationCountries);
 assert.match(powerCards,/<strong class="diplomacy-score">15 <small>pts<\/small>/);
 const indicators=cards=>[...cards.matchAll(/<div class="diplomacy-signals"[^>]*>([\s\S]*?)<\/div>/g)].map(match=>match[1]);
 const territoryIndicators=indicators(otherCards);
 assert.equal(indicators(powerCards).length,0);
 assert.equal(territoryIndicators.length,s.operationCountries.length);
 for(const row of territoryIndicators)assert.equal((row.match(/role="img"/g)||[]).length,6);
 const ownPowerCard=powerCards.split('data-country="FR"')[1].split('</article>')[0];
 assert.match(ownPowerCard,/data-id="government"/);
 assert.match(territoryIndicators[0],/aria-label="Accès : actif"/);
 assert.match(territoryIndicators[0],/aria-label="Coopération : Soutien total" data-level="4"/);
});

test('The agent fiche pairs weapon availability with a color-coded discretion meter',()=>{
 const s=fresh(),a=E.team(s)[0];
 for(const [exposure,weapon,tone,label,bars] of [[0,true,'green','Discret',1],[84,false,'red','Très exposé',5]]){
  Object.assign(a,{exposure,weapon});
  const html=floatingAgentMarkup(s,a.id),gear=html.match(/<div class="floating-agent-gear">(.*?)<\/div>/s)[1];
  assert.ok(gear.includes(icon('pistol')+`<span class="sr-only">Arme</span>${weapon?'Avec':'Sans'}`));
  assert.ok(gear.includes(`discretion-meter reading-${tone}`));
  assert.equal([...gear.matchAll(/opacity="1"/g)].length,bars);
  assert.ok(gear.trimEnd().endsWith(`</svg>${label}</span>`));
  assert.equal(html.replace(/<template>[\s\S]*?<\/template>/g,'').split(label).length,2);
 }
});

test('The globe omits the campaign objective strip and puts the foreign-agent toggle beside the team',()=>{
 const camera=createCamera(),regular=fresh();
 const html=makeScreens(regular,'FR',null,null,camera).world();
 assert.doesNotMatch(html,/objective-strip|data-map="(?:dome|globe|routes|intel)"/);
 assert.match(html,/class="field-team panel">[\s\S]*data-map="foreign" aria-pressed="true" aria-label="Agents étrangers" title="Agents étrangers">[\s\S]*class="team-grid"/);
 const d=D.createDraft(['FR','US'],42,'cooperative');
 while(D.draftCountry(d))D.pickDraftAgent(d,D.draftCountry(d),D.availableDraftAgents(d)[0].id);
 const coop=E.createConfiguredGame('FR',d.teams.FR,42,'bb2',{gameMode:'cooperative',participants:d.countries,teams:d.teams});
 coop.suspects.find(t=>t.id==='s6').arrested=true;
 assert.doesNotMatch(makeScreens(coop,'FR',null,null,camera).world(),/objective-strip/);
});

test('Country panels put artwork and live status ahead of the scrolling actions',()=>{
 const s=fresh(),camera=createCamera();camera.panelOpen=true;
 s.factions.FR.access.BR=true;
 const html=makeScreens(s,'BR',null,null,camera).world();
 assert.doesNotMatch(html,/world-window-shortcut|Ouvrir Brésil/);
 assert.match(html,/country-art-header is-secondary.*Brasília.*compact-country-signals.*Accès : actif.*country-sidebar-scroll/s);
 assert.match(html,/data-rich-tooltip aria-label="Coopération : /);
 assert.match(html,/Hostile.*Réticente.*Neutre.*Favorable.*Soutien total.*country-sidebar-scroll/s);
 assert.match(countryOperationsMarkup(s,'BR',{group:'access'}),/country-operations-heading.*country-art-header is-secondary.*Brasília.*Accès : actif.*<\/header>/s);
 assert.match(makeScreens(s,'US',null,null,camera).world(),/country-art-header is-power.*Washington/s);
});
