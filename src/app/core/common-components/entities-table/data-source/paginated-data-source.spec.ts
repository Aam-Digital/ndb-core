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
import { Subject } from "rxjs";
import { MatPaginator, PageEvent } from "@angular/material/paginator";

function createFakePaginator(pageSize: number, pageIndex = 0) {
  return {
    pageSize,
    pageIndex,
    initialized: new Subject<void>(),
    page: new Subject<PageEvent>(),
    firstPage: () => {},
  };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

describe("PaginatedDataSource", () => {
  let dataSource: PaginatedDataSource<Entity>;
  let findTypeSpy: ReturnType<typeof vi.spyOn>;

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
    function processFilter(filter: object) {
      return (dataSource as any).processFilterForDB(filter);
    }

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
        .mockResolvedValueOnce({ records: firstPage, bookmark: "bm1" })
        .mockResolvedValueOnce({ records: lastPage, bookmark: "bm2" });

      const result = await dataSource.getAllData(false);

      expect(result).toEqual([...firstPage, ...lastPage]);
      expect(findTypeSpy).toHaveBeenCalledTimes(2);
      // each request explicitly asks for a page (so CouchDB does not cap at 25)
      expect(findTypeSpy).toHaveBeenNthCalledWith(
        1,
        TestEntity,
        {},
        { limit: FULL_LOAD_PAGE_SIZE, bookmark: undefined },
        {},
      );
      // the second request continues from the bookmark of the first, not a skip offset
      expect(findTypeSpy).toHaveBeenNthCalledWith(
        2,
        TestEntity,
        {},
        { limit: FULL_LOAD_PAGE_SIZE, bookmark: "bm1" },
        {},
      );
    });

    it("should stop after a single request when the first page is not full", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      findTypeSpy.mockResolvedValue({
        records: [new TestEntity("1"), new TestEntity("2")],
        bookmark: "bm1",
      });

      const result = await dataSource.getAllData(false);

      expect(result).toHaveLength(2);
      expect(findTypeSpy).toHaveBeenCalledOnce();
    });

    it("should apply the current (processed) filter when requested filtered", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      dataSource.dataFilter.set({ "category.id": "SCHOOL" } as any);
      TestBed.tick(); // compute effectiveFilter from dataFilter
      findTypeSpy.mockClear();
      findTypeSpy.mockResolvedValue({ records: [], bookmark: undefined });

      await dataSource.getAllData(true);

      expect(findTypeSpy).toHaveBeenCalledWith(
        TestEntity,
        { category: "SCHOOL" },
        { limit: FULL_LOAD_PAGE_SIZE, bookmark: undefined },
        {},
      );
    });
  });

  describe("pagination (bookmark-based)", () => {
    it("should request pageSize+1 records with no bookmark for the first page", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      const page0 = Array.from(
        { length: 11 },
        (_, i) => new TestEntity(`${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      expect(findTypeSpy).toHaveBeenCalledWith(
        TestEntity,
        {},
        { limit: 11, bookmark: undefined },
        {},
      );
      // the 11th (probe) record is not shown - only pageSize records are
      expect(dataSource.filteredRecords()).toEqual(page0.slice(0, 10));
      expect(dataSource.hasUnknownTotalCount()).toBe(true);
    });

    it("should fetch the next page using the previous page's bookmark, prepending the carried-over probe record", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      const page0 = Array.from(
        { length: 11 },
        (_, i) => new TestEntity(`p0-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      const page1Rest = Array.from(
        { length: 9 },
        (_, i) => new TestEntity(`p1-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page1Rest,
        bookmark: "bm-page1",
      });

      paginator.page.next({ pageSize: 10, pageIndex: 1, length: 0 });
      await flush();

      // the 11th record of page 0 was already fetched (as a probe) and is not
      // re-requested: only the remaining 9 records of page 1 are needed
      expect(findTypeSpy).toHaveBeenLastCalledWith(
        TestEntity,
        {},
        { limit: 10, bookmark: "bm-page0" },
        {},
      );
      expect(dataSource.filteredRecords()).toEqual([page0[10], ...page1Rest]);
    });

    it("should not send another request when navigating back to an already visited page", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      const page0 = Array.from(
        { length: 11 },
        (_, i) => new TestEntity(`p0-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      const page1Rest = [new TestEntity("p1-0")];
      findTypeSpy.mockResolvedValueOnce({
        records: page1Rest,
        bookmark: "bm-page1",
      });
      paginator.page.next({ pageSize: 10, pageIndex: 1, length: 0 });
      await flush();

      findTypeSpy.mockClear();
      paginator.page.next({ pageSize: 10, pageIndex: 0, length: 0 });
      await flush();

      expect(findTypeSpy).not.toHaveBeenCalled();
      expect(dataSource.filteredRecords()).toEqual(page0.slice(0, 10));
    });

    it("should reset the cache and start over from page 0 when the page size changes", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      const page0 = Array.from(
        { length: 11 },
        (_, i) => new TestEntity(`p0-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      findTypeSpy.mockClear();
      const newSizePage = Array.from(
        { length: 5 },
        (_, i) => new TestEntity(`new-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: newSizePage,
        bookmark: "bm-new",
      });

      paginator.page.next({ pageSize: 20, pageIndex: 0, length: 0 });
      await flush();

      // a fresh request (not served from the page-0 cache) is required because
      // the previously cached pages no longer align with the new page size
      expect(findTypeSpy).toHaveBeenCalledWith(
        TestEntity,
        {},
        { limit: 21, bookmark: undefined },
        {},
      );
    });

    it("should reset the cache when an entity update is processed", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      const page0 = Array.from(
        { length: 5 },
        (_, i) => new TestEntity(`p0-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      findTypeSpy.mockClear();
      findTypeSpy.mockResolvedValueOnce({
        records: page0,
        bookmark: "bm-page0",
      });

      await (dataSource as any).processEntityUpdate();
      await flush();

      // the cache was invalidated, so revisiting page 0 requires a new request
      expect(findTypeSpy).toHaveBeenCalledWith(
        TestEntity,
        {},
        { limit: 11, bookmark: undefined },
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
