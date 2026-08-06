import { TestBed } from "@angular/core/testing";
import { PaginatedDataSource } from "./paginated-data-source";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Entity } from "#src/app/core/entity/model/entity";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

describe("PaginatedDataSource", () => {
  let dataSource: PaginatedDataSource<Entity>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    dataSource = TestBed.runInInjectionContext(
      () => new PaginatedDataSource<Entity>(),
    );
  });

  it("should create", () => {
    expect(dataSource).toBeTruthy();
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
