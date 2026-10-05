import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {technologyPanel} from '../dist/client/technology-ui.js';
test('Protection and drone share slots with AI; cancellation releases capacity; UI only offers AI',()=>{
 const s=E.createGame('FR',['p0','p1','p2','p3'],17);s.agents[0].country='DE';s.agents[1].country='JP';E.assign(s,'p0','protect');E.assign(s,'p1','drone');assert.equal(E.getTechSlots(s,'FR'),2);assert.throws(()=>E.activateTech(s,'ai'),/occupés/);let html=technologyPanel(s,'FR');assert.match(html,/Protection d’infrastructure/);assert.match(html,/Reconnaissance par drone/);assert.equal((html.match(/data-tech-drag=/g)||[]).length,3);assert.doesNotMatch(html,/console-config|data-cmd="tech-select"/);E.cancel(s,'p0');assert.equal(E.getTechSlots(s,'FR'),1);E.activateTech(s,'ai');assert.equal(E.getTechSlots(s,'FR'),2);assert.throws(()=>E.assign(s,'p0','protect'),/occupés/);
});
