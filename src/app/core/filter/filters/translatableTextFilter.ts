import { Entity } from "../../entity/model/entity";
import { baseLanguage } from "../../config/multi-lingual-config";
import { AVAILABLE_LOCALE_IDS } from "../../language/available-locales";
import { DataFilter } from "./filters";
import { escapeRegExp, StringFilter } from "./stringFilter";

/** The keys a translation map can use, as accepted by `isTranslatableText`. */
const TRANSLATION_KEYS: readonly string[] = [
  ...new Set(
    AVAILABLE_LOCALE_IDS.flatMap((locale) => [locale, baseLanguage(locale)]),
  ),
];

/**
 * A text filter for multi-lingual fields (dataType "translatable-text").
 *
 * The value is stored either as a plain string or as a per-language map,
 * so the search text is matched against the field itself and against every
 * language - matching a text in *any* language, not only the displayed one.
 */
export class TranslatableTextFilter<T extends Entity> extends StringFilter<T> {
  override getFilter(): DataFilter<T> | undefined {
    const searchText = this.getSearchText();
    if (!searchText.trim()) {
      return undefined;
    }

    const condition = { $regex: escapeRegExp(searchText), $options: "i" };
    return {
      $or: [
        { [this.name]: condition },
        ...TRANSLATION_KEYS.map((key) => ({
          [`${this.name}.${key}`]: condition,
        })),
      ],
    } as DataFilter<T>;
  }
}
