import { Entity } from "app/core/entity/model/entity";
import {
  EntityForm,
  EntityFormGroup,
} from "#src/app/core/common-components/entity-form/entity-form";

/**
 * Wrapper to keep additional form data for each row of an entity, required for inline editing.
 */
export interface TableRow<T extends Entity> {
  record: T;
  formGroup?: EntityFormGroup<T>;
  /**
   * The full form (of which `formGroup` is just one part), set alongside `formGroup` while the
   * row is being inline-edited. Field-editing components need this whole object - not only its
   * `formGroup` - to support features like inherited-value syncing.
   */
  form?: EntityForm<T>;
}
