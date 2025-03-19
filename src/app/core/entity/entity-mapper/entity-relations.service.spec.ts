import { TestBed } from "@angular/core/testing";

import { EntityRelationsService } from "./entity-relations.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityMapperService } from "./entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";

describe("EntityRelationsService", () => {
  let service: EntityRelationsService;

  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    entityMapper = mockEntityMapper();

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    service = TestBed.inject(EntityRelationsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
