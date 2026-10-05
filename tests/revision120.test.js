import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/client/engine.js';
import {COUNTRY,DEFAULT_TEAM_IDS} from '../dist/client/data.js';
import {createInquiryTracker,inquiryIndicator} from '../dist/client/inquiry-notifications.js';
import {gameShell} from '../dist/client/shell.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';
import {mainMenu} from '../dist/client/main-menu.js';
const fresh=(seed=42)=>E.createGame('FR',DEFAULT_TEAM_IDS,seed);
test('Every initial attack targets a secondary country over 1000 seeds',()=>{for(let seed=1;seed<=1000;seed++){const s=fresh(seed);assert.equal(s.plots.length,17);for(const p of s.plots)assert.ok(!COUNTRY[p.country].power);}});
test('Initial dossiers are unread; reading persists and hides alerts until next turn',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},tracker=createInquiryTracker(storage),s=fresh();
 assert.equal(tracker.count(s),2);assert.equal(inquiryIndicator(s,tracker.count(s)).badge,'2');
 tracker.read(s);assert.equal(tracker.count(s),0);assert.equal(createInquiryTracker(storage).unread(s),false);assert.equal(tracker.dismissed(s).inquiry,true);
 const t=s.suspects.find(t=>!s.factions.FR.known[t.id]);s.factions.FR.known[t.id]={};assert.equal(tracker.count(s),1);
 tracker.read(s,undefined,'operations');assert.equal(tracker.dismissed(s).operations,true);s.turn++;assert.equal(tracker.dismissed(s).operations,false);assert.equal(tracker.dismissed(s).inquiry,false);
 assert.equal(tracker.count(s,'another-room'),3);assert.equal(tracker.count({...s,player:'US'}),2);
});
test('Contested and closed-case evidence never adds a pending verification; nav order and main menu build are correct',()=>{
 const s=fresh(),t=s.suspects[0],p=s.proofs.find(p=>p.suspect===t.id);s.factions.FR.evidence=[{id:p.id,contested:true}];assert.equal(inquiryIndicator(s),null);s.factions.FR.evidence[0].contested=false;t.arrested=true;assert.equal(inquiryIndicator(s),null);
 const html=gameShell(s,'world','',false,'',true);assert.match(html,/nav-available nav-inquiry/);assert.ok(html.indexOf('data-id="government"')<html.indexOf('data-id="diplomacy"'));assert.ok(mainMenu(s).includes('class="menu-build">BUILD '+BUILD_VERSION));
});
