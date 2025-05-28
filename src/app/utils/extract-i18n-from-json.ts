import fs from "fs";

writeXliffFromJson(
  "src/assets/base-configs/education/Config_CONFIG_ENTITY.json",
  "src/assets/locale/json-i18n.xlf",
);

/**
 * This script extracts i18n entries from a JSON file
 * to make text in plain .json files translatable.
 * Converts to XLIFF format.
 *
 * Example usage in your JSON config:
 ```json
 {
 "siteName": "##i18n##Test",
 "siteConfig": {
 "mode": "demo",
 "title": "##i18n##:UI Title@@site-title:Welcome to our application"
 }
 }
 ```
 */
export function writeXliffFromJson(
  sourceFile: string,
  targetFileName: string = "src/assets/locale/json-i18n.xlf",
) {
  // Read JSON file
  const jsonContent = fs.readFileSync(sourceFile, "utf8");

  let xliffContent = `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="2.0" xmlns="urn:oasis:names:tc:xliff:document:2.0" srcLang="en">
  <file id="ngi18n" original="json-i18n">
    <unit id="json-i18n">\n`;

  const i18nMarkerRegex = /"##i18n##(:([^:]*?)(@@([^:]*?))?:)?(.+)"/g;

  for (const match of jsonContent.matchAll(i18nMarkerRegex)) {
    const meaning = match[2] ?? "";
    const id = match[4] ?? "";
    const text = match[5];

    console.log(match[0], meaning, id, text);

    xliffContent += `      <segment id="${id}">
        <source>${text}</source>
        <note>${meaning}</note>
      </segment>\n`;
  }

  xliffContent += `    </unit>
  </file>
</xliff>`;

  fs.writeFileSync(targetFileName, xliffContent);
  console.log("JSON i18n extraction complete!");
}
