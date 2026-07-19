// signals.js — flüchtige, nicht gespeicherte UI-Signale aus der DOM-freien Engine.
// Wartemomente stoppen Fast-Forward, sobald eine sinnvolle Folgeaktion ansteht.

function warteschlange(state) {
  if (!Array.isArray(state.__wartemomente)) {
    Object.defineProperty(state, '__wartemomente', {
      value: [],
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  return state.__wartemomente;
}

export function meldeWartemoment(state, text, ziel = null) {
  warteschlange(state).push({ monat: state.monat, text, ziel });
}

export function hatWartemoment(state) {
  return warteschlange(state).length > 0;
}

export function zieheWartemomente(state) {
  return warteschlange(state).splice(0);
}

export function verwerfeWartemomente(state) {
  warteschlange(state).length = 0;
}
