// bildzoom.js — gemeinsame Lightbox für Außen- und Innenansichten.

let faktor = 1;

export function initBildzoom() {
  const dialog = document.getElementById('dlg-bildzoom');
  const buehne = document.getElementById('bildzoom-buehne');
  const titel = document.getElementById('bildzoom-titel');

  function anwenden() {
    const bild = buehne.querySelector('.bildzoom-inhalt');
    if (bild) bild.style.transform = `scale(${faktor})`;
    document.getElementById('bildzoom-stufe').textContent = `${Math.round(faktor * 100)} %`;
  }

  function oeffnen(quelle) {
    faktor = 1;
    titel.textContent = quelle.dataset.bildLabel || 'Gebäudeansicht';
    const inhalt = document.createElement('div');
    inhalt.className = 'bildzoom-inhalt';
    quelle.querySelectorAll('svg, img').forEach((el) => inhalt.append(el.cloneNode(true)));
    buehne.replaceChildren(inhalt);
    anwenden();
    dialog.showModal();
  }

  document.addEventListener('click', (ev) => {
    const quelle = ev.target.closest('.bild-zoom');
    if (quelle) {
      ev.preventDefault();
      ev.stopPropagation();
      oeffnen(quelle);
    }
  });
  document.addEventListener('keydown', (ev) => {
    const quelle = ev.target.closest?.('.bild-zoom');
    if (quelle && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      ev.stopPropagation();
      oeffnen(quelle);
    }
  });

  document.getElementById('bildzoom-plus').addEventListener('click', () => {
    faktor = Math.min(2.5, faktor + 0.25);
    anwenden();
  });
  document.getElementById('bildzoom-minus').addEventListener('click', () => {
    faktor = Math.max(0.75, faktor - 0.25);
    anwenden();
  });
  document.getElementById('bildzoom-reset').addEventListener('click', () => {
    faktor = 1;
    anwenden();
  });
  buehne.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    faktor = Math.max(0.75, Math.min(2.5, faktor + (ev.deltaY < 0 ? 0.1 : -0.1)));
    anwenden();
  }, { passive: false });
}
