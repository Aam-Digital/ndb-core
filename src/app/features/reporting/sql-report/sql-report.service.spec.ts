import { TestBed } from "@angular/core/testing";

import { SqlReportService } from "./sql-report.service";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { ReportEntity, SqlReport } from "../report-config";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { SqsSchema } from "./sqs-schema";
import moment from "moment";

xdescribe("SqlReportService", () => {
  let service: SqlReportService;
  let mockEntities: EntityRegistry;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    entityRegistry.allowDuplicates();
    mockEntities = new EntityRegistry();
    mockHttpClient = jasmine.createSpyObj(["post"]);
    mockHttpClient.post.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityRegistry, useValue: mockEntities },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    });
    service = TestBed.inject(SqlReportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should query the external service with the provided report data", async () => {
    const mockResult = [{ some: "data" }];
    mockHttpClient.post.and.returnValue(of(mockResult));
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    const result = await service.query(
      report,
      moment("2023-01-01").toDate(),
      moment("2024-01-01").toDate(),
    );

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      `${SqlReportService.QUERY_PROXY}/report/app/${report.getId()}`,
      {
        from: "2023-01-01",
        to: "2024-01-01",
      },
    );
    expect(result).toEqual(mockResult);
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

  it("should update the schema when querying the service", async () => {
    @DatabaseEntity("SchemaTest")
    class SchemaTest extends Entity {}
    mockEntities.add(SchemaTest.ENTITY_TYPE, SchemaTest);
    const entityMapper = TestBed.inject(EntityMapperService);
    const saveSpy = spyOn(entityMapper, "save").and.callThrough();
    const report = new ReportEntity() as SqlReport;
    report.mode = "sql";

    await service.query(report, new Date(), new Date());
    expect(saveSpy).toHaveBeenCalledWith(jasmine.any(SqsSchema));

    // SqsSchema exists and entity schema hasn't changed
    saveSpy.calls.reset();
    await service.query(report, new Date(), new Date());
    expect(saveSpy).not.toHaveBeenCalled();

    // SqsSchema exists and entity schema changed
    saveSpy.calls.reset();
    SchemaTest.schema.set("test", { dataType: "string" });
    await service.query(report, new Date(), new Date());
    expect(saveSpy).toHaveBeenCalledWith(jasmine.any(SqsSchema));

    SchemaTest.schema.delete("test");
  });
});
