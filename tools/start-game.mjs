// Ein-Klick-Launcher: startet einen kleinen statischen Loopback-Server, öffnet
// den Standardbrowser und beendet sich nach Inaktivität automatisch.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = new Set(process.argv.slice(2));
const portArgument = process.argv.slice(2).find((arg) => arg.startsWith('--port='));
const festerPort = portArgument ? Number(portArgument.split('=')[1]) : null;
const nichtOeffnen = args.has('--no-open');
const urlAusgeben = args.has('--print-url');
const marker = 'betongold-launcher-v1';
const standardPorts = Array.from({ length: 11 }, (_, index) => 4173 + index);

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let letzterKontakt = Date.now();

function handler(req, res) {
  void (async () => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/__betongold_launcher') {
        letzterKontakt = Date.now();
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
        res.end(marker);
        return;
      }
      if (url.pathname === '/__betongold_keepalive') {
        letzterKontakt = Date.now();
        res.writeHead(204, { 'cache-control': 'no-store' });
        res.end();
        return;
      }

      let pfad = decodeURIComponent(url.pathname);
      if (pfad.endsWith('/')) pfad += 'index.html';
      const datei = resolve(root, `.${pfad}`);
      if (datei !== root && !datei.startsWith(`${root}${sep}`)) {
        throw new Error('Pfad außerhalb des Projekts');
      }

      letzterKontakt = Date.now();
      const typ = mime[extname(datei).toLowerCase()] || 'application/octet-stream';
      if (datei.endsWith(`${sep}index.html`)) {
        const html = await readFile(datei, 'utf8');
        const keepalive = `<script data-betongold-launcher>setInterval(()=>fetch('/__betongold_keepalive',{cache:'no-store'}).catch(()=>{}),15000);fetch('/__betongold_keepalive',{cache:'no-store'}).catch(()=>{});</script>`;
        res.writeHead(200, { 'content-type': typ, 'cache-control': 'no-store' });
        res.end(html.replace('</body>', `${keepalive}\n</body>`));
        return;
      }

      const inhalt = await readFile(datei);
      res.writeHead(200, { 'content-type': typ, 'cache-control': 'no-store' });
      res.end(inhalt);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Nicht gefunden');
    }
  })();
}

async function vorhandenesSpiel() {
  if (festerPort !== null) return null;
  const pruefungen = standardPorts.map(async (port, index) => {
    const basis = `http://127.0.0.1:${port}`;
    try {
      const signal = AbortSignal.timeout(350);
      const antwort = await fetch(`${basis}/__betongold_launcher`, { signal, cache: 'no-store' });
      if (antwort.ok && await antwort.text() === marker) return basis;
    } catch {
      // Port frei oder kein Betongold-Launcher.
    }
    if (index === 0) {
      try {
        const antwort = await fetch(`${basis}/`, { signal: AbortSignal.timeout(350), cache: 'no-store' });
        if (antwort.ok && (await antwort.text()).includes('<title>Betongold Tycoon</title>')) return basis;
      } catch {
        // Kein bereits laufender Entwicklungsserver auf dem Standardport.
      }
    }
    return null;
  });
  return (await Promise.all(pruefungen)).find(Boolean) || null;
}

async function hoereAufPort(port) {
  const server = createServer(handler);
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolvePromise);
  });
  return server;
}

async function starteServer() {
  if (festerPort !== null) return hoereAufPort(festerPort);
  for (const port of standardPorts) {
    try {
      return await hoereAufPort(port);
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error;
    }
  }
  throw new Error('Kein freier lokaler Port zwischen 4173 und 4183.');
}

function oeffneBrowser(url) {
  const befehl = process.platform === 'win32'
    ? ['cmd.exe', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  const kind = spawn(befehl[0], befehl[1], { detached: true, stdio: 'ignore', windowsHide: true });
  kind.unref();
}

const laufend = await vorhandenesSpiel();
if (laufend) {
  if (urlAusgeben) console.log(laufend);
  if (!nichtOeffnen) oeffneBrowser(laufend);
} else {
  const server = await starteServer();
  const adresse = server.address();
  const url = `http://127.0.0.1:${adresse.port}/`;
  if (urlAusgeben) console.log(url);
  if (!nichtOeffnen) oeffneBrowser(url);

  const aufraeumen = () => server.close();
  process.on('SIGINT', aufraeumen);
  process.on('SIGTERM', aufraeumen);
  const waechter = setInterval(() => {
    if (Date.now() - letzterKontakt > 180000) server.close();
  }, 30000);
  waechter.unref();
}

