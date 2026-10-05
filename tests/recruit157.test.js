import test from 'node:test';
import assert from 'node:assert/strict';
import {DISPLAY_ROSTER} from '../dist/client/data.js?v=173';
import {resetRecruitFilters,recruitSlots,toggleRecruitSelection,setRecruitView,isRecruitPortrait,setRecruitFilter,selectedRecruitSlots,recruitCard} from '../dist/client/recruit-selection.js?v=173';
import {setupScreen} from '../dist/client/screens.js';
test('Selection fills the leftmost vacancy without moving the chief; solo and multiplayer are independent',()=>{
 for(const mode of ['solo','multi']){
  resetRecruitFilters(mode);let ids=[];
  for(const id of ['p0','p12','p13','p14'])ids=toggleRecruitSelection(ids,id,mode);
  ids=toggleRecruitSelection(ids,'p12',mode);
  assert.deepEqual(recruitSlots(ids,mode),['p0',null,'p13','p14']);
  ids=toggleRecruitSelection(ids,'p26',mode);
  assert.deepEqual(ids,['p0','p26','p13','p14']);
  assert.deepEqual(toggleRecruitSelection(ids,'p25',mode),ids);
  ids=toggleRecruitSelection(ids,'p0',mode);
  assert.deepEqual(recruitSlots(ids,mode),[null,'p26','p13','p14']);
  ids=toggleRecruitSelection(ids,'p25',mode);
  assert.deepEqual(ids,['p25','p26','p13','p14']);
  const slots=selectedRecruitSlots(ids,mode);
  assert.equal((slots.match(/class="selected-recruit-slot /g)||[]).length,4);
  assert.equal((slots.match(/class="recruit-chief"/g)||[]).length,1);
  resetRecruitFilters(mode);
 }
});
test('Flip all includes filtered-out cards, persists through sorting, and never modifies selection or talents',()=>{
 resetRecruitFilters('solo');resetRecruitFilters('multi');
 const ids=['p0','p12','p13','p14'],snapshot=JSON.stringify(DISPLAY_ROSTER);
 setRecruitFilter('solo','talent','secours');setRecruitView('solo',null,true);
 for(const a of DISPLAY_ROSTER)assert.ok(isRecruitPortrait(a.id,'solo'));
 setRecruitView('solo','p0',false);setRecruitFilter('solo','sort','1');
 assert.equal(isRecruitPortrait('p0','solo'),false);assert.equal(isRecruitPortrait('p12','solo'),true);
 assert.equal(isRecruitPortrait('p12','multi'),false);
 for(const mode of ['solo','multi']){
  const html=setupScreen('FR',ids,false,mode==='multi'?{}:null);
  assert.ok(html.indexOf('selected-recruits')<html.indexOf('recruit-controls'));
  assert.ok(!html.includes('PROTOCOLE D’ACTIVATION'));
  assert.ok(!html.includes('2040. Six puissances.'));
  const card=recruitCard(DISPLAY_ROSTER[0],ids,mode);
  assert.equal((card.match(/data-cmd="recruit-flip"/g)||[]).length,2);
  assert.ok(card.includes(mode==='multi'?'data-cmd="mp-select"':'data-cmd="select-recruit"'));
  const back=card.slice(card.indexOf('class="recruit-face recruit-back"'));
  assert.ok(!back.includes(DISPLAY_ROSTER[0].role));
  assert.ok(back.includes('portrait-stats'));assert.ok(back.includes('portrait-talents'));
 }
 assert.deepEqual(ids,['p0','p12','p13','p14']);assert.equal(JSON.stringify(DISPLAY_ROSTER),snapshot);
 resetRecruitFilters('solo');resetRecruitFilters('multi');
});
