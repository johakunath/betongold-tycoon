// Prüft den Ein-Klick-Server ohne Browserfenster oder Fremdpakete.

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const startdatei = await readFile(resolve(root, 'BETONGOLD_STARTEN.cmd'), 'utf8');
if (!startdatei.includes('tools/start-game.mjs') || !startdatei.includes('where node.exe')) {
  throw new Error('Windows-Startdatei verweist nicht vollständig auf den Launcher.');
}
const kind = spawn(process.execPath, [
  'tools/start-game.mjs', '--no-open', '--print-url', '--port=0',
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });

let stderr = '';
kind.stderr.setEncoding('utf8');
kind.stderr.on('data', (teil) => { stderr += teil; });

const url = await new Promise((resolvePromise, reject) => {
  const timer = setTimeout(() => reject(new Error(`Launcher-Timeout. ${stderr}`)), 5000);
  kind.stdout.setEncoding('utf8');
  kind.stdout.once('data', (teil) => {
    clearTimeout(timer);
    resolvePromise(teil.trim());
  });
  kind.once('exit', (code) => {
    clearTimeout(timer);
    reject(new Error(`Launcher endete vorzeitig mit ${code}. ${stderr}`));
  });
});

try {
  const marker = await fetch(`${url}__betongold_launcher`).then((antwort) => antwort.text());
  if (marker !== 'betongold-launcher-v1') throw new Error('Launcher-Marker fehlt.');

  const html = await fetch(url).then((antwort) => antwort.text());
  if (!html.includes('<title>Betongold Tycoon</title>') ||
      !html.includes('data-betongold-launcher') || !html.includes('?v=51')) {
    throw new Error('Index oder Keepalive-Injektion ist unvollständig.');
  }

  const keepalive = await fetch(`${url}__betongold_keepalive`);
  if (keepalive.status !== 204) throw new Error(`Keepalive antwortet mit ${keepalive.status}.`);

  const css = await fetch(`${url}css/style.css?v=51`);
  if (!css.ok || !css.headers.get('content-type')?.startsWith('text/css')) {
    throw new Error('CSS wird nicht korrekt ausgeliefert.');
  }
  console.log('LAUNCHER-SMOKE OK — Startdatei, statische Dateien, MIME, Keepalive und UI v51');
} finally {
  kind.kill();
}
