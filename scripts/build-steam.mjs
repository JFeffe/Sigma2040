import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { copyWindowsRuntime } from './windows-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'resources', 'app');
const release = path.join(root, 'release');
const runtimeFiles = ['package.json', 'main.cjs', 'preload.cjs', 'campaign-store.cjs', 'icon.png'];
const productName = 'Shadow Mandate';
const executable = productName + '.exe';

function readSteamIds() {
  const { values } = parseArgs({ options: { 'app-id': { type: 'string' }, 'depot-id': { type: 'string' } } });
  const appId = values['app-id'];
  const depotId = values['depot-id'];
  if (appId === undefined && depotId === undefined) return null;
  if (![appId, depotId].every(id => /^[1-9]\d{0,9}$/.test(id ?? '') && Number(id) <= 0xffffffff) || appId === depotId) {
    throw new Error('Pass a valid Steam App ID and Windows Depot ID together.');
  }
  return { appId, depotId };
}

function steamScript(build, { appId, depotId }, preview) {
  return [
    '"AppBuild"',
    '{',
    '  "AppID" "' + appId + '"',
    '  "Desc" "Shadow Mandate Windows x64 PC ' + build + '"',
    '  "ContentRoot" "../content/"',
    '  "BuildOutput" "../output/"',
    '  "Preview" "' + (preview ? '1' : '0') + '"',
    '  "Depots"',
    '  {',
    '    "' + depotId + '"',
    '    {',
    '      "FileMapping"',
    '      {',
    '        "LocalPath" "*"',
    '        "DepotPath" "."',
    '        "Recursive" "1"',
    '      }',
    '    }',
    '  }',
    '}',
    '',
  ].join('\n');
}

async function manifest(content) {
  const files = fs.readdirSync(content, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.relative(content, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .sort();
  const records = [];
  for (const file of files) {
    const filename = path.join(content, file);
    const checksum = createHash('sha256');
    for await (const chunk of fs.createReadStream(filename)) checksum.update(chunk);
    records.push({ path: file, size: fs.statSync(filename).size, sha256: checksum.digest('hex') });
  }
  return records;
}

const ids = readSteamIds();
const { BUILD_VERSION } = await import(pathToFileURL(path.join(source, 'client', 'build-version.js')).href);
const metadata = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
if (!/^\d+$/.test(BUILD_VERSION) || metadata.version !== '0.' + BUILD_VERSION + '.0' || metadata.main !== 'main.cjs') {
  throw new Error('The PC package and its client build number must match.');
}
for (const file of runtimeFiles) fs.accessSync(path.join(source, file));

fs.mkdirSync(release, { recursive: true });
const destination = fs.mkdtempSync(path.join(release, 'steam-windows-x64-' + BUILD_VERSION + '-'));
const content = path.join(destination, 'content');
const app = path.join(content, 'resources', 'app');
const electronVersion = copyWindowsRuntime(content, productName);
fs.mkdirSync(app, { recursive: true });
for (const file of runtimeFiles) fs.copyFileSync(path.join(source, file), path.join(app, file));
fs.cpSync(path.join(source, 'client'), path.join(app, 'client'), {
  recursive: true,
  filter: filename => !path.basename(filename).startsWith('.') && path.basename(filename).toLowerCase() !== 'thumbs.db',
});
fs.copyFileSync(path.join(root, 'LISEZ-MOI.txt'), path.join(content, 'LISEZ-MOI.txt'));

const scripts = path.join(destination, 'scripts');
fs.mkdirSync(scripts);
if (ids) {
  fs.writeFileSync(path.join(scripts, 'app_build_preview.vdf'), steamScript(BUILD_VERSION, ids, true));
  fs.writeFileSync(path.join(scripts, 'app_build.vdf'), steamScript(BUILD_VERSION, ids, false));
} else {
  fs.writeFileSync(path.join(scripts, 'app_build.vdf.template'), steamScript(BUILD_VERSION, {
    appId: 'YOUR_STEAM_APP_ID', depotId: 'YOUR_WINDOWS_DEPOT_ID',
  }, true));
}
const files = await manifest(content);
fs.writeFileSync(path.join(destination, 'manifest.json'),
  JSON.stringify({ build: BUILD_VERSION, electronVersion, executable, files }, null, 2) + '\n');
console.log('SteamPipe content: ' + content);
console.log('Launch option: ' + executable);
console.log('SHA-256 manifest for ' + files.length + ' files: ' + path.join(destination, 'manifest.json'));
if (!ids) console.log('Pass --app-id and --depot-id to generate SteamPipe preview and upload scripts.');
