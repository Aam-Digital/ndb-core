export function addAlphaToHexColor(color, opacity) {
  // coerce values so it is between 0 and 1.
  const opacity1 = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  return color + opacity1.toString(16).toUpperCase();
}
