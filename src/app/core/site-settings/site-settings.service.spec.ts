import { TestBed } from "@angular/core/testing";

import { SiteSettingsService } from "./site-settings.service";
import { FileService } from "../../features/file/file.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";

describe("SiteSettingsService", () => {
  let service: SiteSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FileService, useValue: undefined },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    });
    service = TestBed.inject(SiteSettingsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
