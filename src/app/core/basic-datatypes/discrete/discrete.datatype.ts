import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ColumnMapping } from "../../import/column-mapping";
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
  importConfigComponent = "DiscreteImportConfig";

  abstract transformToDatabaseFormat(
    value,
    schemaField?: EntitySchemaField,
    parent?: Entity,
  );

  abstract transformToObjectFormat(
    value,
    schemaField?: EntitySchemaField,
    parent?: any,
  );

  async importMapFunction(
    val,
    schemaField: EntitySchemaField,
    additional: { [key: string]: any },
  ) {
    return super.importMapFunction(additional?.[val], schemaField);
  }

  importIncompleteAdditionalConfigBadge(col: ColumnMapping): string {
    if (!col.additional) {
      return "?";
    }
    const unmappedValues = Object.values(col.additional).filter(
      (v) => v === undefined,
    );
    if (unmappedValues.length > 0) {
      return unmappedValues.length.toString();
    }
    return undefined;
  }
}
