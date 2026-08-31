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

/**
 * A minimal fake MatPaginator: PaginatedDataSource only reads `pageSize`/
 * `pageIndex` and reacts to `.initialized`/`.page` emissions, and (indirectly,
 * via the base class's `dataFilter` effect) calls `.firstPage()`.
 */
function createFakePaginator(pageSize: number, pageIndex = 0) {
  return {
    pageSize,
    pageIndex,
    initialized: new Subject<void>(),
    page: new Subject<PageEvent>(),
    firstPage: () => {},
  };
}

/**
 * Simulate a user-driven page/size change: a real MatPaginator updates its own
 * `pageIndex`/`pageSize` properties *before* emitting the `page` event, and
 * PaginatedDataSource's subscriber reads those live properties off the
 * paginator (not the event payload) - so the fake must mirror that.
 */
function firePage(
  paginator: ReturnType<typeof createFakePaginator>,
  event: PageEvent,
) {
  paginator.pageIndex = event.pageIndex;
  paginator.pageSize = event.pageSize;
  paginator.page.next(event);
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
        // the 11th (probe) record is not shown - only pageSize records are
        { limit: 11, bookmark: undefined },
        {},
      );
      expect(dataSource.filteredRecords()).toEqual(page0);
      expect(dataSource.hasUnknownTotalCount()).toBe(true);
    });

    it("should not query anything before a paginator is bound", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      TestBed.tick();
      await flush();

      expect(findTypeSpy).not.toHaveBeenCalled();
      expect(dataSource.filteredRecords()).toEqual([]);
    });

    it("should only fetch the missing records (the deficit) for the next page, continuing from the stored bookmark", async () => {
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

      // page index 1 needs records up to index 21 (2 * 10 + 1 probe); 11 are
      // already loaded, so only 10 more should be requested
      const nextBatch = Array.from(
        { length: 10 },
        (_, i) => new TestEntity(`p1-${i}`),
      );
      findTypeSpy.mockResolvedValueOnce({
        records: nextBatch,
        bookmark: "bm-page1",
      });

      firePage(paginator, { pageSize: 10, pageIndex: 1, length: 0 });
      await flush();

      expect(findTypeSpy).toHaveBeenLastCalledWith(
        TestEntity,
        {},
        { limit: 10, bookmark: "bm-page0" },
        {},
      );
      // the array keeps growing - it now holds everything loaded across both pages
      expect(dataSource.filteredRecords()).toEqual([...page0, ...nextBatch]);
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

      const page1Extra = [new TestEntity("p1-0")];
      findTypeSpy.mockResolvedValueOnce({
        records: page1Extra,
        bookmark: "bm-page1",
      });
      firePage(paginator, { pageSize: 10, pageIndex: 1, length: 0 });
      await flush();

      findTypeSpy.mockClear();
      firePage(paginator, { pageSize: 10, pageIndex: 0, length: 0 });
      await flush();

      expect(findTypeSpy).not.toHaveBeenCalled();
      // still the full array loaded so far - navigating backward does not shrink it
      expect(dataSource.filteredRecords()).toEqual([...page0, ...page1Extra]);
    });

    it("should stop requesting once a fetch returns fewer records than asked for (end of data)", async () => {
      dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
      // only 3 records exist in total, fewer than the requested 11
      const allRecords = [
        new TestEntity("1"),
        new TestEntity("2"),
        new TestEntity("3"),
      ];
      findTypeSpy.mockResolvedValueOnce({
        records: allRecords,
        bookmark: "bm-end",
      });

      const paginator = createFakePaginator(10, 0);
      dataSource.paginator = paginator as unknown as MatPaginator;
      paginator.initialized.next();
      await flush();

      expect(dataSource.filteredRecords()).toEqual(allRecords);
      expect(dataSource.hasUnknownTotalCount()).toBe(false);

      findTypeSpy.mockClear();
      // navigating to a later page must not trigger another request:
      // reachedEnd is already known from the previous, short response
      firePage(paginator, { pageSize: 10, pageIndex: 1, length: 0 });
      await flush();

      expect(findTypeSpy).not.toHaveBeenCalled();
    });

    describe("page size changes", () => {
      it("should not reset the loaded records or bookmark, only fetch the additional deficit", async () => {
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

        // increasing the page size to 20 needs 21 records in total (20 + 1
        // probe); 11 are already loaded, so only 10 more are requested,
        // continuing from the existing bookmark (not starting over)
        const additional = Array.from(
          { length: 10 },
          (_, i) => new TestEntity(`extra-${i}`),
        );
        findTypeSpy.mockResolvedValueOnce({
          records: additional,
          bookmark: "bm-after-resize",
        });

        firePage(paginator, { pageSize: 20, pageIndex: 0, length: 0 });
        await flush();

        expect(findTypeSpy).toHaveBeenLastCalledWith(
          TestEntity,
          {},
          { limit: 10, bookmark: "bm-page0" },
          {},
        );
        expect(dataSource.filteredRecords()).toEqual([...page0, ...additional]);
      });

      it("should not fetch again when the new (smaller) page size is already fully covered by loaded records", async () => {
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
        // shrinking the page size still only requires 6 records (5 + 1 probe),
        // already covered by the 11 already loaded
        firePage(paginator, { pageSize: 5, pageIndex: 0, length: 0 });
        await flush();

        expect(findTypeSpy).not.toHaveBeenCalled();
      });
    });

    describe("reset on filter/sort/entity-update", () => {
      async function setUpPageOneWithTwoPages() {
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

        findTypeSpy.mockResolvedValueOnce({
          records: [new TestEntity("p1-0")],
          bookmark: "bm-page1",
        });
        firePage(paginator, { pageSize: 10, pageIndex: 1, length: 0 });
        await flush();

        findTypeSpy.mockClear();
        return paginator;
      }

      it("should empty filteredRecords, move the paginator back to page 0, and refetch from scratch when the filter changes", async () => {
        const paginator = await setUpPageOneWithTwoPages();

        const filteredPage0 = [new TestEntity("filtered-0")];
        findTypeSpy.mockResolvedValueOnce({
          records: filteredPage0,
          bookmark: "bm-filtered",
        });

        dataSource.dataFilter.set({ name: "test" } as any);
        TestBed.tick();
        await flush();

        expect(paginator.pageIndex).toBe(0);
        expect(findTypeSpy).toHaveBeenCalledWith(
          TestEntity,
          { name: "test" },
          { limit: 11, bookmark: undefined },
          {},
        );
        expect(dataSource.filteredRecords()).toEqual(filteredPage0);
      });

      it("should empty filteredRecords, move the paginator back to page 0, and refetch from scratch when the sort order changes", async () => {
        const paginator = await setUpPageOneWithTwoPages();

        const sortedPage0 = Array.from(
          { length: 11 },
          (_, i) => new TestEntity(`sorted-${i}`),
        );
        findTypeSpy.mockResolvedValueOnce({
          records: sortedPage0,
          bookmark: "bm-sorted",
        });

        (dataSource as any).updateSort("name", "asc");
        await flush();

        expect(paginator.pageIndex).toBe(0);
        expect(findTypeSpy).toHaveBeenCalledWith(
          TestEntity,
          {},
          { limit: 11, bookmark: undefined },
          { prop: "name", dir: "asc" },
        );
        expect(dataSource.filteredRecords()).toEqual(sortedPage0);
      });

      it("should empty filteredRecords, move the paginator back to page 0, and refetch from scratch when an entity update is received", async () => {
        const paginator = await setUpPageOneWithTwoPages();

        const reloadedPage0 = Array.from(
          { length: 11 },
          (_, i) => new TestEntity(`reloaded-${i}`),
        );
        findTypeSpy.mockResolvedValueOnce({
          records: reloadedPage0,
          bookmark: "bm-reloaded",
        });

        await (dataSource as any).processEntityUpdate();
        await flush();

        expect(paginator.pageIndex).toBe(0);
        expect(findTypeSpy).toHaveBeenCalledWith(
          TestEntity,
          {},
          { limit: 11, bookmark: undefined },
          {},
        );
        expect(dataSource.filteredRecords()).toEqual(reloadedPage0);
      });

      it("should clear filteredRecords immediately, even before a paginator is bound", () => {
        dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
        // simulate already having some (stale) records, e.g. from a previous config
        dataSource.filteredRecords.set([new TestEntity("stale")]);

        (dataSource as any).updateSort("name", "asc");

        expect(dataSource.filteredRecords()).toEqual([]);
      });
    });
  });

  it("should send only a single request even when config, filter and sort change during init", async () => {
    // simulate the burst of triggers that fire while a list view initializes
    const paginator = createFakePaginator(10, 0);
    dataSource.paginator = paginator as unknown as MatPaginator;
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    paginator.initialized.next();
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
    // resetPaginationCache() only re-triggers a load once a paginator is bound
    const paginator = createFakePaginator(10, 0);
    dataSource.paginator = paginator as unknown as MatPaginator;
    dataSource.loadRecordConfig.set({ entityCtr: TestEntity });
    paginator.initialized.next();
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
