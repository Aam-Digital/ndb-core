/**
 * Describes a base configuration that can be used with the SetupService
 * to initialize a system with predefined settings.
 */
export interface BaseConfig {
  /**
   * ID of the base configuration.
   *
   * This also has to match the name of the subfolder under `assets/base-configs/`
   * which contains the configuration files.
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
}
