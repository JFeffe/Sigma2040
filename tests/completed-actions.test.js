import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {actionOptions,locationActions} from '../dist/client/presentation.js';

const fresh=()=>E.createGame('FR',['p0','p12','p13','p14'],42);

test('Completed local access, safehouse and mandate stay visible but cannot spend credits again',()=>{
 const s=fresh(),a=s.agents[0],f=s.factions.FR;a.country='DE';
 f.access.DE=true;f.authorized.DE=true;f.safehouses.push('DE');
 const allowed=locationActions(a,s);
 for(const type of ['contacts','findSafehouse','authorize']){
  assert.ok(allowed.some(([id])=>id===type));
  assert.match(E.options(s,a.id,type).error,/terminée/);
  const before=f.budget;assert.throws(()=>E.assign(s,a.id,type));assert.equal(f.budget,before);
  assert.match(actionOptions(allowed,type,s,a),new RegExp(`value="${type}"[^>]*class="[^"]*action-complete[^"]*"[^>]*>[^<]*Terminé ✓`));
 }
});
