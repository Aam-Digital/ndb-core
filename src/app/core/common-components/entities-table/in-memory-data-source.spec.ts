import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { InMemoryDataSource } from "./in-memory-data-source";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { MockEntityMapperService } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Entity, EntityConstructor } from "../../entity/model/entity";

describe("InMemoryDataSource", () => {
  let entityMapper: MockEntityMapperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreTestingModule, NoopAnimationsModule],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
            createUrlTree: vi.fn().mockReturnValue({ toString: () => "/" }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  function createDataSource<T extends Entity>(entityType?: EntityConstructor<T>) {
    return TestBed.runInInjectionContext(
      () => new InMemoryDataSource(entityType),
    );
  }

  // ---- Loading ----

  it("should start with isLoading=true when entityType is provided", () => {
    entityMapper.addAll([TestEntity.create("A")]);
    const ds = createDataSource(TestEntity);
    expect(ds.isLoading()).toBe(true);
  });

  it("should load entities of the given type from EntityMapperService", fakeAsync(() => {
    const e1 = TestEntity.create("A");
    const e2 = TestEntity.create("B");
    entityMapper.addAll([e1, e2]);

    const ds = createDataSource(TestEntity);
    tick(); // resolve the loadType() promise
    TestBed.tick();

    expect(ds.allRecords()).toEqual([e1, e2]);
  }));

  it("should set isLoading=false after entities are loaded", fakeAsync(() => {
    const ds = createDataSource(TestEntity);
    expect(ds.isLoading()).toBe(true);

    tick();
    TestBed.tick();

    expect(ds.isLoading()).toBe(false);
  }));

  it("should not auto-load when no entityType is provided", fakeAsync(() => {
    const ds = createDataSource();
    tick();
    expect(ds.allRecords()).toBeUndefined();
    expect(ds.isLoading()).toBe(true); // stays loading until caller sets allRecords
  }));

  it("should set isLoading=false once external records are provided", fakeAsync(() => {
    const ds = createDataSource();
    expect(ds.isLoading()).toBe(true);

    ds.allRecords.set([]);
    expect(ds.isLoading()).toBe(false);
  }));

  // ---- Real-time updates ----

  it("should add newly created entities via real-time updates", fakeAsync(() => {
    const ds = createDataSource(TestEntity);
    tick();
    TestBed.tick();

    const newEntity = TestEntity.create("New");
    entityMapper.add(newEntity);
    TestBed.tick();

    expect(ds.allRecords()).toContain(newEntity);
  }));

  it("should update existing entities via real-time updates", fakeAsync(() => {
    const entity = TestEntity.create("Old");
    entityMapper.add(entity);
    const ds = createDataSource(TestEntity);
    tick();
    TestBed.tick();

    expect(ds.allRecords()).toContain(entity);

    entity.name = "Updated";
    entityMapper.add(entity); // triggers update
    TestBed.tick();

    expect(
      ds.allRecords()?.find((e) => e.getId() === entity.getId())?.name,
    ).toBe("Updated");
  }));

  it("should remove deleted entities via real-time updates", fakeAsync(() => {
    const entity = TestEntity.create("ToDelete");
    entityMapper.add(entity);
    const ds = createDataSource(TestEntity);
    tick();
    TestBed.tick();
    expect(ds.allRecords()).toContain(entity);


    entityMapper.delete(entity);
    TestBed.tick();

    expect(
      ds.allRecords()?.find((e) => e.getId() === entity.getId()),
    ).toBeUndefined();
  }));

  // ---- Filtering: isActive ----

  it("should filter out inactive records by default", fakeAsync(() => {
    const active = TestEntity.create("Active");
    const inactive = TestEntity.create("Inactive");
    inactive.inactive = true;
    entityMapper.addAll([active, inactive]);

    const ds = createDataSource(TestEntity);
    tick();
    TestBed.tick();

    expect(ds.filteredRecords()).toEqual([active]);
  }));

  it("should include inactive records when showInactive is set to true", fakeAsync(() => {
    const active = TestEntity.create("Active");
    const inactive = TestEntity.create("Inactive");
    inactive.inactive = true;
    entityMapper.addAll([active, inactive]);

    const ds = createDataSource(TestEntity);
    tick();
    ds.showInactive.set(true);
    TestBed.tick();

    expect(ds.filteredRecords()).toContain(inactive);
    expect(ds.filteredRecords()).toContain(active);
  }));

  // ---- Filtering: domain filter ----

  it("should apply domain filter", fakeAsync(() => {
    const matching = TestEntity.create("Alice");
    const notMatching = TestEntity.create("Bob");
    entityMapper.addAll([matching, notMatching]);

    const ds = createDataSource(TestEntity);
    tick();
    ds.filter.set({ name: "Alice" } as any);
    TestBed.tick();

    expect(ds.filteredRecords()).toEqual([matching]);
  }));

  // ---- Filtering: freetext ----

  it("should apply freetext filter", fakeAsync(() => {
    const matching = TestEntity.create("Alice");
    const notMatching = TestEntity.create("Bob");
    entityMapper.addAll([matching, notMatching]);

    const ds = createDataSource(TestEntity);
    tick();
    ds.filterFreetext.set("alic");
    TestBed.tick();

    expect(ds.filteredRecords()).toContain(matching);
    expect(ds.filteredRecords()).not.toContain(notMatching);
  }));

  // ---- External records mode ----

  it("should use externally provided records when no entityType is given", fakeAsync(() => {
    const e1 = TestEntity.create("A");
    const e2 = TestEntity.create("B");

    const ds = createDataSource();
    ds.allRecords.set([e1, e2]);
    tick();
    TestBed.tick();

    expect(ds.filteredRecords().length).toBe(2);
  }));

  // ---- Sorting ----

  it("should apply default sort from columns when connected", fakeAsync(() => {
    const b = TestEntity.create("B");
    const a = TestEntity.create("A");
    entityMapper.addAll([b, a]);

    const ds = createDataSource(TestEntity);
    tick();
    ds.connectColumns(
      signal(["name"]),
      signal([{ id: "name", dataType: "string" }]),
      signal(undefined),
    );
    TestBed.tick();

    const names = ds.sortedRows().map((r) => r.record.name);
    expect(names).toEqual(["A", "B"]);
  }));

  it("should apply external sort override", fakeAsync(() => {
    const b = TestEntity.create("B");
    const a = TestEntity.create("A");
    entityMapper.addAll([b, a]);

    const ds = createDataSource(TestEntity);
    tick();

    const externalSort = signal<
      { active: string; direction: "asc" | "desc" } | undefined
    >({ active: "name", direction: "desc" });
    ds.connectColumns(
      signal(["name"]),
      signal([{ id: "name", dataType: "string" }]),
      externalSort,
    );
    TestBed.tick();

    const names = ds.sortedRows().map((r) => r.record.name);
    expect(names).toEqual(["B", "A"]);
  }));

  // ---- connect() / disconnect() ----

  it("should emit rows via connect() observable", fakeAsync(() => {
    const e = TestEntity.create("A");
    entityMapper.add(e);

    const ds = createDataSource(TestEntity);
    tick();
    TestBed.tick();

    let emittedRows: any[] | undefined;
    const sub = ds.connect(null as any).subscribe((rows) => {
      emittedRows = rows;
    });

    TestBed.tick();
    expect(emittedRows?.length).toBe(1);
    expect(emittedRows?.[0].record).toBe(e);

    sub.unsubscribe();
    ds.disconnect(null as any);
  }));
});
