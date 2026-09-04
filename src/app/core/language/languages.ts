import { ConfigurableEnum } from "../basic-datatypes/configurable-enum/configurable-enum";
import { AVAILABLE_LOCALES } from "./available-locales";

export const LOCALE_ENUM_ID = "locales";

/**
 * A readonly array of all locales available
 */
export const availableLocales = new ConfigurableEnum(LOCALE_ENUM_ID, [
  ...AVAILABLE_LOCALES,
]);
