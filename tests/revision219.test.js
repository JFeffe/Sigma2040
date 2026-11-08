import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,COUNTRIES} from '../dist/client/data.js';
import {countryOperationTypes,floatingAgentMarkup} from '../dist/client/country-operations.js';
import {activeAttackDelays,attackDelayBanner,dismissAttackDelays} from '../dist/client/attack-delay-ui.js';
test('Protection stays contextual and outside the country action menus',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,219);
 for(const c of COUNTRIES)for(const group of [null,'access'])assert.ok(!countryOperationTypes(s,c.id,group).includes('protect'));
 const [agent]=E.team(s),[plot]=E.visiblePlots(s);
 agent.country=plot.country;
 assert.match(floatingAgentMarkup(s,agent.id),new RegExp('data-cmd="country-threat"[^>]*data-id="'+plot.id+'"'));
 assert.doesNotMatch(floatingAgentMarkup(s,agent.id),/data-type="protect"/);
 agent.country=COUNTRIES.find(c=>!c.power&&!c.expansion&&!E.visiblePlots(s).some(p=>p.country===c.id)).id;
 assert.doesNotMatch(floatingAgentMarkup(s,agent.id),/data-type="protect"/);
});
test('Dismissing an attack notice preserves threat data and shows a subsequent postponement',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,21901),p=s.plots[0];p.announced=true;p.turn=7;
 s.attackDelayReports=[{plotId:p.id,country:p.country,cell:p.cell,reason:'protection',oldTurn:5,attackTurn:7}];
 const before=JSON.stringify(s);assert.match(attackDelayBanner(s),/dismiss-attack-delays/);
 dismissAttackDelays(s);assert.equal(attackDelayBanner(s),'');assert.equal(JSON.stringify(s),before);assert.equal(activeAttackDelays(s).length,1);
 assert.equal(attackDelayBanner(structuredClone(s)),'');
 s.attackDelayReports[0].oldTurn=7;s.attackDelayReports[0].attackTurn=9;p.turn=9;
 assert.match(attackDelayBanner(s),/Fin T7 → fin T9/);
});
