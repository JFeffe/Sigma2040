import test from 'node:test';
import assert from 'node:assert/strict';
import {ROSTER,SUSPECTS} from '../dist/client/data.js';
import {CRIMINAL_POOL} from '../dist/client/criminal-roster.js';
import {BUILD_VERSION} from '../dist/client/build-version.js';
import {wikiResults} from '../dist/client/wiki.js';

const {gameLanguage,languageSettingsMarkup,setGameLanguage,translateText}=await import(`../dist/client/localization.js?v=${BUILD_VERSION}`);
const {patchNotesPage}=await import(`../dist/client/patch-notes.js?v=${BUILD_VERSION}`);
const {createTutorialGame,TUTORIAL_MISSIONS}=await import(`../dist/client/tutorial.js?v=${BUILD_VERSION}`);
const {tutorialHint}=await import(`../dist/client/tutorial-rules.js?v=${BUILD_VERSION}`);

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
  assert.equal(translateText('Enlèvement d’un agent de liaison · fin du tour 13'),'Abduction · end of turn 13');
  assert.equal(translateText('+25 crise si non protégée · Menace non couverte'),'+25 crisis if unprotected · Threat not covered');
  assert.equal(translateText('Protection de votre pays jusqu’à fin T13.'),'Protected by your country through turn 13.');
  assert.equal(translateText('1 tour pour agir'),'1 turn to act');
  assert.equal(translateText('3 tours pour agir'),'3 turns to act');
  assert.match(translateText('Fin de préparation : T13 · Trop tard pour cette attaque.'),/· Too late for this attack\.$/);
  assert.match(translateText('Déjà couverte par États-Unis · jusqu’à T14.'),/^Already covered by United States/);
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

test('English training instructions localize lessons, assigned actions, and visible targets independently',()=>{
 setGameLanguage('en');
 try{
  const hints=Object.fromEntries(TUTORIAL_MISSIONS.map(({id})=>[id,tutorialHint(createTutorialGame(id))]));
  assert.match(hints.inquiry,/Assign BISHOP to gather evidence/);
  assert.match(hints.inquiry,/BISHOP: Gather evidence \(Vesper\)\. APÉRO: Verify evidence \(Transfers to a relay warehouse\)\./);
  assert.match(hints.basics,/IRIS: Travel with passport \(Germany\)/);
  assert.match(hints.shield,/open the agent profile and choose Country hack/);
  for(const hint of Object.values(hints))assert.doesNotMatch(hint,/\b(?:Affectez|Recueillir|Vérifier|Protéger|Allemagne)\b|s0-e0|fiche agent/);
 }finally{
  setGameLanguage('fr');
 }
});
