export function addAlphaToHexColor(color, opacity) {
  // coerce values so it is between 0 and 1.
  const opacity1 = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  return color + opacity1.toString(16).toUpperCase();
}

/**
 * Source {@link https://gist.github.com/mjackson/5311256}
 */
export function getHue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max == min) {
    return 0; // achromatic
  }

  const d = max - min;
  switch (max) {
    case r:
      return ((g - b) / d + (g < b ? 6 : 0)) / 6;
    case g:
      return ((b - r) / d + 2) / 6;
    case b:
      return ((r - g) / d + 4) / 6;
  }
}
