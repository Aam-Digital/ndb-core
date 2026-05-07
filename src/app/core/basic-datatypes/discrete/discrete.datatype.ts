import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Entity } from "../../entity/model/entity";

/**
 * Abstract base for datatypes that hold a discrete set of values.
 *
 * This provides import config and mapping definitions that work across all such types.
 */
export abstract class DiscreteDatatype<
  EntityType,
  DBType,
> extends DefaultDatatype<EntityType, DBType> {
  override importConfigComponent = "DiscreteImportConfig";

  abstract override transformToDatabaseFormat(
    value,
    schemaField?: EntitySchemaField,
    parent?: Entity,
  );

  abstract override transformToObjectFormat(
    value,
    schemaField?: EntitySchemaField,
    parent?: any,
  );

  override async importMapFunction(
    val,
    schemaField: EntitySchemaField,
    additional: DiscreteColumnMappingAdditional,
  ) {
    const valueMappings = additional?.values;

    // If mapping dialog was skipped entirely,
    // treat as raw string value and let transformToObjectFormat handle it
    if (!valueMappings) {
      return super.importMapFunction(val, schemaField);
    }

    // If mapping dialog was opened but this specific value was not mapped,
    // skip the property by returning undefined
    if (valueMappings[val] === undefined) {
      return undefined;
    }

    return super.importMapFunction(valueMappings[val], schemaField);
  }
}

/**
 * Structure for the `additional` field of a ColumnMapping for discrete datatypes.
 */
export interface DiscreteColumnMappingAdditional {
  /** Whether to split values by the configured separator (for array/multi-select fields). */
  enableSplitting?: boolean;

  /** Key-value mapping from raw import values to target entity values. */
  values: { [key: string]: any };
}
