import {defineConfig} from 'vite';
// Development preview only; production remains the authored static dist/ directory.
export default defineConfig({root:'dist/client',server:{host:'0.0.0.0',allowedHosts:['terminal.local']}});
