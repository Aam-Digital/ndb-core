import { Injectable } from "@angular/core";
import { SqlTables, SqlType, SqsSchema } from "./sqs-schema";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { NumberDatatype } from "../../../core/basic-datatypes/number/number.datatype";
import { BooleanDatatype } from "../../../core/basic-datatypes/boolean/boolean.datatype";

/**
 * Service that handles management of necessary SQS configurations
 */
@Injectable({
  providedIn: "root",
})
export class SqlReport {
  constructor(private entities: EntityRegistry) {}

  /**
   * Create a valid SQS schema object for all registered entities
   */
  generateSchema(): SqsSchema {
    const tables: SqlTables = {};
    for (const [name, ctr] of this.entities.entries()) {
      tables[name] = {};
      for (const [attr, attrSchema] of ctr.schema) {
        if (attr === "_rev") {
          // skip internal property
          continue;
        }
        tables[name][attr] = this.getSqlType(attrSchema);
      }
    }
    return SqsSchema.create(tables);
  }

  private getSqlType(schema: EntitySchemaField): SqlType {
    switch (schema.dataType) {
      case NumberDatatype.dataType:
      case BooleanDatatype.dataType:
        return "INTEGER";
      default:
        return "TEXT";
    }
  }
}
