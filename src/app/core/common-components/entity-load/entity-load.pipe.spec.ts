import { TestBed } from "@angular/core/testing";
import { EntityLoadPipe } from "./entity-load.pipe";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

describe("EntityLoadPipe", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntityLoadPipe,
        {
          provide: EntityMapperService,
          useValue: {
            load: jasmine.createSpy("load"),
          },
        },
      ],
    });
  });

  it("should be created", () => {
    const pipe = TestBed.inject(EntityLoadPipe);
    expect(pipe).toBeTruthy();
  });
});
