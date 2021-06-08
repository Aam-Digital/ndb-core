export function extractRegionFromLocale(locale: string): string {
  const components = locale.split("-");
  if (components.length >= 2) {
    return components[1].toLowerCase();
  } else {
    return components[0].toLowerCase();
  }
}
