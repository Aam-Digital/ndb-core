import { ColumnMapping } from "../column-mapping";
import { Registry } from "../../../core/registry/dynamic-registry";
import { ComponentType } from "@angular/cdk/overlay";
import { InjectionToken } from "@angular/core";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";

/**
 * Get an injection token for the value mapper service of the given datatype.
 * @param datatype
 * @constructor
 */
export function IMPORT_VALUE_MAPPER_TOKEN(datatype: string) {
  if (!tokenMap.get(datatype)) {
    tokenMap.set(
      datatype,
      new InjectionToken<ImportValueMapping>("IMPORT_VALUE_MAPPER:" + datatype),
    );
  }
  return tokenMap.get(datatype);
}
const tokenMap = new Map<string, InjectionToken<ImportValueMapping>>();

export class ImportValueMappingRegistry extends Registry<ImportValueMapping> {}

export interface ImportValueMapping {
  /**
   * The function used to map values from the import data to values in the entities to be created.
   * @param val The value from an imported cell to be mapped
   * @param schema The schema field definition for the target property into which the value is mapped
   * @param additional config as returned by the configComponent
   */
  mapFunction: (val: any, schema: EntitySchemaField, additional?: any) => any;

  /**
   * A component to be display as a dialog to configure the transformation function
   * (e.g. defining a format or mapping)
   */
  configComponent?: ComponentType<any>;

  /**
   * Output a label indicating whether the given column mapping needs user configuration for the "additional" config
   * or has a valid, complete "additional" config.
   * returns "undefined" if no user action is required.
   * @param col
   */
  incompleteAdditionalConfigBadge?: (col: ColumnMapping) => string;
}
