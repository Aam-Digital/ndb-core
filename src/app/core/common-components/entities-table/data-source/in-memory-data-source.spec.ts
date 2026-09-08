import { TestBed } from "@angular/core/testing";
import { InMemoryDataSource } from "./in-memory-data-source";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject } from "rxjs";

describe("InMemoryDataSource", () => {
  let dataSource: InMemoryDataSource<TestEntity>;
  let entityMapper: EntityMapperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [InMemoryDataSource],
    }).compileComponents();

    dataSource = TestBed.inject(InMemoryDataSource<TestEntity>);
    entityMapper = TestBed.inject(EntityMapperService);
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();
  });

  it("should create", () => {
    expect(dataSource).toBeTruthy();
  });

  it("should set isLoading while (re)loading records and clear it once done", async () => {
    // a fresh data source so we control the load timing
    const ds = TestBed.runInInjectionContext(
      () => new InMemoryDataSource<Entity>(),
    );
    expect(ds.isLoading()).toBe(false);

    ds.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick(); // effect triggers the (async) load

    expect(ds.isLoading()).toBe(true);

    // let the asynchronous load complete
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    expect(ds.isLoading()).toBe(false);
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

  describe("when loading records fails", () => {
    let snackBarOpen: ReturnType<typeof vi.fn>;
    let snackBarDismiss: ReturnType<typeof vi.fn>;
    let retryAction: Subject<void>;

    beforeEach(() => {
      retryAction = new Subject<void>();
      snackBarDismiss = vi.fn();
      snackBarOpen = vi.fn().mockReturnValue({
        onAction: () => retryAction,
        dismiss: snackBarDismiss,
      });
      vi.spyOn(TestBed.inject(MatSnackBar), "open").mockImplementation(
        snackBarOpen as any,
      );
    });

    it("shows a toast with a retry action that reloads the records", async () => {
      const loadType = vi
        .spyOn(entityMapper, "loadType")
        .mockRejectedValue(new Error("Failed to fetch from DB"));

      const ds = TestBed.runInInjectionContext(
        () => new InMemoryDataSource<Entity>(),
      );
      ds.loadRecordConfig.set({ entityCtr: TestEntity });
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      expect(snackBarOpen).toHaveBeenCalled();
      expect(ds.isLoading()).toBe(false);

      // the retry succeeds this time
      loadType.mockResolvedValue([]);
      const callsBeforeRetry = loadType.mock.calls.length;
      retryAction.next();

      expect(ds.isLoading()).toBe(true);
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      expect(loadType.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
      expect(snackBarDismiss).toHaveBeenCalled();
    });
  });

  describe("getAllData", () => {
    let e1: TestEntity;
    let e2: TestEntity;
    let e3: TestEntity;

    beforeEach(async () => {
      e1 = TestEntity.create({ name: "Alpha One", other: "group-a" });
      e2 = TestEntity.create({ name: "Alpha Two", other: "group-a" });
      e3 = TestEntity.create({ name: "Beta One", other: "group-b" });
      await entityMapper.save(e1);
      await entityMapper.save(e2);
      await entityMapper.save(e3);
      TestBed.tick();
    });

    it("should return all records, ignoring any filter, when filtered=false", async () => {
      dataSource.dataFilter.set({ other: "group-a" });
      dataSource.filter = "two";
      TestBed.tick();

      const result = await dataSource.getAllData(false);

      expect(result).toEqual(expect.arrayContaining([e1, e2, e3]));
    });

    it("should apply only the structured dataFilter when no free-text filter is set", async () => {
      dataSource.dataFilter.set({ other: "group-a" });
      TestBed.tick();

      const result = await dataSource.getAllData(true);

      expect(result).toEqual(expect.arrayContaining([e1, e2]));
      expect(result).toHaveLength(2);
    });

    it("should also apply the free-text filter (as currently displayed by the table) when filtered=true", async () => {
      dataSource.dataFilter.set({ other: "group-a" });
      // simulates the free-text search box, which lower-cases+trims before assigning
      dataSource.filter = "two";
      TestBed.tick();

      const result = await dataSource.getAllData(true);

      // e2 matches both the structured filter (group-a) and the free-text
      // filter ("Two" in its name); e1 is excluded by the free-text filter,
      // e3 is excluded by the structured filter.
      expect(result).toEqual([e2]);
    });
  });
});
