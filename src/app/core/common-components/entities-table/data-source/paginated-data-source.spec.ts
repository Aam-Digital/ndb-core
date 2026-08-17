import { TestBed } from "@angular/core/testing";
import {
  FULL_LOAD_PAGE_SIZE,
  PaginatedDataSource,
} from "./paginated-data-source";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";

describe("PaginatedDataSource", () => {
  let dataSource: PaginatedDataSource<Entity>;
  let findTypeSpy: ReturnType<typeof vi.spyOn>;

  /** the DB conditions that "isActive: true" is translated into */
  const activeConditions = [
    { inactive: { $ne: true } },
    { inactive: { $exists: false } },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    findTypeSpy = vi.spyOn(TestBed.inject(EntityMapperService), "findType");
    dataSource = TestBed.runInInjectionContext(
      () => new PaginatedDataSource<Entity>(),
    );
  });

  it("should create", () => {
    expect(dataSource).toBeTruthy();
  });

  describe("processFilterForDB", () => {
    // processFilterForDB translates the UI-only "isActive" flag into the
    // "inactive" property stored in the database and normalises enum keys.
    function processFilter(filter: object) {
      return (dataSource as any).processFilterForDB(filter);
    }

    it("should translate 'isActive: true' into 'inactive' conditions via $or", () => {
      expect(processFilter({ isActive: true })).toEqual({
        $or: activeConditions,
      });
    });

    it("should keep other filter conditions alongside the isActive translation", () => {
      expect(processFilter({ isActive: true, name: "x" })).toEqual({
        name: "x",
        $or: activeConditions,
      });
    });

    it("should extend an existing $or by nesting it together with the isActive conditions inside $and", () => {
      const existingOr = [{ a: 1 }, { b: 2 }];

      expect(processFilter({ isActive: true, $or: existingOr })).toEqual({
        $and: [{ $or: existingOr }, { $or: activeConditions }],
      });
    });

    it("should append to an existing $and when translating isActive with an existing $or", () => {
      expect(
        processFilter({ isActive: true, $or: [{ a: 1 }], $and: [{ c: 3 }] }),
      ).toEqual({
        $and: [{ c: 3 }, { $or: [{ a: 1 }] }, { $or: activeConditions }],
      });
    });

    it("should add the isActive $or next to an existing $and (when there is no existing $or)", () => {
      expect(processFilter({ isActive: true, $and: [{ c: 3 }] })).toEqual({
        $and: [{ c: 3 }],
        $or: activeConditions,
      });
    });

    it("should leave filters without 'isActive' unchanged", () => {
      expect(processFilter({ name: "x", $or: [{ a: 1 }] })).toEqual({
        name: "x",
        $or: [{ a: 1 }],
      });
    });

    it("should strip the '.id' suffix of entity/enum reference keys (stored by id only)", () => {
      expect(processFilter({ "category.id": "SCHOOL" })).toEqual({
        category: "SCHOOL",
      });
    });

    it("should combine the isActive translation and the '.id' stripping", () => {
      expect(
        processFilter({ isActive: true, "category.id": "SCHOOL" }),
      ).toEqual({
        category: "SCHOOL",
        $or: activeConditions,
      });
    });
  });

  describe("getAllData", () => {
    it("should return [] when no entity type is configured", async () => {
      expect(await dataSource.getAllData()).toEqual([]);
    });

    it("should page through the DB to return ALL records, not just CouchDB's default page", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });

      // a completely filled page implies there may be more -> another request;
      // a partially filled page means the end is reached
      const firstPage = Array.from(
        { length: FULL_LOAD_PAGE_SIZE },
        (_, i) => new TestEntity(`${i}`),
      );
      const lastPage = [new TestEntity("last-1"), new TestEntity("last-2")];
      findTypeSpy
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(lastPage);

      const result = await dataSource.getAllData(false);

      expect(result).toEqual([...firstPage, ...lastPage]);
      expect(findTypeSpy).toHaveBeenCalledTimes(2);
      // each request explicitly asks for a page (so CouchDB does not cap at 25)
      expect(findTypeSpy).toHaveBeenNthCalledWith(
        1,
        TestEntity,
        {},
        { skip: 0, limit: FULL_LOAD_PAGE_SIZE },
        {},
      );
      expect(findTypeSpy).toHaveBeenNthCalledWith(
        2,
        TestEntity,
        {},
        { skip: FULL_LOAD_PAGE_SIZE, limit: FULL_LOAD_PAGE_SIZE },
        {},
      );
    });

    it("should stop after a single request when the first page is not full", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      findTypeSpy.mockResolvedValue([new TestEntity("1"), new TestEntity("2")]);

      const result = await dataSource.getAllData(false);

      expect(result).toHaveLength(2);
      expect(findTypeSpy).toHaveBeenCalledOnce();
    });

    it("should apply the current (processed) filter when requested filtered", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      dataSource.dataFilter.set({ isActive: true } as any);
      TestBed.tick(); // compute effectiveFilter from dataFilter
      findTypeSpy.mockClear();
      findTypeSpy.mockResolvedValue([]);

      await dataSource.getAllData(true);

      expect(findTypeSpy).toHaveBeenCalledWith(
        TestEntity,
        { $or: activeConditions },
        { skip: 0, limit: FULL_LOAD_PAGE_SIZE },
        {},
      );
    });
  });

  describe("processEntityUpdate", () => {
    function processUpdate(update: UpdatedEntity<Entity>) {
      return (dataSource as any).processEntityUpdate(update);
    }

    it("should reload from the DB when a entity is updated", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));
      findTypeSpy.mockClear();

      await processUpdate({ type: "new", entity: new TestEntity("3") });

      expect(findTypeSpy).toHaveBeenCalled();
    });
  });

  it("should send only a single request even when config, filter and sort change during init", async () => {
    // simulate the burst of triggers that fire while a list view initializes
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();
    dataSource.dataFilter.set({ isActive: true } as any);
    TestBed.tick();
    dataSource.dataFilter.set({ isActive: true, name: "abc" } as any);
    TestBed.tick();

    // no request yet - it is coalesced/debounced
    expect(findTypeSpy).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    // the many triggers resulted in exactly one DB request
    expect(findTypeSpy).toHaveBeenCalledOnce();
  });

  it("should set isLoading while a DB request is running and clear it afterwards", async () => {
    expect(dataSource.isLoading()).toBe(false);

    // configuring the source triggers a DB request (findType)
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();

    expect(dataSource.isLoading()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    expect(dataSource.isLoading()).toBe(false);
  });

  it("should set isLoading again when the filter changes", async () => {
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    expect(dataSource.isLoading()).toBe(false);

    // a filter change makes a new DB request
    dataSource.dataFilter.set({ name: "test" } as any);
    TestBed.tick();

    expect(dataSource.isLoading()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    expect(dataSource.isLoading()).toBe(false);
  });
});
