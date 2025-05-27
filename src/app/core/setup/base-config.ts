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
   * (can contain markdown formatting).
   */
  description: string;
}
