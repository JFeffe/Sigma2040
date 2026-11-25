import {GAME_MODES} from './game-setup.js?v=246';
import {brand,button,icon} from './ui.js?v=246';

const modeSymbols={
 regular:['M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M5.5 12l6.5-6.5 6.5 6.5-6.5 6.5Z','M9.5 12h5M12 9.5v5'],
 advanced:['M4 8h16l2 2v9l-2 2H4l-2-2v-9Zm4 0V5l1-1h6l1 1v3M2 13h20','M9.5 13v2.5h5V13'],
 cooperative:['m12 3 8.5 3.5V13l-3 4.5L12 21l-5.5-3.5-3-4.5V6.5Z','m7.5 12.5 3 3 5.5-6'],
 multiplayer:['M3 7l3-3h4l3 3v4l-3 3H6l-3-3Zm9 9H7l-4 3v2m12-17h3l3 3v4l-3 3h-3m1 2h2l3 3v2','M8 9h.01M16 9h.01'],
 tutorial:['M5 3h9l5 5v11l-2 2H5l-1-1V4Zm9 0v5h5M8 16h7','m8 11 2 2 4-4']
};

function gameChoice(label,description,symbol,command,{mode,featured=false}={}){
 const [outline,accent]=modeSymbols[symbol];
 return button(`<span class="game-choice-icon" aria-hidden="true">
   <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="${outline}"/><path class="game-choice-accent" d="${accent}"/>
   </svg>
  </span>
  <span class="game-choice-copy"><strong>${label}</strong><small>${description}</small></span>
  <span class="game-choice-arrow">${icon(featured?'arrow':'chevron')}</span>`,
  command,`game-choice${featured?' game-choice-featured':''}`,mode?`data-id="${mode}"`:'');
}

export function newGameMenu(){
 return `<main class="command-menu new-game-menu">
  <header class="command-menu-header">${brand()}</header>
  <nav class="new-game-content" aria-label="Choisir un mode de jeu">
   <div class="new-game-hero">
    <div class="new-game-intro">
     <h1 tabindex="-1" id="newGameTitle">Nouvelle partie</h1>
     ${gameChoice(GAME_MODES.regular,'Choisissez vos agents et lancez une campagne solo.','regular','new-mode',{mode:'regular',featured:true})}
    </div>
   </div>
   <div class="new-game-alternates">
    ${gameChoice(GAME_MODES.advanced,'Repêchez vos agents à tour de rôle avant la campagne.','advanced','new-mode',{mode:'advanced'})}
    ${gameChoice(GAME_MODES.cooperative,'Affrontez Fracture avec un allié contrôlé par le jeu.','cooperative','new-mode',{mode:'cooperative'})}
    ${gameChoice('Multijoueur','Créez un salon ou rejoignez une partie avec une invitation.','multiplayer','mp-entry')}
    ${gameChoice('Tutoriel','Apprenez à jouer avec la formation Filigrane.','tutorial','tutorial-menu')}
   </div>
  </nav>
 </main>`;
}
