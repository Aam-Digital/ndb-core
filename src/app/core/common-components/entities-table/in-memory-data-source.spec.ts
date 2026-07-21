import { TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { InMemoryDataSource } from "./in-memory-data-source";

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
