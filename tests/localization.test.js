import test from 'node:test';
import assert from 'node:assert/strict';
import {ROSTER,SUSPECTS} from '../dist/client/data.js';
import {CRIMINAL_POOL} from '../dist/client/criminal-roster.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';
import {wikiResults} from '../dist/client/wiki.js';

const {gameLanguage,languageSettingsMarkup,setGameLanguage,translateText}=await import(`../dist/client/localization.js?v=${BUILD_VERSION}`);
const {patchNotesPage}=await import(`../dist/client/patch-notes.js?v=${BUILD_VERSION}`);

test('the language selector defaults to French and remembers English',async()=>{
 assert.equal(gameLanguage(),'fr');
 assert.match(languageSettingsMarkup(),/value="fr" selected>Français/);
 try{
  assert.equal(setGameLanguage('en'),true);
  assert.match(languageSettingsMarkup(),/value="en" selected>English/);
  assert.equal(setGameLanguage('de'),false);
  const reloaded=await import('../dist/client/localization.js?language-preference-test');
  assert.equal(reloaded.gameLanguage(),'en');
 }finally{
  setGameLanguage('fr');
 }
 assert.equal(translateText('Paramètres'),'Paramètres');
});

test('English localizes campaign text and wiki searches while preserving character names',()=>{
 setGameLanguage('en');
 try{
  assert.equal(translateText('Paramètres'),'Settings');
  assert.equal(translateText('Déployer 3 agents'),'Deploy 3 agents');
  assert.equal(translateText('Tour 4 · Ordre planifié'),'Turn 4 · Order scheduled');
  assert.equal(translateText('Pays cible'),'Target country');
  assert.equal(translateText('Turquie'),'Turkey');
  assert.equal(translateText('niveau'),'level');
  assert.equal(translateText('Il faut 25 confiance.'),'Requires 25 confidence.');
  assert.equal(translateText('Effets du module'),'Module details');
  assert.equal(translateText('Tensions mondiales : crise +3.'),'Global tensions increased the crisis level by 3.');
  assert.equal(translateText('L’Architecte'),'The Architect');
  assert.match(patchNotesPage(),new RegExp('UNREAD · LATEST UPDATE · VERSION '+BUILD_VERSION));
  for(const {name} of [...ROSTER,...SUSPECTS,...CRIMINAL_POOL]){
   if(name!=='L’Architecte')assert.equal(translateText(name),name);
  }
  assert.match(wikiResults('qg','warrant'),/class="wiki-section"/);
 }finally{
  setGameLanguage('fr');
 }
});
