import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatSort } from "@angular/material/sort";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { restrictToNotArchived } from "#src/app/core/filter/not-archived-filter";
import { Logging } from "#src/app/core/logging/logging.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { BulkOperationStateService } from "#src/app/core/entity/entity-actions/bulk-operation-state.service";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";
import { UrlStateService } from "#src/app/utils/url-state/url-state.service";
import { LoadRecordConfig } from "#src/app/core/common-components/entities-table/data-source/entities-table-data-source";
import { DataSourceRegistry } from "#src/app/core/common-components/entities-table/data-source/data-source-registry";
import { RelatedEntitiesComponent } from "#src/app/core/entity-details/related-entities/related-entities.component";
import {
  CONTEXT_ROW_CLASS,
  HIERARCHY_URL_PARAM,
  HierarchyDataSource,
  NO_HIERARCHY,
  PARENT_ROW_CLASS,
  TOP_ROW_CLASS,
} from "./hierarchy-data-source";

@DatabaseEntity("HierarchyTestAction")
class Action extends Entity {
  @DatabaseField({ label: "Title" }) title: string;
  @DatabaseField({
    label: "Parent action",
    dataType: "entity",
    additional: "HierarchyTestAction",
  })
  parent: string;
  @DatabaseField({
    label: "Depends on",
    dataType: "entity",
    additional: "HierarchyTestAction",
  })
  dependsOn: string;
  @DatabaseField({ label: "Responsible" }) responsible: string;
  @DatabaseField({
    label: "Blocks",
    dataType: "entity",
    additional: "HierarchyTestAction",
    isArray: true,
  })
  blocks: string[];
}

function action(
  title: string,
  props: { parent?: string; dependsOn?: string } & Partial<Action> = {},
): Action {
  const id = (name?: string) => name && `HierarchyTestAction:${name}`;
  return Object.assign(new Action(title), {
    ...props,
    title,
    parent: id(props.parent),
    dependsOn: id(props.dependsOn),
  });
}

// Clean Water
//  ├ Mobilisation (Asha)
//  │  ├ Meetings (Ravi)
//  │  │  ├ Rampur
//  │  │  └ Sonpur (Asha)
//  │  └ Training
//  └ Well (Ravi, archived)
//     ├ Survey
//     └ Well in Rampur (depends on: Survey)
// Garden
// Loop (its own parent)
const plan = () => [
  action("Clean Water"),
  action("Mobilisation", { parent: "Clean Water", responsible: "Asha" }),
  action("Meetings", { parent: "Mobilisation", responsible: "Ravi" }),
  action("Rampur", { parent: "Meetings" }),
  action("Sonpur", { parent: "Meetings", responsible: "Asha" }),
  action("Training", { parent: "Mobilisation" }),
  action("Well", {
    parent: "Clean Water",
    responsible: "Ravi",
    inactive: true,
  }),
  action("Survey", { parent: "Well" }),
  action("Well in Rampur", { parent: "Well", dependsOn: "Survey" }),
  action("Garden"),
  action("Loop", { parent: "Loop" }),
];

describe("HierarchyDataSource", () => {
  let dataSource: HierarchyDataSource<Action>;
  let entityMapper: EntityMapperService;
  let urlState: UrlStateService;
  /** the hierarchy param in the URL, a signal to simulate the browser's Back and Forward */
  const urlParam = signal<string | null>(null);

  async function createDataSource(
    config: object = { hierarchyFields: ["parent", "dependsOn"] },
    loadRecordConfig: Partial<LoadRecordConfig<Action>> = {},
  ) {
    dataSource = TestBed.runInInjectionContext(
      () => new HierarchyDataSource<Action>(),
    );
    dataSource.config.set(config as Record<string, unknown>);
    dataSource.loadRecordConfig.set({ entityCtr: Action, ...loadRecordConfig });
    const sort = TestBed.runInInjectionContext(() => new MatSort());
    sort.active = "title";
    sort.direction = "asc";
    sort.ngOnInit(); // marks the sort as initialized, as the table does
    dataSource.sort = sort;
    dataSource.effectiveSort.set({ active: "title", direction: "asc" });
    await settle();
  }

  async function settle() {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  /** the rendered rows: indentation by level, "(title)" for context rows, "title +n" for a collapsed row */
  function displayedRows(): string[] {
    return dataSource.renderedRows().map((record) => {
      const row = dataSource.rows().get(record.getId());
      if (!row) {
        return record.title;
      }
      const title = row.isContext ? `(${record.title})` : record.title;
      const collapsed = row.isCollapsed ? ` +${row.childCount}` : "";
      return "-".repeat(row.level) + title + collapsed;
    });
  }

  function selectableIds(): string[] {
    return dataSource
      .filteredRecords()
      .filter((r) => dataSource.rowOptionsOf(r)?.selectable !== false)
      .map((r) => r.title);
  }

  /** the records "select all" selects */
  function selectAllIds(): string[] {
    return dataSource
      .filteredRecords()
      .filter((r) => {
        const options = dataSource.rowOptionsOf(r);
        return options?.selectable !== false && options?.inSelectAll !== false;
      })
      .map((r) => r.title);
  }

  beforeEach(() => {
    urlParam.set(null);
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState(LoginState.LOGGED_IN, plan())],
    });
    entityMapper = TestBed.inject(EntityMapperService);
    urlState = TestBed.inject(UrlStateService);
    vi.spyOn(urlState, "watchUrlParam").mockImplementation((key) =>
      key === HIERARCHY_URL_PARAM ? urlParam : signal(null),
    );
    vi.spyOn(urlState, "updateUrlParams").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("shows all sub-records below their parents on one page, by the first configured field", async () => {
    await createDataSource();

    expect(displayedRows()).toEqual([
      "Clean Water",
      "-Mobilisation",
      "--Meetings",
      "---Rampur",
      "---Sonpur",
      "--Training",
      "-Well",
      "--Survey",
      "--Well in Rampur",
      "Garden",
      "Loop",
    ]);
    expect(dataSource.activeField()).toBe("parent");
    expect(dataSource.usesPagination()).toBe(false);
  });

  it.each<{
    scenario: string;
    filter?: DataFilter<Action>;
    search?: string;
    expected: string[];
  }>([
    {
      scenario: "a filter",
      filter: { responsible: "Asha" },
      expected: ["(Clean Water)", "-Mobilisation", "--(Meetings)", "---Sonpur"],
    },
    {
      scenario: "the search text",
      search: "rampur",
      expected: [
        "(Clean Water)",
        "-(Mobilisation)",
        "--(Meetings)",
        "---Rampur",
        "-(Well)",
        "--Well in Rampur",
      ],
    },
    {
      scenario: "the default filter that hides archived records",
      expected: [
        "Clean Water",
        "-Mobilisation",
        "--Meetings",
        "---Rampur",
        "---Sonpur",
        "--Training",
        "-(Well)",
        "--Survey",
        "--Well in Rampur",
        "Garden",
        "Loop",
      ],
    },
  ])(
    "shows the parents of records matching $scenario greyed, without selecting or downloading them",
    async ({ filter, search, expected }) => {
      await createDataSource();
      // the archived record is not shown with "include archived records" off
      dataSource.dataFilter.set(
        filter ? { ...filter } : restrictToNotArchived({}),
      );
      dataSource.searchText.set(search ?? "");
      await settle();

      expect(displayedRows()).toEqual(expected);
      const matches = expected
        .filter((row) => !row.includes("("))
        .map((row) => row.replace(/^-*/, ""));
      expect(selectableIds()).toEqual(expect.arrayContaining(matches));
      expect(selectableIds()).toHaveLength(matches.length);
      expect(
        (await dataSource.getAllData(true)).map((r) => r.title).sort(),
      ).toEqual(matches.sort());
    },
  );

  it("decorates rows with CSS classes of their place in the tree", async () => {
    await createDataSource();
    dataSource.dataFilter.set({ responsible: "Asha" });
    await settle();

    const classes = (title: string) =>
      dataSource.rowOptionsOf(new Action(title))?.cssClass?.split(" ").sort() ??
      [];
    expect(classes("Clean Water")).toEqual(
      [CONTEXT_ROW_CLASS, TOP_ROW_CLASS, PARENT_ROW_CLASS].sort(),
    );
    expect(classes("Mobilisation")).toEqual([PARENT_ROW_CLASS]);
    expect(classes("Meetings")).toEqual(
      [CONTEXT_ROW_CLASS, PARENT_ROW_CLASS].sort(),
    );
    expect(classes("Sonpur")).toEqual([]);
  });

  it("sorts each level on its own", async () => {
    await createDataSource();
    // as the table does when the user sorts by a column
    dataSource.sort.direction = "desc";
    dataSource.sort.sortChange.emit({ active: "title", direction: "desc" });
    dataSource.effectiveSort.set({ active: "title", direction: "desc" });
    await settle();

    expect(displayedRows()).toEqual([
      "Loop",
      "Garden",
      "Clean Water",
      "-Well",
      "--Well in Rampur",
      "--Survey",
      "-Mobilisation",
      "--Training",
      "--Meetings",
      "---Sonpur",
      "---Rampur",
    ]);
  });

  it("hides the sub-records of a collapsed row from select all, but keeps them selectable", async () => {
    await createDataSource();

    dataSource.toggleCollapsed("HierarchyTestAction:Mobilisation");
    await settle();

    expect(displayedRows()).toEqual([
      "Clean Water",
      "-Mobilisation +2",
      "-Well",
      "--Survey",
      "--Well in Rampur",
      "Garden",
      "Loop",
    ]);
    expect(selectAllIds()).not.toContain("Rampur");
    // a selection made before collapsing the row stays
    expect(selectableIds()).toContain("Rampur");
  });

  it("offers to expand all once no visible row is expanded, also with sub-records hidden under a collapsed row", async () => {
    await createDataSource();

    dataSource.toggleCollapsed("HierarchyTestAction:Clean Water");
    await settle();

    expect(dataSource.anyExpanded()).toBe(false);
  });

  it("has sub-records only while a shown record has some", async () => {
    await createDataSource();
    expect(dataSource.hasSubRecords()).toBe(true);

    dataSource.searchText.set("Garden");
    await settle();

    expect(dataSource.hasSubRecords()).toBe(false);
  });

  it("shows the number of hidden sub-records after the title of a collapsed row only", async () => {
    await createDataSource();

    dataSource.toggleCollapsed("HierarchyTestAction:Mobilisation");
    await settle();

    const suffix = (title: string) =>
      dataSource.rowOptionsOf(new Action(title))?.suffix?.component;
    expect(suffix("Mobilisation")).toBe("HierarchyChildCount");
    expect(suffix("Clean Water")).toBeUndefined();
  });

  it("expands all rows again when the filters change", async () => {
    await createDataSource();
    dataSource.collapseAll();
    await settle();
    expect(displayedRows()).toEqual(["Clean Water +2", "Garden", "Loop"]);
    expect(dataSource.anyExpanded()).toBe(false);

    dataSource.searchText.set("w");
    await settle();

    expect(displayedRows()).toContain("-Well");
  });

  it("arranges the records by the field the user chooses", async () => {
    await createDataSource();

    dataSource.selectField("dependsOn");
    await settle();

    expect(displayedRows()).toEqual(
      expect.arrayContaining(["Survey", "-Well in Rampur"]),
    );
  });

  it("shows another field fully expanded", async () => {
    await createDataSource();
    dataSource.collapseAll();
    await settle();

    dataSource.selectField("dependsOn");
    await settle();

    expect(dataSource.collapsedIds().size).toBe(0);
  });

  it("shows a flat list with pages if the user chooses no field", async () => {
    await createDataSource();

    dataSource.selectField(undefined);
    await settle();

    expect(dataSource.usesPagination()).toBe(true);
    const options = dataSource
      .filteredRecords()
      .map((r) => dataSource.rowOptionsOf(r));
    expect(options.filter(Boolean)).toEqual([]);
    expect(displayedRows()[0]).toBe("Clean Water");
  });

  it.each([
    ["dependsOn", "dependsOn"],
    [undefined, NO_HIERARCHY],
    ["parent", null],
  ])("keeps the choice %s in the URL as %s", async (field, param) => {
    await createDataSource();

    dataSource.selectField(field);

    expect(urlState.updateUrlParams).toHaveBeenLastCalledWith(
      { [HIERARCHY_URL_PARAM]: param },
      false,
    );
  });

  it.each([
    [NO_HIERARCHY, undefined],
    ["dependsOn", "dependsOn"],
    ["unknown", "parent"],
    // a field could have the id "none"
    ["none", "parent"],
  ])("starts with the choice %s from the URL as %s", async (param, field) => {
    urlParam.set(param);
    await createDataSource();

    expect(dataSource.activeField()).toBe(field);
  });

  it("follows the choice in the URL when the user goes back or forward in the browser history", async () => {
    await createDataSource();

    urlParam.set("dependsOn");
    await settle();
    expect(dataSource.activeField()).toBe("dependsOn");

    urlParam.set(null);
    await settle();
    expect(dataSource.activeField()).toBe("parent");
  });

  it("does not fail before the table has set which records to load", () => {
    dataSource = TestBed.runInInjectionContext(
      () => new HierarchyDataSource<Action>(),
    );

    expect(dataSource.rootRecord()).toBeUndefined();
    expect(dataSource.usesPagination()).toBe(true);
  });

  it("works as a flat list, without reporting a problem, if no configured field can be a hierarchy", async () => {
    const warn = vi.spyOn(Logging, "warn");
    const error = vi.spyOn(Logging, "error");
    await createDataSource({
      hierarchyFields: ["responsible", "blocks", "missing"],
    });

    expect(dataSource.activeField()).toBeUndefined();
    expect(dataSource.usesPagination()).toBe(true);
    expect(dataSource.toolbarControls().map((c) => c.component)).toEqual([
      "FreeTextFilter",
    ]);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("moves a record together with its sub-records", async () => {
    await createDataSource();
    const training = await entityMapper.load(Action, "Training");
    await entityMapper.save(Object.assign(training, { parent: undefined }));
    const meetings = await entityMapper.load(Action, "Meetings");
    await entityMapper.save(
      Object.assign(meetings, { parent: "HierarchyTestAction:Well" }),
    );
    await settle();

    expect(displayedRows()).toEqual([
      "Clean Water",
      "-Mobilisation",
      "-Well",
      "--Meetings",
      "---Rampur",
      "---Sonpur",
      "--Survey",
      "--Well in Rampur",
      "Garden",
      "Loop",
      "Training",
    ]);
  });

  it.each<{ change: string; moved: string; apply: () => Promise<unknown> }>([
    {
      change: "a new record",
      moved: "Orchard",
      apply: () => entityMapper.save(action("Orchard", { parent: "Meetings" })),
    },
    {
      change: "a form that edited the object held by the list",
      moved: "Garden",
      apply: () => {
        const garden = dataSource
          .allRecords()
          .find((record) => record.title === "Garden")!;
        garden.parent = "HierarchyTestAction:Meetings";
        return entityMapper.save(garden);
      },
    },
    {
      change: "a bulk operation (reloading the list)",
      moved: "Garden",
      apply: async () => {
        vi.spyOn(
          TestBed.inject(ConfirmationDialogService),
          "showProgressDialog",
        ).mockReturnValue(mockMatDialogRef() as never);
        TestBed.inject(BulkOperationStateService).startBulkOperation(2);
        const garden = await entityMapper.load(Action, "Garden");
        const loop = await entityMapper.load(Action, "Loop");
        await entityMapper.saveAll([
          Object.assign(garden, { parent: "HierarchyTestAction:Meetings" }),
          Object.assign(loop, { parent: "HierarchyTestAction:Meetings" }),
        ]);
      },
    },
  ])(
    "expands the parents of a record that $change puts below a collapsed row",
    async ({ moved, apply }) => {
      await createDataSource();
      dataSource.collapseAll();
      await settle();

      await apply();
      await settle();

      expect(displayedRows()).toEqual(
        expect.arrayContaining(["-Mobilisation", "--Meetings", `---${moved}`]),
      );
    },
  );

  describe("in a related-entities section of a record of the same type", () => {
    beforeEach(() => {
      TestBed.inject(DataSourceRegistry).add(
        HierarchyDataSource.DATA_SOURCE_NAME,
        HierarchyDataSource,
      );
    });

    it("shows the whole branch below the record, by the relation property", async () => {
      const root = await entityMapper.load(Action, "Mobilisation");
      await createDataSource(
        {},
        { forEntity: root, relationProperty: "parent" },
      );
      // as set by the section: only the direct sub-records are linked to the record
      const section = TestBed.createComponent(RelatedEntitiesComponent<Action>);
      section.componentRef.setInput("entity", root);
      section.componentRef.setInput("entityType", "HierarchyTestAction");
      section.componentRef.setInput("property", "parent");
      section.detectChanges();
      dataSource.dataFilter.set(
        restrictToNotArchived(section.componentInstance.filterObj()),
      );
      await settle();

      expect(displayedRows()).toEqual([
        "Meetings",
        "-Rampur",
        "-Sonpur",
        "Training",
      ]);
      expect(dataSource.toolbarControls()).toHaveLength(1);
      expect(
        (await dataSource.getAllData(true)).map((r) => r.title).sort(),
      ).toEqual(["Meetings", "Rampur", "Sonpur", "Training"]);
    });

    it("fills in only the relation property of a new record", async () => {
      const root = await entityMapper.load(Action, "Mobilisation");
      const fixture = TestBed.createComponent(RelatedEntitiesComponent<Action>);
      fixture.componentRef.setInput("entity", root);
      fixture.componentRef.setInput("entityType", "HierarchyTestAction");
      fixture.componentRef.setInput("property", "parent");
      fixture.componentRef.setInput(
        "dataSource",
        HierarchyDataSource.DATA_SOURCE_NAME,
      );
      fixture.detectChanges();
      await fixture.whenStable();

      const component = fixture.componentInstance;
      expect(component.recordsDataSource()).toBeInstanceOf(HierarchyDataSource);
      const newRecord = component.createNewRecordFactory()();
      expect(newRecord.parent).toBe(root.getId());
      expect(newRecord.dependsOn).toBeUndefined();
    });
  });
});
