import {readPreference,writePreference} from './browser-preferences.js?v=179';
// Interface-only preference: never modifies campaign saves or multiplayer rules.
const KEY='sigma2040-mods';
export const bureauEnabled=()=>{try{return JSON.parse(readPreference(KEY,'{}')).bureau===true;}catch{return false;}};
export function setBureauEnabled(value){return writePreference(KEY,JSON.stringify({bureau:value===true}));}
export function modsMarkup(){return `<section class="feedback-settings"><label class="feedback-toggle"><input id="modBureau" type="checkbox" ${bureauEnabled()?'checked':''}> Bureau des enquêtes</label><p>Regroupe les dossiers, les preuves et l’affectation des agents dans un panneau dédié. Ajoute « Bureau des enquêtes » au menu du jeu. Choix mémorisé sur ce navigateur ; compatible avec les parties en cours.</p></section>`;}
