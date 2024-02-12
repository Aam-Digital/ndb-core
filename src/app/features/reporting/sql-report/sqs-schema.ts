import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";

/**
 * SQS schema object.
 * For more information, see the SQS docs.
 */
@DatabaseEntity("_design/sqlite")
export class SqsSchema extends Entity {
  static SQS_SCHEMA_ID = "config";
  static create(tables: SqlTables) {
    const schema = new SqsSchema();
    schema.sql = {
      tables,
      options: {
        table_name: {
          operation: "prefix",
          field: "_id",
          separator: ":",
        },
      },
    };
    return schema;
  }
  constructor() {
    super(SqsSchema.SQS_SCHEMA_ID);
  }

  @DatabaseField() language: "sqlite" = "sqlite";
  @DatabaseField() sql: {
    // SQL table definitions
    tables: SqlTables;
    // Optional SQL indices
    indexes?: string[];
    // Further options
    options?: SqlOptions;
  };
}

export type SqlTables = {
  // Name of the entity
  [table: string]: {
    fields: {
      // Name of the entity attribute and the type of it
      [column: string]: SqlType | { field: string; type: SqlType };
    };
  };
};

export type SqlType = "TEXT" | "INTEGER" | "REAL" | "JSON";

export type SqlOptions = {
  table_name: {
    operation: "prefix";
    field: string;
    separator: string;
  };
};
