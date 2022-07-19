/**
 * Interface for the general configuration of the application.
 * This is independent of the routes.
 */
export interface UiConfig {
  /**
   * The path to a logo icon inside the `assets` folder.
   * This will be displayed on top of the navigation items.
   */
  logo_path?: string;

  /**
   * Toggle whether the language select component should be displayed.
   * This should only be used if configurations for multiple languages are available.
   */
  displayLanguageSelect?: boolean;

  /**
   * The default language of the application which is used after login if the user doesn't select something else.
   */
  default_language?: string;

  /**
   * The title which is shown at the top of the application.
   */
  site_name?: string;
}
