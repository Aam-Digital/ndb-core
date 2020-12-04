import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { User } from "../../user/user";
import { ExportDataComponent } from "../../admin/export-data/export-data.component";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatPaginatorModule } from "@angular/material/paginator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { FilterPipeModule } from "ngx-filter-pipe";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionService } from "../../session/session-service/session.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { Router } from "@angular/router";
import { Child } from "../../../child-dev-project/children/model/child";
import { SimpleChange } from "@angular/core";
import { ChildrenListComponent } from "../../../child-dev-project/children/children-list/children-list.component";

describe("EntityListComponent", () => {
  let component: EntityListComponent;
  let fixture: ComponentFixture<EntityListComponent>;
  const testConfig = {
    title: "Children List",
    columns: [
      { type: "DisplayText", title: "PN", id: "projectNumber" },
      { type: "ChildBlock", title: "Name", id: "name" },
      { type: "DisplayDate", title: "DoB", id: "dateOfBirth" },
      { type: "DisplayText", title: "Gender", id: "gender" },
      { type: "DisplayText", title: "Class", id: "schoolClass" },
      { type: "SchoolBlockWrapper", title: "School", id: "schoolId" },
      { type: "ListAttendance", title: "Attendance (School)", id: "school" },
    ],
    columnGroups: {
      default: "School Info",
      mobile: "School Info",
      groups: [
        {
          name: "Basic Info",
          columns: ["projectNumber", "name", "age"],
        },
        {
          name: "School Info",
          columns: ["name", "schoolClass", "schoolId", "school"],
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
        all: "All children",
      },
      {
        id: "center",
      },
    ],
  };

  const routerMock = jasmine.createSpyObj("routerMock", ["navigate"]);

  beforeEach(async(() => {
    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [EntityListComponent, ExportDataComponent],
      imports: [
        CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatExpansionModule,
        MatTableModule,
        MatSortModule,
        MatSidenavModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatTooltipModule,
        MatPaginatorModule,
        NoopAnimationsModule,
        FormsModule,
        FilterPipeModule,
        RouterTestingModule.withRoutes([
          { path: "child", component: ChildrenListComponent },
        ]),
      ],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        { provide: Database, useClass: MockDatabase },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;
    component.listConfig = testConfig;
    component.ngOnChanges({
      entityList: new SimpleChange(null, component.entityList, false),
      listConfig: new SimpleChange(null, component.listConfig, false),
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should creates columns from config", () => {
    expect(component.columns).toEqual(testConfig.columns);
  });

  it("should create column groups from config and set correct one", () => {
    expect(component.columnGroups).toEqual(testConfig.columnGroups.groups);
    const defaultGroup = testConfig.columnGroups.groups.find(
      (g) => g.name === testConfig.columnGroups.default
    );
    expect(component.selectedColumnGroup).toEqual(defaultGroup.name);
    expect(component.columnsToDisplay).toEqual(defaultGroup.columns);
  });

  it("should create filters from config and set correct ones", () => {
    expect(component.filterSelections.length).toEqual(2);
    expect(component.filterSelections[0].selectedOption).toEqual(
      testConfig.filters[0].default
    );
    expect(component.filterSelections[1].selectedOption).toEqual("");
  });

  it("should set the clicked column group", () => {
    component.ready = true;
    const clickedColumnGroup = testConfig.columnGroups.groups[0];
    component.columnGroupClick(clickedColumnGroup.name);
    expect(component.selectedColumnGroup).toEqual(clickedColumnGroup.name);
    expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
  });

  it("should apply the clicked filter", (done) => {
    const clickedOption = "false";
    const child1 = new Child("dropoutId");
    child1.status = "Dropout";
    const child2 = new Child("activeId");
    component.entityList = [child1, child2];
    component.ngOnChanges({
      entityList: new SimpleChange(false, component.entityList, false),
    });
    setTimeout(() => {
      const activeFs = component.filterSelections[0];
      component.filterClick(activeFs, clickedOption);
      expect(component.filterSelections[0].selectedOption).toEqual(
        clickedOption
      );
      expect(component.entityList.length).toEqual(2);
      expect(component.entityDataSource.data.length).toEqual(1);
      expect(component.entityDataSource.data[0]).toEqual(child1);
      done();
    });
  });

  it("should navigate to the correct url params when clicking  a filter", () => {
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    const dropoutFs = component.filterSelections[0];
    const centerFs = component.filterSelections[1];
    const clickedOption = testConfig.filters[0].false;
    component.filterClick(dropoutFs, clickedOption);
    const expectedParams = {};
    expectedParams[dropoutFs.name] = clickedOption;
    expectedParams[centerFs.name] = "";
    expectedParams["view"] = testConfig.columnGroups.default;
    expect(router.navigate).toHaveBeenCalledWith(["child"], {
      queryParams: expectedParams,
      replaceUrl: false,
    });
  });

  it("should filter a list of children", (done) => {
    const child1 = new Child("something");
    const child2 = new Child("uniqueString");
    component.entityList = [child1, child2];
    component.ngOnChanges({
      entityList: new SimpleChange(false, component.entityList, false),
    });
    setTimeout(() => {
      component.applyFilter("     UnIquEString    ");
      expect(component.entityDataSource.filter).toEqual("uniquestring");
      expect(component.entityDataSource.filteredData.length).toEqual(1);
      expect(component.entityDataSource.filteredData[0]).toEqual(child2);
      done();
    });
  });
});
