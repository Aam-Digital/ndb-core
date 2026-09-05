import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";

import {
  EntityRemoteCountDashboardComponent,
  REMOTE_COUNT_BATCH_SIZE,
} from "./entity-remote-count-dashboard.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { ConfigurableEnum } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum";
import { ConfigurableEnumService } from "#src/app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { getEntityRuntimeRoute } from "#src/app/core/entity/entity-config.service";

@DatabaseEntity("RemoteCountTest")
class RemoteCountTest extends Entity {}
RemoteCountTest.schema.set("category", {
  dataType: "configurable-enum",
  additional: "remote-count-category",
  label: "Category",
});

describe("EntityRemoteCountDashboardComponent", () => {
  let component: EntityRemoteCountDashboardComponent;
  let fixture: ComponentFixture<EntityRemoteCountDashboardComponent>;
  let entityMapper: MockEntityMapperService;
  let findTypeSpy: ReturnType<typeof vi.spyOn>;

  const c1 = { id: "C1", label: "Cat One", color: "#111111" };
  const c2 = { id: "C2", label: "Cat Two" };
  const c3 = { id: "C3", label: "Cat Three" };

  /**
   * emulate the DB, resolving the different queries the widget issues:
   * - `{ category: "<id>" }`      -> `byOption[id]`
   * - `{ category: { $gt: "" } }` -> `withValue` (defaults to the sum of byOption)
   * - `{}`                        -> `total` (defaults to `withValue`)
   * paged via the bookmark, so the batch loop is exercised.
   */
  function mockCounts(opts: {
    byOption?: Record<string, number>;
    withValue?: number;
    total?: number;
  }) {
    const byOption = opts.byOption ?? {};
    const sumByOption = Object.values(byOption).reduce((a, b) => a + b, 0);
    const withValue = opts.withValue ?? sumByOption;
    const total = opts.total ?? withValue;

    findTypeSpy.mockImplementation((async (
      _type: unknown,
      filter: { category?: unknown },
      page: { limit: number; bookmark?: string },
    ) => {
      let matches: number;
      if (!filter || Object.keys(filter).length === 0) {
        matches = total;
      } else if (typeof filter.category === "string") {
        matches = byOption[filter.category] ?? 0;
      } else {
        matches = withValue; // { category: { $gt: "" } }
      }

      const skip = Number(page?.bookmark) || 0;
      const take = Math.max(0, Math.min(matches - skip, page.limit));
      return {
        records: new Array(take),
        bookmark: String(skip + take),
      };
    }) as any);
  }

  async function loadWidget() {
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityRemoteCountDashboardComponent,
        MockedTestingModule.withState(),
      ],
      providers: [...mockEntityMapperProvider()],
    }).compileComponents();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    // instantiate the service first, so it caches the enum added right after
    TestBed.inject(ConfigurableEnumService);
    entityMapper.add(
      new ConfigurableEnum("remote-count-category", [c1, c2, c3]),
    );

    findTypeSpy = vi.spyOn(entityMapper, "findType");

    fixture = TestBed.createComponent(EntityRemoteCountDashboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityType", "RemoteCountTest");
    fixture.componentRef.setInput("groupBy", "category");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("requests an id-only count per option, sorted by the field so the query can use an index", async () => {
    mockCounts({ byOption: { C1: 2, C2: 5, C3: 0 } });

    await loadWidget();

    expect(findTypeSpy).toHaveBeenCalledWith(
      RemoteCountTest,
      { category: "C1" },
      { limit: REMOTE_COUNT_BATCH_SIZE, bookmark: undefined },
      { prop: "category", dir: "asc" },
      { idOnly: true },
    );

    expect(component.entries()).toEqual([
      {
        label: "Cat One",
        id: "C1",
        value: 2,
        fieldName: "category",
        color: "#111111",
        entity: expect.any(RemoteCountTest),
      },
      {
        label: "Cat Two",
        id: "C2",
        value: 5,
        fieldName: "category",
        entity: expect.any(RemoteCountTest),
      },
      {
        label: "Cat Three",
        id: "C3",
        value: 0,
        fieldName: "category",
        entity: expect.any(RemoteCountTest),
      },
      // aggregate rows: no value set, and value not matching an option
      { label: undefined, id: "", value: 0, fieldName: "category" },
      { label: undefined, id: "__invalid__", value: 0, isInvalidOption: true },
    ]);
    expect(component.totalCount()).toBe(7);
  });

  it("reports aggregate rows for values not in the enum and for records with no value", async () => {
    // valid = 5, withValue = 8 -> invalid = 3; total = 12 -> not set = 4
    mockCounts({ byOption: { C1: 2, C2: 3, C3: 0 }, withValue: 8, total: 12 });

    await loadWidget();

    const rows = component.entries();
    expect(rows.slice(-2)).toEqual([
      { label: undefined, id: "", value: 4, fieldName: "category" },
      {
        label: undefined,
        id: "__invalid__",
        value: 3,
        isInvalidOption: true,
      },
    ]);
    expect(component.totalCount()).toBe(12);

    // the type-wide total is counted without a field sort ...
    expect(findTypeSpy).toHaveBeenCalledWith(
      RemoteCountTest,
      {},
      { limit: REMOTE_COUNT_BATCH_SIZE, bookmark: undefined },
      undefined,
      { idOnly: true },
    );
    // ... while "has any value" is a sorted range query on the field
    expect(findTypeSpy).toHaveBeenCalledWith(
      RemoteCountTest,
      { category: { $gt: "" } },
      { limit: REMOTE_COUNT_BATCH_SIZE, bookmark: undefined },
      { prop: "category", dir: "asc" },
      { idOnly: true },
    );
  });

  it("keeps both aggregate rows (at zero) when every value matches a known option", async () => {
    mockCounts({ byOption: { C1: 1, C2: 1, C3: 0 }, total: 5 });

    await loadWidget();

    // withValue defaults to the sum (2) -> invalid 0; total 5 -> not set 3
    expect(component.entries().slice(-2)).toEqual([
      { label: undefined, id: "", value: 3, fieldName: "category" },
      { label: undefined, id: "__invalid__", value: 0, isInvalidOption: true },
    ]);
  });

  it("pages through every match (like getAllData) to count more than one batch", async () => {
    mockCounts({ byOption: { C1: REMOTE_COUNT_BATCH_SIZE + 3, C2: 0, C3: 0 } });

    await loadWidget();

    const c1Calls = findTypeSpy.mock.calls.filter(
      ([, filter]) => (filter as { category?: string }).category === "C1",
    );
    expect(c1Calls).toHaveLength(2);
    // the second request continues from the bookmark of the first
    expect(c1Calls[1][2]).toEqual({
      limit: REMOTE_COUNT_BATCH_SIZE,
      bookmark: String(REMOTE_COUNT_BATCH_SIZE),
    });
    expect(component.entries().find((row) => row.id === "C1").value).toBe(
      REMOTE_COUNT_BATCH_SIZE + 3,
    );
  });

  it("shows a loading state until all counts have been calculated", () => {
    mockCounts({ byOption: { C1: 1, C2: 1, C3: 1 } });
    expect(component.entries()).toBeUndefined();
    expect(component.totalCount()).toBeUndefined();
  });

  it("url-encodes the option id when navigating to the filtered list", async () => {
    mockCounts({ byOption: { C1: 1, C2: 0, C3: 0 } });
    await loadWidget();
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    component.goToEntityList("a,b");

    expect(navigateSpy).toHaveBeenCalledWith(
      [getEntityRuntimeRoute(component.entityDefinition())],
      { queryParams: { category: encodeURIComponent("a,b") } },
    );
  });

  it("does not count fields that are not a configurable-enum", async () => {
    RemoteCountTest.schema.set("plainField", { label: "Plain" });
    fixture.componentRef.setInput("groupBy", "plainField");
    mockCounts({});

    await loadWidget();

    expect(component.entries()).toEqual([]);
    expect(findTypeSpy).not.toHaveBeenCalled();
    RemoteCountTest.schema.delete("plainField");
  });
});
