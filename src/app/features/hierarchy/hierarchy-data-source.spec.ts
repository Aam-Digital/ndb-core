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
  let urlParam: string | null;

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
    const decorations = dataSource.rowDecorations();
    return dataSource
      .filteredRecords()
      .filter((r) => decorations.get(r.getId())?.selectable !== false)
      .map((r) => r.title);
  }

  beforeEach(() => {
    urlParam = null;
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState(LoginState.LOGGED_IN, plan())],
    });
    entityMapper = TestBed.inject(EntityMapperService);
    urlState = TestBed.inject(UrlStateService);
    vi.spyOn(urlState, "getUrlParam").mockImplementation((key) =>
      key === HIERARCHY_URL_PARAM ? urlParam : null,
    );
    vi.spyOn(urlState, "updateUrlParams").mockImplementation(() => undefined);
  });

  it("shows sub-records below their parents, with the first field and without pages", async () => {
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

  it("decorates rows with CSS classes of their place in the tree, context rows as not selectable", async () => {
    await createDataSource();
    dataSource.dataFilter.set({ responsible: "Asha" });
    await settle();

    const decoration = (title: string) =>
      dataSource.rowDecorations().get(`HierarchyTestAction:${title}`);
    const classes = (title: string) =>
      decoration(title)?.cssClass?.split(" ").sort() ?? [];
    expect(classes("Clean Water")).toEqual(
      [CONTEXT_ROW_CLASS, TOP_ROW_CLASS, PARENT_ROW_CLASS].sort(),
    );
    expect(classes("Mobilisation")).toEqual([PARENT_ROW_CLASS]);
    expect(classes("Meetings")).toEqual(
      [CONTEXT_ROW_CLASS, PARENT_ROW_CLASS].sort(),
    );
    expect(classes("Sonpur")).toEqual([]);
    expect(decoration("Meetings")?.selectable).toBe(false);
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

  it("hides the sub-records of collapsed rows from the table and from select all, until a filter changes", async () => {
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
    expect(selectableIds()).not.toContain("Rampur");
    // the number of hidden sub-records follows the title of the collapsed row only
    const suffix = (title: string) =>
      dataSource.rowDecorations().get(`HierarchyTestAction:${title}`)?.suffix
        ?.component;
    expect(suffix("Mobilisation")).toBe("HierarchyChildCount");
    expect(suffix("Clean Water")).toBeUndefined();

    dataSource.collapseAll();
    await settle();
    expect(displayedRows()).toEqual(["Clean Water +2", "Garden", "Loop"]);
    expect(dataSource.anyExpanded()).toBe(false);

    dataSource.searchText.set("w");
    await settle();
    expect(displayedRows()).toContain("-Well");
  });

  it("switches to another field or a flat list with pages, kept in the URL", async () => {
    await createDataSource();

    dataSource.selectField("dependsOn");
    await settle();
    expect(displayedRows()).toEqual(
      expect.arrayContaining(["Survey", "-Well in Rampur"]),
    );
    expect(urlState.updateUrlParams).toHaveBeenLastCalledWith(
      { [HIERARCHY_URL_PARAM]: "dependsOn" },
      false,
    );

    dataSource.selectField(undefined);
    await settle();
    expect(dataSource.usesPagination()).toBe(true);
    expect(dataSource.rowDecorations().size).toBe(0);
    expect(displayedRows()[0]).toBe("Clean Water");
    expect(urlState.updateUrlParams).toHaveBeenLastCalledWith(
      { [HIERARCHY_URL_PARAM]: NO_HIERARCHY },
      false,
    );

    dataSource.selectField("parent");
    expect(urlState.updateUrlParams).toHaveBeenLastCalledWith(
      { [HIERARCHY_URL_PARAM]: null },
      false,
    );
  });

  it.each([
    [NO_HIERARCHY, undefined],
    ["dependsOn", "dependsOn"],
    ["unknown", "parent"],
  ])("starts with the choice %s from the URL as %s", async (param, field) => {
    urlParam = param;
    await createDataSource();

    expect(dataSource.activeField()).toBe(field);
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

  it("moves a record together with its sub-records and expands the parents of a new record", async () => {
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

    dataSource.collapseAll();
    await entityMapper.save(action("Sonpur 2", { parent: "Meetings" }));
    await settle();
    expect(displayedRows()).toEqual(
      expect.arrayContaining(["-Well", "--Meetings", "---Sonpur 2"]),
    );
  });

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
      dataSource.dataFilter.set(
        restrictToNotArchived({ parent: root.getId() } as DataFilter<Action>),
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
