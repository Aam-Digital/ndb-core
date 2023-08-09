import { ColumnMapping } from "../column-mapping";
import { ComponentType } from "@angular/cdk/overlay";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";

/**
 * Implemented by EntityDatatype services,
 * these properties enable advanced tools of the Import Module to support importing raw, external data into entities.
 */
export interface ImportValueMapping {
  /**
   * The function used to map values from the import data to values in the entities to be created.
   * @param val The value from an imported cell to be mapped
   * @param schema The schema field definition for the target property into which the value is mapped
   * @param additional config as returned by the configComponent
   */
  importMapFunction: (
    val: any,
    schema: EntitySchemaField,
    additional?: any,
  ) => any;

  /**
   * A component to be display as a dialog to configure the transformation function
   * (e.g. defining a format or mapping)
   */
  importConfigComponent?: ComponentType<any>;

  /**
   * Output a label indicating whether the given column mapping needs user configuration for the "additional" config
   * or has a valid, complete "additional" config.
   * returns "undefined" if no user action is required.
   * @param col
   */
  importIncompleteAdditionalConfigBadge?: (col: ColumnMapping) => string;
}
