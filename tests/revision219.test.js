import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {DEFAULT_TEAM_IDS,COUNTRIES} from '../dist/client/data.js';
import {countryOperationTypes} from '../dist/client/country-operations.js';
import {activeAttackDelays,attackDelayBanner,dismissAttackDelays} from '../dist/client/attack-delay-ui.js';
test('Country protection stays available abroad but is omitted at each player HQ',()=>{
 const s=E.createGame('FR',DEFAULT_TEAM_IDS,219);
 for(const c of COUNTRIES.filter(c=>c.power)){s.player=c.id;assert.ok(!countryOperationTypes(s,c.id).includes('protect'));for(const foreign of COUNTRIES.filter(c=>!c.power))assert.ok(countryOperationTypes(s,foreign.id).includes('protect'));}
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
