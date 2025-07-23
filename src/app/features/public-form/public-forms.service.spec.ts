import { TestBed } from "@angular/core/testing";

import { PublicFormsService } from "./public-forms.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

describe("PublicFormsService", () => {
  let service: PublicFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load"]),
        },
      ],
    });

    service = TestBed.inject(PublicFormsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
