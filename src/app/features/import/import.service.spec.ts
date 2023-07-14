import { TestBed } from "@angular/core/testing";

import { ImportService } from "./import.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";

describe("ImportService", () => {
  let service: ImportService;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["save", "saveAll"]);
    TestBed.configureTestingModule({
      providers: [
        ImportService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(ImportService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
