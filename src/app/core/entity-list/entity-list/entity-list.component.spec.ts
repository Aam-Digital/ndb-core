import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { BooleanFilterConfig, EntityListConfig } from "../EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { PublicFormsService } from "#src/app/features/public-form/public-forms.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { FeaturePermissionDialogComponent } from "../../permissions/feature-permission/feature-permission-dialog/feature-permission-dialog.component";
import { environment } from "#src/environments/environment";
import { SessionType } from "#src/app/core/session/session-type";
import { PaginatedDataSource } from "#src/app/core/common-components/entities-table/data-source/paginated-data-source";
import { DatabaseResolverService } from "#src/app/core/database/database-resolver.service";
import { Database } from "#src/app/core/database/database";
import { ScreenWidthObserver } from "#src/app/utils/media/screen-size-observer.service";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;

  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [{ viewComponent: "DisplayText", label: "Age", id: "age" }],
    columnGroups: {
      groups: [
        {
          name: "Basic Info",
          columns: ["name", "age", "category"],
        },
        {
          name: "School Info",
          columns: ["name", "age", "other"],
        },
      ],
    },
    filters: [
      {
        id: "inactive",
        type: "boolean",
        default: "false",
        true: "Archived children",
        false: "Currently active children",
      } as BooleanFilterConfig,
      {
        id: "category",
      },
    ],
  };
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let routeData: Subject<DynamicComponentConfig<EntityListConfig>>;

  beforeEach(waitForAsync(() => {
    routeData = new Subject<DynamicComponentConfig<EntityListConfig>>();
    mockActivatedRoute = {
      component: undefined,
      queryParams: new Subject(),
      data: routeData,
      snapshot: { queryParams: {}, queryParamMap: new Map() } as any,
    };

    TestBed.configureTestingModule({
      imports: [EntityListComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: PublicFormsService,
          useValue: {
            getAllPublicFormConfigs: vi.fn().mockResolvedValue([]),
            copyPublicFormLinkFromConfig: vi.fn(),
            initCustomFormActions: vi.fn(),
          },
        },
        {
          provide: FormDialogService,
          useValue: {
            openFormPopup: vi.fn(),
            openView: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }));

  it("should create", () => {
    createComponent();
    initComponentInputs();
    expect(component).toBeTruthy();
  });

  it("should resolve public form titles for the active language", async () => {
    vi.spyOn(
      TestBed.inject(PublicFormsService),
      "getAllPublicFormConfigs",
    ).mockResolvedValue([
      {
        route: "register",
        entity: TestEntity.ENTITY_TYPE,
        title: { "en-US": "Register", de: "Anmelden" },
      },
      { route: "other", entity: "SomeOtherType", title: "Other" },
    ] as any);

    createComponent();
    initComponentInputs();
    await fixture.whenStable();

    // tests run in the default language
    expect(component.publicForms.map((f) => f.title)).toEqual(["Register"]);
    expect(component.publicForms[0].config.route).toBe("register");
  });

  it("should not fail if the configured title is not a string", () => {
    createComponent();
    initComponentInputs();
    component.title.set(123 as any);

    expect(() => fixture.detectChanges()).not.toThrow();
    // @ts-ignore
    expect(component.addNewAnalyticsAction()).toBe("123_add_new");
  });

  it("should create columns from config", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);
      expect(component.columns()).toEqual([...testConfig.columns]);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    {
      screen: "desktop",
      rule: "the first group",
      groupColumns: [["name", "other", "category"], ["name"]],
      expectedGroup: 0,
    },
    {
      screen: "mobile",
      rule: "the first of several groups with the fewest columns",
      groupColumns: [["name", "other", "category"], ["name"], ["other"]],
      expectedGroup: 1,
    },
    {
      screen: "mobile",
      rule: "the group with the fewest columns",
      groupColumns: [["name", "other"], ["name", "category"], ["name"]],
      expectedGroup: 2,
    },
    {
      screen: "mobile",
      rule: "the first group if it shares the fewest columns",
      groupColumns: [["name"], ["other"], ["name", "other", "category"]],
      expectedGroup: 0,
    },
  ])(
    "initially selects $rule on $screen and offers all groups as tabs",
    async ({ screen, groupColumns, expectedGroup }) => {
      const isDesktop = screen === "desktop";
      TestBed.overrideProvider(ScreenWidthObserver, {
        useValue: { isDesktop: () => isDesktop, platform: () => of(isDesktop) },
      });
      const groups = groupColumns.map((columns, i) => ({
        name: `Group ${i}`,
        columns,
      }));

      vi.useFakeTimers();
      try {
        createComponent();
        fixture.componentRef.setInput("columnGroups", { groups });
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.columnsToDisplay).toEqual(
          groups[expectedGroup].columns,
        );
        // users can switch to the other groups on any screen size
        expect(
          fixture.nativeElement.querySelectorAll('[role="tab"]'),
        ).toHaveLength(groups.length);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("should set the clicked column group", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      // Test only works in desktop mode
      component.isDesktop = true;
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);
      expect(component.selectedColumnGroupIndex).toBe(0);

      const clickedColumnGroup = testConfig.columnGroups.groups[1];

      // Simulate selecting the second tab group and verify table columns update.
      component.selectedColumnGroupIndex = 1;

      expect(component.selectedColumnGroupIndex).toEqual(1);
      expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should allow to use entity fields which are only mentioned in the columnGroups", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);

      class Test extends Entity {
        @DatabaseField({ label: "Test Property" })
        testProperty: string;
      }

      fixture.componentRef.setInput("entityConstructor", Test);
      fixture.componentRef.setInput("columns", [
        {
          id: "anotherColumn",
          label: "Predefined Title",
          viewComponent: "DisplayDate",
        },
      ]);
      fixture.componentRef.setInput("columnGroups", {
        groups: [{ name: "Both", columns: ["testProperty", "anotherColumn"] }],
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.columnsToDisplay).toEqual([
        "testProperty",
        "anotherColumn",
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not navigate on addNew if clickMode is not 'navigate'", () => {
    createComponent();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");

    fixture.componentRef.setInput("clickMode", "popup");
    component.addNew();
    expect(navigateSpy).not.toHaveBeenCalled();

    navigateSpy.mockClear();
    fixture.componentRef.setInput("clickMode", "navigate");
    component.addNew();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("should add a new entity that was created after the initial loading to the table", async () => {
    vi.useFakeTimers();
    try {
      const entityUpdates = new Subject<UpdatedEntity<Entity>>();
      const entityMapper = TestBed.inject(EntityMapperService);
      vi.spyOn(entityMapper, "receiveUpdates").mockReturnValue(entityUpdates);
      createComponent();
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);

      const entity = new TestEntity();
      entityUpdates.next({ entity: entity, type: "new" });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.recordsDataSource().allRecords()).toEqual([entity]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should remove an entity from the table when it has been deleted", async () => {
    vi.useFakeTimers();
    try {
      const entityUpdates = new Subject<UpdatedEntity<Entity>>();
      const entityMapper = TestBed.inject(EntityMapperService);
      vi.spyOn(entityMapper, "receiveUpdates").mockReturnValue(entityUpdates);
      const entity = new TestEntity();
      createComponent();
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);

      component.recordsDataSource().allRecords.set([entity]);
      entityUpdates.next({ entity: entity, type: "remove" });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.recordsDataSource().allRecords()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should offer permission configuration only for internal entity types", () => {
    createComponent();
    component.isDesktop = true;
    fixture.detectChanges();

    const permissionButton = () =>
      Array.from(fixture.nativeElement.querySelectorAll("button")).find(
        (button: HTMLElement) =>
          button.textContent.includes("Configure Permissions"),
      );

    // regular entity types do not offer this at all (the list menu is already full)
    expect(component.isFeatureType()).toBe(false);
    expect(permissionButton()).toBeUndefined();

    class FeatureTestEntity extends TestEntity {
      static override isInternalEntity = true;
    }
    fixture.componentRef.setInput("entityConstructor", FeatureTestEntity);
    fixture.detectChanges();

    expect(component.isFeatureType()).toBe(true);
    expect(permissionButton()).toBeTruthy();
  });

  it("should open the feature permission dialog for the displayed entity type", () => {
    createComponent();
    const openSpy = vi
      .spyOn(TestBed.inject(MatDialog), "open")
      .mockImplementation(() => makeMatDialogRef());

    component.openPermissionsDialog();

    expect(openSpy).toHaveBeenCalledWith(
      FeaturePermissionDialogComponent,
      expect.objectContaining({
        data: {
          entityType: TestEntity.ENTITY_TYPE,
          entityLabel: TestEntity.labelPlural,
        },
      }),
    );
  });

  function createComponent() {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entityConstructor", TestEntity);

    fixture.detectChanges();
  }

  function initComponentInputs() {
    for (const [key, value] of Object.entries(testConfig)) {
      fixture.componentRef.setInput(key as keyof EntityListConfig, value);
    }
    fixture.detectChanges();
  }

  function makeMatDialogRef<T = any>(result: T | null = null) {
    return {
      afterClosed: () => of(result),
    } as any;
  }

  it("should not allow import when user cannot create ImportMetadata", () => {
    const ability = TestBed.inject(EntityAbility);
    ability.update([
      { subject: "all", action: "manage" },
      { subject: "ImportMetadata", action: "create", inverted: true },
    ]);
    ability.initialized = true;

    createComponent();

    expect(component.canImport()).toBe(false);
  });

  it("should offer all schema export columns and preselect the visible ones", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // Visible columns include a plain field and an entity-reference field
      component.columnsToDisplay = ["name", "ref"];

      const matDialog = TestBed.inject(MatDialog);
      const openSpy = vi
        .spyOn(matDialog, "open")
        .mockImplementation(() => makeMatDialogRef());

      component.openExportDialog();

      expect(openSpy).toHaveBeenCalled();
      const callArgs = openSpy.mock.calls[0][1] as any;
      const available = callArgs.data.exportConfig as any[];
      const preselected = callArgs.data.preselectedExportConfig as any[];
      const queries = (cols: any[]) => cols.map((c) => c.query);

      // available columns are derived from the schema, incl. the readable
      // name column contributed by the entity-reference datatype
      expect(queries(available)).toEqual(
        expect.arrayContaining([".name", ".ref", ".ref_readable"]),
      );
      // a visible entity field preselects both its readable name and raw id
      expect(queries(preselected)).toEqual(
        expect.arrayContaining([".name", ".ref", ".ref_readable"]),
      );
      // columns of non-visible fields are not preselected
      expect(queries(preselected)).not.toContain(".other");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should use the PaginatedDataSource and disable the freetext filter in online mode", () => {
    const tmpSessionType = environment.session_type;
    try {
      environment.session_type = SessionType.online;
      vi.spyOn(
        TestBed.inject(DatabaseResolverService),
        "getDatabase",
      ).mockReturnValue({ supportsFind: () => true } as Database);
      createComponent();

      expect(component.showFreetextFilter()).toBe(false);
      expect(component.recordsDataSource()).toBeInstanceOf(PaginatedDataSource);
    } finally {
      environment.session_type = tmpSessionType;
    }
  });
});
