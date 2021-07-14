import { TestBed } from "@angular/core/testing";

import { ChildPhotoUpdateService } from "./child-photo-update.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe("ChildPhotoUpdateService", () => {
  beforeEach(() => {
    const mockEntityMapper = jasmine.createSpyObj(["loadType", "save"]);
    mockEntityMapper.loadType.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
  });

  it("should be created", () => {
    const service: ChildPhotoUpdateService =
      TestBed.inject<ChildPhotoUpdateService>(ChildPhotoUpdateService);
    expect(service).toBeTruthy();
  });
});
