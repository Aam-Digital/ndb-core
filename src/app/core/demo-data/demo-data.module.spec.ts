import { fakeAsync, flush, TestBed } from "@angular/core/testing";
import { DemoDataModule } from "./demo-data.module";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { PouchDatabase } from "../database/pouch-database";
import { LocalSession } from "../session/session-service/local-session";
import { Database } from "../database/database";

describe("DemoDataModule", () => {
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["saveAll"]);
    return TestBed.configureTestingModule({
      imports: [DemoDataModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        PouchDatabase,
        { provide: Database, useExisting: PouchDatabase },
        LocalSession,
      ],
    }).compileComponents();
  });

  it("should generate the demo data once the module is loaded", fakeAsync(() => {
    TestBed.inject(DemoDataModule).publishDemoData();
    expect(mockEntityMapper.saveAll).not.toHaveBeenCalled();

    TestBed.inject(DemoDataModule);
    flush();

    expect(mockEntityMapper.saveAll).toHaveBeenCalled();
  }));
});
