import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { DemoDataModule } from "./demo-data.module";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { MockedTestingModule } from "../../utils/mocked-testing.module";

describe("DemoDataModule", () => {
  beforeEach(() => {
    return TestBed.configureTestingModule({
      imports: [DemoDataModule, MockedTestingModule.withState()],
      providers: [],
    }).compileComponents();
  });

  it("should generate the demo data once the module is loaded", fakeAsync(() => {
    const saveAllSpy = spyOn(TestBed.inject(EntityMapperService), "saveAll");

    TestBed.inject(DemoDataModule).publishDemoData();
    expect(saveAllSpy).not.toHaveBeenCalled();

    tick();

    expect(saveAllSpy).toHaveBeenCalled();
    flush();
  }));
});
