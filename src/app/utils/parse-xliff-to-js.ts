import { xliff12ToJs } from "xliff";

/**
 * Parses a XLIFF text to a JSON object with the structure needed for `loadTranslations()` by Angular
 *
 * can be used with `import * as parseXliffToJson from "parse-xliff-to-js";`
 *
 * @param translations a XLIFF text
 * @returns {Promise<{}>} with the JSON object
 */
export default async (translations: string): Promise<{}> => {
  const parserResult = await xliff12ToJs(translations, {
    captureSpacesBetweenElements: true,
  });
  const xliffContent = parserResult.resources["ng2.template"];

  return Object.keys(xliffContent).reduce((result, current) => {
    const translation = xliffContent[current].target;
    if (typeof translation === "string") {
      result[current] = translation;
    } else if (Array.isArray(translation)) {
      result[current] = translation
        .map((entry) =>
          typeof entry === "string" ? entry : `{{${entry.Standalone.id}}}`,
        )
        .map((entry) => entry.replace("{{", "{$").replace("}}", "}"))
        .join("");
    } else {
      throw new Error("Could not parse XLIFF: " + JSON.stringify(translation));
    }
    return result;
  }, {});
};
