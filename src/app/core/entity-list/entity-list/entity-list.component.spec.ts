import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { BooleanFilterConfig, EntityListConfig } from "../EntityListConfig";
import { Entity } from "../../entity/model/entity";
import { Child } from "../../../child-dev-project/children/model/child";
import { DatabaseField } from "../../entity/database-field.decorator";
import { AttendanceService } from "../../../child-dev-project/attendance/attendance.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatTabGroupHarness } from "@angular/material/tabs/testing";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { UpdatedEntity } from "../../entity/model/entity-update";

describe("EntityListComponent", () => {
  let component: EntityListComponent<Entity>;
  let fixture: ComponentFixture<EntityListComponent<Entity>>;
  let loader: HarnessLoader;

  const testConfig: EntityListConfig = {
    title: "Children List",
    columns: [
      { viewComponent: "DisplayText", label: "Age", id: "age" },
      {
        viewComponent: "RecentAttendanceBlocks",
        label: "Attendance (School)",
        id: "school",
        additional: {
          filterByActivityType: "SCHOOL_CLASS",
        },
      },
    ],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "Basic Info",
          columns: ["projectNumber", "name", "age", "gender"],
        },
        {
          name: "School Info",
          columns: ["name", "age", "school"],
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
        id: "center",
      },
    ],
  };
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let mockActivatedRoute: Partial<ActivatedRoute>;
  let routeData: Subject<DynamicComponentConfig<EntityListConfig>>;

  beforeEach(waitForAsync(() => {
    mockAttendanceService = jasmine.createSpyObj([
      "getActivitiesForChild",
      "getAllActivityAttendancesForPeriod",
    ]);
    mockAttendanceService.getActivitiesForChild.and.resolveTo([]);
    mockAttendanceService.getAllActivityAttendancesForPeriod.and.resolveTo([]);
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
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();
  }));

  it("should create", () => {
    createComponent();
    initComponentInputs();
    expect(component).toBeTruthy();
  });

  it("should create columns from config", fakeAsync(() => {
    createComponent();
    initComponentInputs();
    tick();
    expect(component.columns).toEqual([...testConfig.columns]);
  }));

  it("should create column groups from config and set correct one", fakeAsync(() => {
    createComponent();
    initComponentInputs();
    tick();

    expect(component.groups).toEqual(testConfig.columnGroups.groups);
    const defaultGroup = testConfig.columnGroups.groups.findIndex(
      (g) => g.name === testConfig.columnGroups.default,
    );
    expect(component.selectedColumnGroupIndex).toEqual(defaultGroup);
    expect(component.columnsToDisplay).toEqual(
      testConfig.columnGroups.groups[defaultGroup].columns,
    );
  }));

  it("should set the clicked column group", async () => {
    createComponent();
    // Test only works in desktop mode
    component.isDesktop = true;
    await initComponentInputs();
    expect(component.selectedColumnGroupIndex).toBe(1);

    const tabGroup = await loader.getHarness(MatTabGroupHarness);
    const groups = await tabGroup.getTabs();
    const clickedTab = groups[0];
    const clickedColumnGroup = testConfig.columnGroups.groups[0];
    const tabLabel = await clickedTab.getLabel();
    expect(tabLabel).toBe(clickedColumnGroup.name);

    await clickedTab.select();

    expect(component.selectedColumnGroupIndex).toEqual(0);
    expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
  });

  it("should allow to use entity fields which are only mentioned in the columnGroups", fakeAsync(() => {
    createComponent();
    initComponentInputs();
    tick();

    class Test extends Entity {
      @DatabaseField({ label: "Test Property" }) testProperty: string;
    }

    component.entityConstructor = Test;
    component.columns = [
      {
        id: "anotherColumn",
        label: "Predefined Title",
        viewComponent: "DisplayDate",
      },
    ];
    component.columnGroups = {
      groups: [{ name: "Both", columns: ["testProperty", "anotherColumn"] }],
    };

    component.ngOnChanges({ listConfig: null });
    tick();

    expect(component.columnsToDisplay).toEqual([
      "testProperty",
      "anotherColumn",
    ]);
  }));

  it("should not navigate on addNew if clickMode is not 'navigate'", () => {
    createComponent();
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");

    component.clickMode = "popup";
    component.addNew();
    expect(navigateSpy).not.toHaveBeenCalled();

    navigateSpy.calls.reset();
    component.clickMode = "navigate";
    component.addNew();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("should add a new entity that was created after the initial loading to the table", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    createComponent();
    initComponentInputs();
    tick();

    const entity = new Child();
    entityUpdates.next({ entity: entity, type: "new" });
    tick();

    expect(component.allEntities).toEqual([entity]);
  }));

  it("should remove an entity from the table when it has been deleted", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    const entity = new Child();
    createComponent();
    initComponentInputs();
    tick();

    component.allEntities = [entity];
    entityUpdates.next({ entity: entity, type: "remove" });
    tick();

    expect(component.allEntities).toEqual([]);
  }));

  function createComponent() {
    fixture = TestBed.createComponent(EntityListComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;

    component.entityConstructor = Child;

    fixture.detectChanges();
  }

  async function initComponentInputs() {
    Object.assign(component, testConfig);
    await component.ngOnChanges({
      allEntities: undefined,
    });
    fixture.detectChanges();
  }
});
