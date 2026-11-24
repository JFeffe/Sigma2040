import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyWindowsRuntime } from './windows-runtime.mjs';

if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('Run this build with x64 Node.js on Windows.');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const productName = 'Shadow Mandate 2040';
const { name, version, main } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const releaseDirectory = path.join(root, 'release');
fs.mkdirSync(releaseDirectory, { recursive: true });
const buildDirectory = fs.mkdtempSync(path.join(releaseDirectory, `windows-x64-${version}-`));
const gameDirectory = path.join(buildDirectory, productName);
const resources = path.join(gameDirectory, 'resources');
const packagedApp = path.join(resources, 'app');
const archive = path.join(buildDirectory, 'Shadow-Mandate-2040-Windows-x64.zip');

copyWindowsRuntime(gameDirectory, productName);
fs.mkdirSync(packagedApp, { recursive: true });
fs.writeFileSync(path.join(packagedApp, 'package.json'), JSON.stringify({
  name, productName, version, main, type: 'module',
}, null, 2) + '\n');
fs.cpSync(path.join(root, 'desktop'), path.join(packagedApp, 'desktop'), { recursive: true });
fs.cpSync(path.join(root, 'dist', 'client'), path.join(packagedApp, 'dist', 'client'), { recursive: true });

console.log(`Application: ${path.join(gameDirectory, `${productName}.exe`)}`);
execFileSync('tar.exe', ['-a', '-cf', archive, '-C', buildDirectory, productName], { stdio: 'inherit' });
console.log(`Archive: ${archive}`);
