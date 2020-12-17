import { TestBed } from "@angular/core/testing";

import { AttendanceService } from "./attendance.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";

describe("AttendanceService", () => {
  let service: AttendanceService;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", ["loadType"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
      ],
    });
    service = TestBed.inject(AttendanceService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
