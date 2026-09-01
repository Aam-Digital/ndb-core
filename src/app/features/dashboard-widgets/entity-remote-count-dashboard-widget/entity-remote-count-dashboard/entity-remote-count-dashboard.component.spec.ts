import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";

import { EntityRemoteCountDashboardComponent } from "./entity-remote-count-dashboard.component";
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
import { FULL_LOAD_PAGE_SIZE } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";
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

  /** emulate the DB: return `countsById` matches for `{ category }`, paged via the bookmark */
  function mockCounts(countsById: Record<string, number>) {
    findTypeSpy.mockImplementation((async (
      _type: unknown,
      filter: { category?: string },
      page: { limit: number; bookmark?: string },
    ) => {
      const total = countsById[filter.category] ?? 0;
      const skip = Number(page?.bookmark) || 0;
      const take = Math.max(0, Math.min(total - skip, page.limit));
      return {
        records: Array.from(
          { length: take },
          (_, i) => new RemoteCountTest(`${filter.category}-${skip + i}`),
        ),
        bookmark: String(skip + take),
      };
    }) as any);
  }

  async function loadWidget() {
    fixture.detectChanges();
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

  it("requests an id-only, filtered count for each category option", async () => {
    mockCounts({ C1: 2, C2: 5, C3: 0 });

    await loadWidget();

    expect(findTypeSpy).toHaveBeenCalledWith(
      RemoteCountTest,
      { category: "C1" },
      { limit: FULL_LOAD_PAGE_SIZE, bookmark: undefined },
      undefined,
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
    ]);
    expect(component.totalCount()).toBe(7);
  });

  it("pages through every match (like getAllData) to count more than one batch", async () => {
    mockCounts({ C1: FULL_LOAD_PAGE_SIZE + 3, C2: 0, C3: 0 });

    await loadWidget();

    const c1Calls = findTypeSpy.mock.calls.filter(
      ([, filter]) => (filter as { category?: string }).category === "C1",
    );
    expect(c1Calls).toHaveLength(2);
    // the second request continues from the bookmark of the first
    expect(c1Calls[1][2]).toEqual({
      limit: FULL_LOAD_PAGE_SIZE,
      bookmark: String(FULL_LOAD_PAGE_SIZE),
    });
    expect(component.entries().find((row) => row.id === "C1").value).toBe(
      FULL_LOAD_PAGE_SIZE + 3,
    );
  });

  it("shows a loading state until all counts have been calculated", () => {
    mockCounts({ C1: 1, C2: 1, C3: 1 });
    expect(component.entries()).toBeUndefined();
    expect(component.totalCount()).toBeUndefined();
  });

  it("url-encodes the option id when navigating to the filtered list", async () => {
    mockCounts({ C1: 1, C2: 0, C3: 0 });
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
