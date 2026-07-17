import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { BooleanFilterConfig, EntityListConfig } from "../EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { PublicFormsService } from "#src/app/features/public-form/public-forms.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;

  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [{ viewComponent: "DisplayText", label: "Age", id: "age" }],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
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
        id: "isActive",
        type: "boolean",
        default: "true",
        true: "Currently active children",
        false: "Currently inactive children",
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

  it("should create column groups from config and set correct one", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.groups).toEqual(testConfig.columnGroups.groups);
      const defaultGroup = testConfig.columnGroups.groups.findIndex(
        (g) => g.name === testConfig.columnGroups.default,
      );
      expect(component.selectedColumnGroupIndex).toEqual(defaultGroup);
      expect(component.columnsToDisplay).toEqual(
        testConfig.columnGroups.groups[defaultGroup].columns,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set the clicked column group", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      // Test only works in desktop mode
      component.isDesktop = true;
      initComponentInputs();
      await vi.advanceTimersByTimeAsync(0);
      expect(component.selectedColumnGroupIndex).toBe(1);

      const clickedColumnGroup = testConfig.columnGroups.groups[0];

      // Simulate selecting the first tab group and verify table columns update.
      component.selectedColumnGroupIndex = 0;

      expect(component.selectedColumnGroupIndex).toEqual(0);
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

      expect(component.allEntities()).toEqual([entity]);
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

      component.allEntities.set([entity]);
      entityUpdates.next({ entity: entity, type: "remove" });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.allEntities()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should fallback to the first group if default and mobile group does not exist", async () => {
    vi.useFakeTimers();
    try {
      createComponent();
      fixture.componentRef.setInput("columns", [
        "name",
        "age",
        "category",
        "other",
      ]);
      fixture.componentRef.setInput("columnGroups", {
        default: "Overview",
        mobile: "Overview",
        groups: [
          { name: "Basic Info", columns: ["name", "age", "category"] },
          { name: "School Info", columns: ["name", "age", "other"] },
        ],
      });
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.defaultColumnGroup).toEqual("Basic Info");
      expect(component.mobileColumnGroup).toEqual("Basic Info");
    } finally {
      vi.useRealTimers();
    }
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
});
