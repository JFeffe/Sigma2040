import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILD_VERSION} from '../dist/client/build-version.js';
const {DISPLAY_ROSTER}=await import('../dist/client/data.js?v='+BUILD_VERSION);
const {setRecruitFilter,resetRecruitFilters,visibleRecruits,recruitSlots}=await import('../dist/client/recruit-selection.js?v='+BUILD_VERSION);
const {setupScreen}=await import('../dist/client/screens.js?v='+BUILD_VERSION);
const {draftScreen}=await import('../dist/client/draft-ui.js?v='+BUILD_VERSION);
const {createDraft}=await import('../dist/client/game-setup.js?v='+BUILD_VERSION);
const expected={
 protecteur:['NOX','VIKTOR','MIRA','LINK'],
 intervenant:['LEI','RAVEN','MONROE','MERCER','MARLOWE'],
 bureaucrate:['APÉRO','SELIN','ROCKET'],
 diplomate:['IRIS','ADLER','ALBA','AMBER'],
 enqueteur:['BISHOP','DANTE','TARA','MIDNIGHT']
};
const cardIds=html=>[...html.matchAll(/data-recruit-id="([^"]+)"/g)].map(m=>m[1]);
const typeLabels=html=>[...html.match(/<select id="recruit-type"[^>]*>(.*?)<\/select>/)[1].matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map(m=>m[1]);
const expectedLabels=['Tous les agents','Protecteur','Intervenant','Bureaucrate','Diplomate','Enquêteur'];
test('Recruit categories cover the approved roster once, combine with existing filters, and preserve selections',()=>{
 for(const mode of ['solo','multi']){
  resetRecruitFilters(mode);const selected=['p0','p12','p13','p14'];recruitSlots(selected,mode);const seen=[];
  for(const [type,names] of Object.entries(expected)){
   setRecruitFilter(mode,'type',type);const list=visibleRecruits(mode);assert.deepEqual(list.map(a=>a.name).sort(),[...names].sort());seen.push(...list.map(a=>a.id));
   setRecruitFilter(mode,'talent','surveillance');assert.deepEqual(visibleRecruits(mode),list.filter(a=>a.talents.includes('surveillance')));setRecruitFilter(mode,'talent','');
   setRecruitFilter(mode,'availableOnly',true);assert.deepEqual(visibleRecruits(mode,new Set(list.map(a=>a.id))),[]);setRecruitFilter(mode,'availableOnly',false);
   assert.deepEqual(recruitSlots(selected,mode),selected);
  }
  assert.equal(new Set(seen).size,20);assert.equal(seen.length,20);
  setRecruitFilter(mode,'type','');assert.equal(visibleRecruits(mode).length,20);resetRecruitFilters(mode);
 }
 setRecruitFilter('solo','type','protecteur');assert.equal(visibleRecruits('multi').length,20);setRecruitFilter('solo','type','invalid');assert.equal(visibleRecruits('solo').length,4);resetRecruitFilters('solo');
});
test('Normal, advanced and cooperative selection surfaces filter cards in solo and multiplayer without altering drafts',()=>{
 for(const multi of [false,true]){
  const mode=multi?'multi':'solo';resetRecruitFilters(mode);setRecruitFilter(mode,'type','protecteur');
  const wanted=visibleRecruits(mode).map(a=>a.id);
  const normal=setupScreen('FR',['p0','p12','p13','p14'],false,multi?{}:null);
  assert.deepEqual(cardIds(normal),wanted);assert.match(normal,/4 \/ 4 agents sélectionnés/);assert.deepEqual(typeLabels(normal),expectedLabels);
  for(const gameMode of ['advanced','cooperative']){
   const draft=createDraft(['FR'],226,gameMode);const before=JSON.stringify(draft);
   const html=draftScreen(draft,'FR',{multi});assert.deepEqual(cardIds(html),wanted);assert.deepEqual(typeLabels(html),expectedLabels);assert.match(html,/value="protecteur" selected/);assert.equal(JSON.stringify(draft),before);
  }
  setRecruitFilter(mode,'type','');assert.equal(cardIds(setupScreen('FR',[],false,multi?{}:null)).length,20);resetRecruitFilters(mode);
 }
});
