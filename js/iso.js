// iso.js — SVG-Platzhalter-Renderer für Exposé-Bilder. Gleiche Dateinamen-
// Logik wie assets/ (ASSET_MANIFEST.md): existiert das WebP, legt es sich
// per <img> über den Platzhalter; sonst bleibt der SVG-Greybox-Look.
// Art blockt nie den Build (PLAN.md §6). Kein Spiel-RNG — Tint kommt
// deterministisch aus der Listing-ID (rein visuell).

function idHash(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// Fenster-Raster als Rechtecke
function fenster(x0, y0, spalten, zeilen, dx, dy, b, h, farbe) {
  let s = '';
  for (let r = 0; r < zeilen; r++) {
    for (let c = 0; c < spalten; c++) {
      s += `<rect x="${x0 + c * dx}" y="${y0 + r * dy}" width="${b}" height="${h}" fill="${farbe}" rx="1"/>`;
    }
  }
  return s;
}

const SZENE_START =
  `<rect width="400" height="300" fill="#dce8ef"/>` +
  `<rect y="252" width="400" height="48" fill="#cfc5aa"/>` +
  `<circle cx="352" cy="46" r="20" fill="#f2d98c"/>`;

function baum(x) {
  return (
    `<rect x="${x - 3}" y="222" width="6" height="32" fill="#8a6f52"/>` +
    `<circle cx="${x}" cy="212" r="20" fill="#9dbb85"/>`
  );
}

const STILE = {
  altbau(t) {
    const wand = ['#e8dcc4', '#e4d2c2', '#ded8c6'][t];
    return (
      `<rect x="118" y="70" width="180" height="184" fill="${wand}" stroke="#b7a98c"/>` +
      `<rect x="118" y="58" width="180" height="14" fill="#8b7d66"/>` +           // Traufe
      `<path d="M150 58 L180 36 L210 58 Z" fill="#8b7d66"/>` +                     // Giebel
      `<rect x="118" y="112" width="180" height="5" fill="#cbbf9f"/>` +            // Stuckbänder
      `<rect x="118" y="158" width="180" height="5" fill="#cbbf9f"/>` +
      `<rect x="118" y="204" width="180" height="5" fill="#cbbf9f"/>` +
      fenster(134, 80, 4, 4, 40, 46, 16, 26, '#5b7285') +
      `<rect x="196" y="216" width="26" height="38" fill="#6d5843" rx="8"/>` +     // Portal
      baum(70)
    );
  },
  zeile60(t) {
    const wand = ['#d9d4c8', '#d3d6cd', '#dcd0be'][t];
    return (
      `<rect x="52" y="118" width="304" height="136" fill="${wand}" stroke="#a8a294"/>` +
      `<rect x="52" y="110" width="304" height="8" fill="#94907f"/>` +             // Flachdach
      fenster(66, 130, 7, 3, 42, 40, 22, 20, '#647687') +
      `<rect x="192" y="222" width="22" height="32" fill="#7c6a54"/>` +            // Eingang
      baum(380)
    );
  },
  klinker90(t) {
    const wand = ['#b06a4a', '#a86648', '#b5714e'][t];
    return (
      `<rect x="100" y="96" width="216" height="158" fill="${wand}" stroke="#8a4f36"/>` +
      `<path d="M92 96 L208 56 L324 96 Z" fill="#7d4a35"/>` +                      // Satteldach
      fenster(116, 110, 4, 3, 46, 44, 20, 24, '#dfe7ec') +
      `<rect x="292" y="110" width="18" height="112" fill="#c8876a"/>` +           // Balkonturm
      `<rect x="290" y="130" width="22" height="4" fill="#e9e2d5"/>` +
      `<rect x="290" y="174" width="22" height="4" fill="#e9e2d5"/>` +
      `<rect x="196" y="220" width="24" height="34" fill="#5f4433" rx="2"/>` +
      baum(60)
    );
  },
  neubau(t) {
    const wand = ['#eff0ec', '#e8ecec', '#f2eee6'][t];
    return (
      `<rect x="110" y="66" width="200" height="188" fill="${wand}" stroke="#b9bcb6"/>` +
      `<rect x="110" y="60" width="212" height="8" fill="#8f948e"/>` +             // Attika
      fenster(126, 80, 3, 4, 60, 44, 34, 30, '#7fa3b8') +
      `<rect x="110" y="122" width="200" height="3" fill="#c9cdc7"/>` +            // Glasbrüstungen
      `<rect x="110" y="166" width="200" height="3" fill="#c9cdc7"/>` +
      `<rect x="242" y="216" width="26" height="38" fill="#4e5a60"/>` +
      baum(64)
    );
  },
  haus(t) {
    const wand = ['#e7d8c2', '#ddd8c9', '#e9d1bd'][t];
    return (
      `<rect x="104" y="132" width="198" height="122" fill="${wand}" stroke="#aa9a83"/>` +
      `<path d="M84 134 L202 68 L322 134 Z" fill="#8b5f49" stroke="#76503e"/>` +
      `<rect x="184" y="202" width="34" height="52" fill="#6f5844"/>` +
      fenster(126, 150, 3, 2, 66, 48, 30, 28, '#7fa3b8') +
      `<rect x="305" y="214" width="70" height="40" fill="#a8bd8f"/>` +
      `<line x1="305" y1="226" x2="375" y2="226" stroke="#738866"/>` +
      baum(60) + baum(350)
    );
  },
};

export function platzhalterSVG(listing) {
  const t = idHash(listing.id) % 3;
  const stil = STILE[listing.stil] || STILE.altbau;
  return (
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-label="Außenansicht: ${listing.titel}">${SZENE_START}${stil(t)}</svg>`
  );
}

// Bild-Container: SVG sofort, echtes Asset legt sich darüber, sobald es
// existiert; bei 404 entfernt sich das <img> selbst (Platzhalter bleibt).
export function bildHTML(listing, klasse = '') {
  const asset = listing.assetStatus === 'placeholder'
    ? ''
    : `<img src="assets/expose/${listing.id}.webp" alt="Außenansicht: ${listing.titel}" loading="lazy" ` +
      `onerror="this.remove()">`;
  return (
    `<div class="expose-bild bild-zoom ${klasse}" role="button" tabindex="0" ` +
    `data-bild-label="Außenansicht · ${listing.titel}" aria-label="Außenansicht von ${listing.titel} vergrößern">` +
    platzhalterSVG(listing) +
    asset +
    `<span class="zoom-hinweis" aria-hidden="true">⌕</span>` +
    `</div>`
  );
}

// Innenraum-Cutaway-Platzhalter (ASSET_MANIFEST §2). Zwei Zustände:
// saniert (Zustand ≥ 4) hell/frisch, unsaniert gedämpft.
export function cutawaySVG(listing, zustand) {
  const saniert = zustand >= 4;
  const wand = saniert ? '#f2ece0' : '#d9cfbd';
  const boden = saniert ? '#d8b892' : '#a98c68';
  const moebel = saniert ? '#b7c4bd' : '#9aa39c';
  const t = idHash(listing.id) % 3;
  const fensterX = 250 + t * 20;
  const unmoebliert = listing.ausstattung === 'unmoebliert';
  return (
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" ` +
    `aria-label="Innenansicht: ${listing.titel}">` +
    `<rect width="400" height="300" fill="${wand}"/>` +
    `<rect y="214" width="400" height="86" fill="${boden}"/>` +          // Boden
    `<polygon points="0,214 400,214 400,238 0,262" fill="rgba(0,0,0,0.06)"/>` + // Perspektive
    `<rect x="${fensterX}" y="60" width="96" height="86" fill="#cfe0e8" stroke="#8b9aa2" stroke-width="3"/>` +
    `<line x1="${fensterX + 48}" y1="60" x2="${fensterX + 48}" y2="146" stroke="#8b9aa2" stroke-width="3"/>` +
    (unmoebliert ? '' :
      `<rect x="40" y="150" width="120" height="70" fill="${moebel}" rx="4"/>` +      // Sofa
      `<rect x="52" y="128" width="96" height="26" fill="${moebel}" rx="4"/>` +
      `<rect x="188" y="188" width="70" height="32" fill="${saniert ? '#c9a06a' : '#8f7350'}" rx="3"/>`) + // Tisch
    (saniert ? `<circle cx="360" cy="40" r="14" fill="#f2d98c" opacity="0.6"/>` : '') +
    `</svg>`
  );
}

export function cutawayHTML(listing, zustand, klasse = '') {
  const datei = zustand >= 4 ? 'saniert' : 'unsaniert';
  const asset = listing.assetStatus === 'placeholder'
    ? ''
    : `<img src="assets/cutaway/${listing.id}_${datei}.webp" alt="Innenansicht: ${listing.titel}" loading="lazy" ` +
      `onerror="this.remove()">`;
  return (
    `<div class="expose-bild bild-zoom ${klasse}" role="button" tabindex="0" ` +
    `data-bild-label="Innenansicht · ${listing.titel}" aria-label="Innenansicht von ${listing.titel} vergrößern">` +
    cutawaySVG(listing, zustand) +
    asset +
    `<span class="zoom-hinweis" aria-hidden="true">⌕</span>` +
    `</div>`
  );
}

