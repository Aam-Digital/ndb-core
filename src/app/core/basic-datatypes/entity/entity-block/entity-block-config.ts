/**
 * Configuration for Entity Types to define what the tooltip showing some details about an entity should look like.
 */
export interface EntityBlockConfig {
  /**
   * Primary field displayed as a kind of header in the tooltip.
   */
  title: string;

  /**
   * Optional photo to display in the tooltip.
   */
  photo?: string;

  /**
   * Other fields to be displayed.
   */
  fields: string[];
}
