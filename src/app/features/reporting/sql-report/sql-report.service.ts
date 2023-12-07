import { Injectable } from "@angular/core";
import { SqlTables, SqlType, SqsSchema } from "./sqs-schema";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { NumberDatatype } from "../../../core/basic-datatypes/number/number.datatype";
import { BooleanDatatype } from "../../../core/basic-datatypes/boolean/boolean.datatype";
import { SqlReport } from "../report-config";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
import { firstValueFrom } from "rxjs";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { isEqual } from "lodash-es";

/**
 * Service that handles management of necessary SQS configurations
 */
@Injectable({
  providedIn: "root",
})
export class SqlReportService {
  static QUERY_PROXY = "/query";
  constructor(
    private entities: EntityRegistry,
    private http: HttpClient,
    private entityMapper: EntityMapperService,
  ) {}

  async query(report: SqlReport, from: Date, to: Date) {
    await this.updateSchemaIfNecessary();
    return firstValueFrom(
      this.http.post<any[]>(
        `${SqlReportService.QUERY_PROXY}/app/${report.getId(true)}`,
        {
          from: moment(from).format("YYYY-MM-DD"),
          to: moment(to).format("YYYY-MM-DD"),
        },
      ),
    );
  }

  private async updateSchemaIfNecessary() {
    const existing = await this.entityMapper
      .load(SqsSchema, SqsSchema.SQS_SCHEMA_ID)
      .catch(() => new SqsSchema());

    const newSchema = this.generateSchema();
    if (isEqual(newSchema.sql, existing.sql)) {
      return;
    }

    existing.sql = newSchema.sql;
    await this.entityMapper.save(existing);
  }

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
