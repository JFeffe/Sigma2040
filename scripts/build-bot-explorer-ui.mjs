import {copyFileSync,mkdirSync} from 'node:fs';
// Keep the checked-in preview and its editable sources identical. No simulation
// is needed when only the presentation changes.
mkdirSync('docs/bots/explorer',{recursive:true});
for(const file of ['dashboard.html','explorer.css','explorer.mjs','core.mjs'])
  copyFileSync('tools/bot-explorer/'+file,'docs/bots/explorer/'+file);
console.log('Explorer assets synchronized.');
