import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function copyWindowsRuntime(destination, productName) {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('Run this build with x64 Node.js on Windows.');
  }
  const electronPackage = path.dirname(require.resolve('electron/package.json'));
  const runtime = path.join(electronPackage, 'dist');
  if (!fs.existsSync(path.join(runtime, 'electron.exe'))) {
    execFileSync(process.execPath, [path.join(electronPackage, 'install.js')], { stdio: 'inherit' });
  }

  fs.cpSync(runtime, destination, { recursive: true });
  fs.renameSync(path.join(destination, 'electron.exe'), path.join(destination, productName + '.exe'));
  const crashReporter = path.join(destination, 'electron_wer.dll');
  if (fs.existsSync(crashReporter)) {
    fs.renameSync(crashReporter, path.join(destination, productName + '_wer.dll'));
  }
  fs.rmSync(path.join(destination, 'resources', 'default_app.asar'), { force: true });
  return fs.readFileSync(path.join(destination, 'version'), 'utf8').trim();
}
