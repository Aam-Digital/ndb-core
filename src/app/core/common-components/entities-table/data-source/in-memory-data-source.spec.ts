import { TestBed } from "@angular/core/testing";
import { InMemoryDataSource } from "./in-memory-data-source";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("InMemoryDataSource", () => {
  let dataSource: InMemoryDataSource<Entity>;
  let entityMapper: EntityMapperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [InMemoryDataSource],
    }).compileComponents();

    dataSource = TestBed.inject(InMemoryDataSource);
    entityMapper = TestBed.inject(EntityMapperService);
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();
  });

  it("should create", () => {
    expect(dataSource).toBeTruthy();
  });

  it("should add a new entity that was created after the initial loading to the table", async () => {
    const entity = new TestEntity();

    await entityMapper.save(entity);
    // flush the signal effects (allRecords -> filteredRecords -> data)
    TestBed.tick();

    expect(dataSource.data).toEqual([{ record: entity }]);
  });

  it("should remove an entity from the table when it has been deleted", async () => {
    const entity = new TestEntity();
    await entityMapper.save(entity);
    TestBed.tick();

    expect(dataSource.data).toEqual([{ record: entity }]);

    await entityMapper.remove(entity);
    TestBed.tick();

    expect(dataSource.data).toEqual([]);
  });
});
