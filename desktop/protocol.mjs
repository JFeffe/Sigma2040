import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { net } from 'electron';

export const GAME_SCHEME = 'shadow-mandate';
export const GAME_URL = `${GAME_SCHEME}://game/`;

const clientDirectory = fileURLToPath(new URL('../dist/client/', import.meta.url));
const relay = new URL('https://sigma-2040.docile-hero-2836.chatgpt.site/api/relay');
const maxRelayBytes = 300_000;
const contentPolicy = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

export function isGameUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === `${GAME_SCHEME}:` && url.host === 'game'
      && !url.username && !url.password;
  } catch {
    return false;
  }
}

function relayError(error, status) {
  return Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } });
}

async function requestRelay(request) {
  if (request.method !== 'POST') return relayError('Méthode non autorisée.', 405);
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return relayError('Message invalide.', 415);
  }
  if (Number(request.headers.get('content-length')) > maxRelayBytes) {
    return relayError('Message trop volumineux.', 413);
  }

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > maxRelayBytes) return relayError('Message trop volumineux.', 413);

    // Use the hosted relay's existing HTTP contract. No browser credentials or
    // destinations supplied by the renderer are forwarded to the service.
    const upstream = await fetch(relay, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: relay.origin },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.headers.get('content-type')?.includes('application/json')) {
      return relayError('Réponse inattendue du relais multijoueur.', 502);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch {
    return relayError('Relais multijoueur indisponible. Vérifiez votre connexion Internet.', 503);
  }
}

export async function serveGame(request) {
  if (!isGameUrl(request.url)) return new Response(null, { status: 404 });
  const { pathname } = new URL(request.url);
  if (pathname === '/api/relay') return requestRelay(request);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405 });
  }

  try {
    const filePath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    if (/[\\:\0]/.test(filePath)) return new Response(null, { status: 404 });
    const resolved = path.resolve(clientDirectory, `.${filePath}`);
    const relative = path.relative(clientDirectory, resolved);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    const range = request.headers.get('range');
    if (range) headers.set('range', range);
    const response = await net.fetch(pathToFileURL(resolved).href, { method: request.method, headers });
    if (relative !== 'index.html') return response;

    const documentHeaders = new Headers(response.headers);
    documentHeaders.set('content-security-policy', contentPolicy);
    return new Response(response.body, { status: response.status, headers: documentHeaders });
  } catch {
    return new Response(null, { status: 404 });
  }
}
