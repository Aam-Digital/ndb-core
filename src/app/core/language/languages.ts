import { ConfigurableEnum } from "../basic-datatypes/configurable-enum/configurable-enum";

export const LOCALE_ENUM_ID = "locales";

/**
 * A readonly array of all locales available
 */
export const availableLocales = new ConfigurableEnum(LOCALE_ENUM_ID, [
  { id: "en-US", label: "en" },
  { id: "de", label: "de" },
  { id: "fr", label: "fr" },
  { id: "it", label: "it" },
]);
