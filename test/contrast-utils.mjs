// Dependency-free WCAG contrast audit for the real browser smoke test.
// The expression deliberately works with computed colors so dynamic component
// states are checked after the app has rendered them, not just as CSS strings.

export function contrastAuditExpression(targets) {
  return `(() => {
    const targets = ${JSON.stringify(targets)};

    const parseColor = (value) => {
      const parts = String(value || '').match(/[\\d.]+/g)?.map(Number) || [];
      if (parts.length < 3) return null;
      return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
    };
    const composite = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      if (alpha <= 0) return [0, 0, 0, 0];
      return [
        (front[0] * front[3] + back[0] * back[3] * (1 - front[3])) / alpha,
        (front[1] * front[3] + back[1] * back[3] * (1 - front[3])) / alpha,
        (front[2] * front[3] + back[2] * back[3] * (1 - front[3])) / alpha,
        alpha,
      ];
    };
    const luminance = (color) => {
      const linear = color.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const ratio = (a, b) => {
      const light = Math.max(luminance(a), luminance(b));
      const dark = Math.min(luminance(a), luminance(b));
      return (light + 0.05) / (dark + 0.05);
    };
    const effectiveBackground = (element) => {
      const layers = [];
      for (let node = element; node instanceof Element; node = node.parentElement) {
        const parsed = parseColor(getComputedStyle(node).backgroundColor);
        if (parsed && parsed[3] > 0) layers.push(parsed);
      }
      let result = [16, 24, 32, 1];
      for (const layer of layers.reverse()) result = composite(layer, result);
      return result;
    };

    const checked = [];
    const missing = [];
    for (const target of targets) {
      const elements = [...document.querySelectorAll(target.selector)];
      if (!elements.length) {
        if (target.required !== false) missing.push(target.name);
        continue;
      }
      for (const element of elements.slice(0, target.limit || 4)) {
        const style = getComputedStyle(element);
        const foregroundRaw = parseColor(style.color);
        const background = effectiveBackground(element);
        if (!foregroundRaw) {
          missing.push(target.name + ' (Farbe)');
          continue;
        }
        const foreground = composite(foregroundRaw, background);
        const fontSize = parseFloat(style.fontSize) || 16;
        const weight = Number(style.fontWeight) || (style.fontWeight === 'bold' ? 700 : 400);
        const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
        const minimum = target.minimum || (large ? 3 : 4.5);
        checked.push({
          name: target.name,
          selector: target.selector,
          text: element.textContent.trim().slice(0, 80),
          ratio: Number(ratio(foreground, background).toFixed(2)),
          minimum,
          foreground: foreground.slice(0, 3).map(Math.round),
          background: background.slice(0, 3).map(Math.round),
        });
      }
    }
    return { checked, missing, failures: checked.filter((entry) => entry.ratio < entry.minimum) };
  })()`;
}

