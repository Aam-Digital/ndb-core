import { asArray } from "../../utils/asArray";
/**
 * Describes a base configuration that can be used with the SetupService
 * to initialize a system with predefined settings.
 */
export interface BaseConfig {
  /**
   * ID of the base configuration.
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description of the scenario of this base configuration
   * (can contain Markdown formatting).
   */
  description: string;

  /**
   * Names of json files that should be imported during the setup process.
   * Files have to be located in the `assets/base-configs/${id}/` folder
   * and match
   */
  entitiesToImport: string[];

  /**
   * The locale(s) this configuration is offered in.
   * A config whose texts are translated lists all of them; omitting it offers
   * the config in every language.
   */
  locale?: string | string[];

  /**
   * Marks the config that sets up a system with no predefined record types.
   * Offered as a separate option in the setup wizard rather than listed among
   * the scenarios, because it is a categorically different choice.
   */
  startFromScratch?: boolean;

  /**
   * Base URL from which `entitiesToImport` paths are resolved.
   * When set (e.g. for externally loaded configs), file paths are fetched
   * relative to this URL instead of the local `assets/base-configs/` folder.
   */
  baseUrl?: string;
}

/**
 * Whether a base config is offered in the given locale.
 *
 * Matches the base language too, so a config listing `en` is offered for
 * `en-US` - partners write these files by hand.
 */
export function isOfferedInLocale(
  config: Pick<BaseConfig, "locale">,
  locale: string,
): boolean {
  if (!config.locale) {
    return true;
  }
  const base = (l: string) => l.split("-")[0].toLowerCase();
  return asArray(config.locale).some(
    (l) => l === locale || base(l) === base(locale),
  );
}
