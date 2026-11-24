import {GAME_MODES} from './game-setup.js?v=244';
import {backToMainMenu,menuSkyMarkup} from './main-menu.js?v=244';
import {brand,button,icon} from './ui.js?v=244';

function gameChoice(label,description,symbol,command,{mode,featured=false}={}){
 return button(`<span class="game-choice-icon">${icon(symbol)}</span>
  <span class="game-choice-copy"><strong>${label}</strong><small>${description}</small></span>
  <span class="game-choice-arrow">${icon(featured?'arrow':'chevron')}</span>`,
  command,`game-choice${featured?' game-choice-featured':''}`,mode?`data-id="${mode}"`:'');
}

export function newGameMenu(){
 return `<main class="command-menu new-game-menu">
  <header class="command-menu-header">${brand()}${backToMainMenu()}</header>
  <nav class="new-game-content" aria-label="Choisir un mode de jeu">
   <div class="new-game-hero">
    <div class="new-game-sky" aria-hidden="true">${menuSkyMarkup()}</div>
    <div class="new-game-intro">
     <h1 tabindex="-1" id="newGameTitle">Nouvelle partie</h1>
     ${gameChoice(GAME_MODES.regular,'Choisissez vos agents et lancez une campagne solo.','target','new-mode',{mode:'regular',featured:true})}
    </div>
   </div>
   <div class="new-game-alternates">
    ${gameChoice(GAME_MODES.advanced,'Repêchez vos agents à tour de rôle avant la campagne.','case','new-mode',{mode:'advanced'})}
    ${gameChoice(GAME_MODES.cooperative,'Affrontez Fracture avec un allié contrôlé par le jeu.','shield','new-mode',{mode:'cooperative'})}
    ${gameChoice('Multijoueur','Créez un salon ou rejoignez une partie avec une invitation.','people','mp-entry')}
    ${gameChoice('Tutoriel','Apprenez à jouer avec la formation Filigrane.','file','tutorial-menu')}
   </div>
  </nav>
 </main>`;
}
