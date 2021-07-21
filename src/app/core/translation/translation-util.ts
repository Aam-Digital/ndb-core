/**
 * Extracts the region code (i.e. 'de', 'us', 'in') in lowercase letters
 * from a locale (i.e. 'en-US', 'hi-IN')
 * @param locale The locale to extract the region code from
 */
export function extractRegionFromLocale(locale: string): string {
  const components = locale.split("-");
  if (components.length >= 2) {
    return components[1].toLowerCase();
  } else {
    return components[0].toLowerCase();
  }
}
