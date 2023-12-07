import { TestBed } from "@angular/core/testing";

import { SqlReportService } from "./sql-report.service";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { SqlReport } from "../report-config";

describe("SqlReportService", () => {
  let service: SqlReportService;
  let mockEntities: EntityRegistry;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    mockEntities = new EntityRegistry();
    mockHttpClient = jasmine.createSpyObj(["post"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityRegistry, useValue: mockEntities },
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(SqlReportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should query the external service with the provided report data", async () => {
    const result = [{ some: "data" }];
    mockHttpClient.post.and.returnValue(of(result));
    const report = new SqlReport();

    await service.query(report, new Date("2023-01-01"), new Date("2024-01-01"));

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${SqlReportService.QUERY_PROXY}/app/${report.getId(true)}`,
      {
        from: "2023-01-01",
        to: "2024-01-01",
      },
    );
  });

  it("should generate a valid schema including all properties", () => {
    @DatabaseEntity("SchemaTest")
    class SchemaTest extends Entity {
      @DatabaseField() numberProp: number;
      @DatabaseField() stringProp: string;
      @DatabaseField({ dataType: "entity" }) entityProp: string;
      @DatabaseField({ innerDataType: "configurable-enum" })
      arrayEnum: string[];
      @DatabaseField() booleanProp: boolean;
    }
    mockEntities.add(SchemaTest.ENTITY_TYPE, SchemaTest);

    const schema = service.generateSchema();

    expect(schema.sql).toEqual({
      tables: {
        SchemaTest: {
          _id: "TEXT",
          created: "TEXT",
          updated: "TEXT",
          inactive: "INTEGER",
          anonymized: "INTEGER",
          numberProp: "INTEGER", // TODO distinguish REAL and INT? SQLITE anyways has dynamic typing https://sqlite.org/datatype3.html
          stringProp: "TEXT",
          entityProp: "TEXT",
          arrayEnum: "TEXT",
          booleanProp: "INTEGER", // TODO check that this works with SQS
        },
      },
      options: {
        table_name: {
          operation: "prefix",
          field: "_id",
          separator: ":",
        },
      },
    });
  });
});
