import { FieldGroup } from "../../../core/entity-details/form/field-group";

/**
 * Configuration interface for the NoteDetailsComponent.
 * Defines the three configurable form sections that can be edited in the Admin UI.
 */
export interface NoteDetailsConfig {
  /**
   * Field groups to be displayed in the top form section.
   */
  topForm?: FieldGroup[] | string[];

  /**
   * Field groups to be displayed in the middle form section.
   */
  middleForm?: FieldGroup[] | string[];

  /**
   * Field groups to be displayed in the bottom form section.
   */
  bottomForm?: FieldGroup[] | string[];
}
