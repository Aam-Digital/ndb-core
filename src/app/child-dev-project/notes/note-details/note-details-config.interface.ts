/**
 * Configuration interface for the NoteDetailsComponent.
 * Defines the three configurable form sections that can be edited in the Admin UI.
 */
export interface NoteDetailsConfig {
  /**
   * Fields to be displayed in the top form section.
   */
  topForm?: string[];

  /**
   * Fields to be displayed in the middle form section.
   */
  middleForm?: string[];

  /**
   * Fields to be displayed in the bottom form section.
   */
  bottomForm?: string[];
}
