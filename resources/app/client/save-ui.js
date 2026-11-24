import { COUNTRY } from './data.js?v=245';
import { GAME_MODES } from './game-setup.js?v=245';
import { formatText, gameLanguage } from './localization.js?v=245';
import { canDeleteCampaignSlot, firstFreeCampaignSlot } from './campaign-slots.js?v=245';
import { button, esc, flag } from './ui.js?v=245';

const statusText = {
  missing: 'Emplacement libre',
  invalid: 'Ce fichier de sauvegarde est illisible.',
  unavailable: 'Ce fichier de sauvegarde est inaccessible.',
};

const slotTitle = slot => formatText('Emplacement {0}', slot + 1);
const slotCommand = (label, command, slot, className = 'small') =>
  button(label, command, className, `data-id="${slot}"`);

function campaignLabel(record) {
  const country = COUNTRY[record.player]?.name ?? record.player;
  return `${flag(record.player)} <strong>${esc(country)}</strong> <span>· ${esc(formatText('Tour {0}', record.turn))}</span>`;
}

function saveRecord(record) {
  if (record.status !== 'ready') return `<p class="save-slot-status">${statusText[record.status]}</p>`;
  const date = new Date(record.savedAt);
  const formatted = new Intl.DateTimeFormat(gameLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  const mode = GAME_MODES[record.gameMode];
  return `<p class="save-slot-campaign">${campaignLabel(record)}</p>
    <p class="save-slot-status">${mode ? `<span>${esc(mode)}</span> · ` : ''}
    <time datetime="${date.toISOString()}">${esc(formatted)}</time>
    ${record.ended ? '<span>· Campagne terminée</span>' : ''}</p>`;
}

function slotCard(index, record, actions, { active = false, recovery = '' } = {}) {
  return `<article class="save-slot campaign-card ${record.status}" data-save-slot="${index}">
    <header><h3>${esc(slotTitle(index))}</h3>${active ? '<span>Campagne ouverte</span>' : ''}</header>
    ${saveRecord(record)}
    ${actions ? `<div class="save-slot-actions">${actions}</div>` : ''}
    ${recovery}
  </article>`;
}

export function saveScreen(slots, { activeSlot, writeError = false } = {}) {
  const cards = slots.map(({ current, previous }, slot) => {
    const actions = current.status === 'ready'
      ? slotCommand(current.ended ? 'Consulter' : 'Reprendre', 'save-resume', slot, 'small primary')
      : '';
    const recovery = previous.status === 'ready' ? `<details class="campaign-disclosure save-recovery"
      ${current.status === 'ready' ? '' : 'open'}>
      <summary>Copie de récupération</summary><p>${campaignLabel(previous)}</p>
      <div class="save-slot-actions">
        ${slotCommand('Restaurer cette copie', 'save-restore', slot)}
      </div>
    </details>` : '';
    const remove = canDeleteCampaignSlot({ current, previous })
      ? slotCommand('Supprimer', 'save-delete', slot, 'small save-delete') : '';
    return slotCard(slot, current, actions + remove, { active: slot === activeSlot && current.status === 'ready', recovery });
  }).join('');
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">Sauvegardes</h2>
    <p class="save-intro">Chaque fin de tour met à jour l’emplacement de la campagne ouverte.</p>
    ${writeError ? '<p class="notice warning" role="status">L’enregistrement de la campagne a échoué.</p>' : ''}
    <div class="save-slots">${cards}</div>
  </section>`;
}

export function saveSlotPicker(slots) {
  const cards = slots.map(({ current, previous }, slot) => {
    const record = current.status === 'missing' ? previous : current;
    const available = current.status !== 'unavailable' && previous.status !== 'unavailable';
    const label = record.status === 'missing' ? 'Utiliser cet emplacement' : 'Remplacer la sauvegarde';
    return slotCard(slot, record, available ? slotCommand(label, 'save-slot-select', slot) : '');
  }).join('');
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">Choisir un emplacement</h2>
    <p class="save-intro">${firstFreeCampaignSlot(slots) >= 0
      ? 'Sélectionnez l’emplacement de la nouvelle campagne.'
      : 'Aucun emplacement libre. Choisissez une sauvegarde à remplacer ou annulez.'}</p>
    <div class="save-slots">${cards}</div>
    ${button('Annuler', 'close', 'small')}
  </section>`;
}

export function saveConfirmation({ action, campaign, slot }, { current, previous }) {
  const restoring = action === 'restore';
  const existing = current.status === 'missing' ? previous : current;
  const replaces = existing.status !== 'missing';
  const title = restoring ? 'Restaurer cette copie ?' : replaces ? 'Remplacer cette sauvegarde ?' : 'Utiliser cet emplacement ?';
  const label = restoring ? 'Restaurer' : replaces ? 'Remplacer' : 'Utiliser';
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">${title}</h2>
    <p><strong>${esc(slotTitle(slot))}</strong></p>
    <p>${restoring ? 'Copie de récupération' : 'Nouvelle campagne'} · ${campaignLabel(campaign)}</p>
    ${replaces ? `<div class="save-replacement"><h3>Sauvegarde à remplacer</h3>${saveRecord(existing)}</div>` : ''}
    <div class="save-actions">
      ${button('Annuler', 'close', 'small')}
      ${button(label, 'save-commit', 'primary')}
    </div>
  </section>`;
}

export function saveDeletionConfirmation(slot, { current, previous }, closesCampaign) {
  const record = current.status === 'ready' ? current : previous;
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">Supprimer cette sauvegarde ?</h2>
    <p>${esc(slotTitle(slot))}${record.status === 'ready' ? ' · ' + campaignLabel(record) : ''}</p>
    <p>Cette suppression est définitive.</p>
    ${previous.status !== 'missing' ? '<p>La copie de récupération sera aussi supprimée.</p>' : ''}
    ${closesCampaign ? '<p>La campagne ouverte sera fermée.</p>' : ''}
    <div class="save-actions">
      ${button('Annuler', 'save-delete-cancel', 'small')}
      ${button('Supprimer', 'save-delete-confirm', 'small save-delete')}
    </div>
  </section>`;
}
