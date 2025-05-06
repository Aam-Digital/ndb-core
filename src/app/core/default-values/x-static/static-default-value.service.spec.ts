import { TestBed } from "@angular/core/testing";

import { StaticDefaultValueService } from "./static-default-value.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

describe("StaticDefaultValueService", () => {
  let service: StaticDefaultValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EntitySchemaService, useValue: null }],
    });
    service = TestBed.inject(StaticDefaultValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
