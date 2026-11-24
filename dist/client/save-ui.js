import { COUNTRY } from './data.js?v=244';
import { GAME_MODES } from './game-setup.js?v=244';
import { formatText, gameLanguage } from './localization.js?v=244';
import { button, esc, flag, icon } from './ui.js?v=244';

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

export function saveScreen(slots, { activeSlot, writeError = false, legacyBackup = false } = {}) {
  const cards = slots.map(({ current, previous }, slot) => {
    const actions = current.status === 'ready'
      ? slotCommand(current.ended ? 'Consulter' : 'Reprendre', 'save-resume', slot, 'small primary') +
        slotCommand('Exporter', 'save-export', slot)
      : '';
    const recovery = previous.status === 'ready' ? `<details class="campaign-disclosure save-recovery"
      ${current.status === 'ready' ? '' : 'open'}>
      <summary>Copie de récupération</summary><p>${campaignLabel(previous)}</p>
      <div class="save-slot-actions">
        ${slotCommand('Restaurer cette copie', 'save-restore', slot)}
        ${slotCommand('Exporter la copie', 'save-export-previous', slot)}
      </div>
    </details>` : '';
    return slotCard(slot, current, actions, { active: slot === activeSlot && current.status === 'ready', recovery });
  }).join('');
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">Sauvegardes</h2>
    <p class="save-intro">Chaque fin de tour met à jour l’emplacement de la campagne ouverte.</p>
    ${writeError ? '<p class="notice warning" role="status">L’enregistrement a échoué. Vous pouvez exporter la partie ouverte.</p>' : ''}
    <div class="save-slots">${cards}</div>
    <div class="save-actions">
      ${button(icon('file') + ' Importer un fichier JSON', 'import', 'small')}
      ${writeError ? button('Exporter la partie ouverte', 'export', 'small') : ''}
      ${legacyBackup ? button('Exporter l’ancienne copie de compatibilité', 'export-economy-backup', 'small') : ''}
      <input type="file" id="saveFile" accept=".json,application/json" hidden>
    </div>
  </section>`;
}

export function saveSlotPicker(slots, action) {
  const cards = slots.map(({ current, previous }, slot) => {
    const record = current.status === 'missing' && previous.status === 'ready' ? previous : current;
    const available = current.status !== 'unavailable';
    const label = record.status === 'missing' ? 'Utiliser cet emplacement' : 'Remplacer la sauvegarde';
    return slotCard(slot, record, available ? slotCommand(label, 'save-slot-select', slot) : '');
  }).join('');
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">Choisir un emplacement</h2>
    <p class="save-intro">${action === 'new'
      ? 'Sélectionnez l’emplacement de la nouvelle campagne.'
      : 'Sélectionnez l’emplacement de la campagne importée.'}</p>
    <div class="save-slots">${cards}</div>
    ${button('Annuler', 'close', 'small')}
  </section>`;
}

export function saveConfirmation({ action, campaign, slot }, { current, previous }) {
  const restoring = action === 'restore';
  const existing = current.status === 'missing' ? previous : current;
  const replaces = existing.status !== 'missing';
  const title = restoring ? 'Restaurer cette copie ?' : replaces ? 'Remplacer cette sauvegarde ?' : 'Importer cette campagne ?';
  const label = restoring ? 'Restaurer' : replaces ? 'Remplacer' : 'Importer';
  return `<section class="save-screen">
    <h2 id="saveDialogTitle" tabindex="-1">${title}</h2>
    <p>${esc(slotTitle(slot))} · ${campaignLabel(campaign)}</p>
    ${replaces ? '<p>Cette campagne remplacera la sauvegarde de cet emplacement.</p>' : ''}
    ${existing.status === 'ready' ? `<p class="save-slot-campaign">${campaignLabel(existing)}</p>` : ''}
    <div class="save-actions">
      ${button('Annuler', 'close', 'small')}
      ${current.status === 'ready' ? slotCommand('Exporter', 'save-export', slot) : ''}
      ${button(label, 'save-commit', 'primary')}
    </div>
  </section>`;
}
