import { testDatatype } from "../schema/entity-schema.service.spec";
import { UpdateMetadataDatatype } from "./update-metadata.datatype";
import { UpdateMetadata } from "./update-metadata";
import moment from "moment";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("Schema data type: update-metadata", () => {
  let entitySchemaService: EntitySchemaService;

  beforeAll(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  // TODO: test doesn't work yet - get access to a full entitySchemaService somehow ...

  testDatatype(
    new UpdateMetadataDatatype(entitySchemaService),
    {
      by: "tester",
      at: moment("2023-12-06T14:25:43.976Z").toDate(),
    } as UpdateMetadata,
    { by: "tester", at: "2023-12-06T14:25:43.976Z" },
    undefined,
    entitySchemaService,
  );
});
