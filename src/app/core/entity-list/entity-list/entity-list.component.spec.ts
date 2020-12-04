import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityListComponent } from "./entity-list.component";
import { of } from "rxjs";
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
import { EntitySubrecordModule } from "../../entity-subrecord/entity-subrecord.module";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionService } from "../../session/session-service/session.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { ActivatedRoute, Router } from "@angular/router";

describe("EntityListComponent", () => {
  let component: EntityListComponent;
  let fixture: ComponentFixture<EntityListComponent>;
  const routeData = {
    title: "Children List",
    columns: [
      { type: "text", title: "PN", id: "projectNumber" },
      { type: "child-block", title: "Name", id: "name" },
      { type: "date", title: "DoB", id: "dateOfBirth" },
      { type: "text", title: "Gender", id: "gender" },
      { type: "latest-csr", title: "Class", id: "schoolClass" },
      { type: "latest-csr", title: "School", id: "schoolId" },
      { type: "list-attendance", title: "Attendance (School)", id: "school" },
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
  const routeMock = {
    data: of(routeData),
    queryParams: of({}),
  };

  beforeEach(async(() => {
    const mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue(new User("test1"));
    TestBed.configureTestingModule({
      declarations: [
        ChildBlockComponent,
        SchoolBlockComponent,
        AttendanceBlockComponent,
        AttendanceDaysComponent,
        AttendanceDayBlockComponent,
        ExportDataComponent,
      ],

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
        EntitySubrecordModule,
        RouterTestingModule.withRoutes([
          { path: "child", component: ChildrenListComponent },
        ]),
      ],
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        { provide: Database, useClass: MockDatabase },
        {
          provide: ChildPhotoService,
          useValue: jasmine.createSpyObj(["getImage"]),
        },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityListComponent);
    component = fixture.componentInstance;
    const router = fixture.debugElement.injector.get(Router);
    fixture.ngZone.run(() => router.initialNavigation());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should creates columns from config", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      expect(component.columns).toEqual(routeData.columns);
      done();
    });
  });

  it("should create column groups from config and set correct one", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      expect(component.columnGroups).toEqual(routeData.columnGroups.groups);
      const defaultGroup = routeData.columnGroups.groups.find(
        (g) => g.name === routeData.columnGroups.default
      );
      expect(component.selectedColumnGroup).toEqual(defaultGroup.name);
      expect(component.columnsToDisplay).toEqual(defaultGroup.columns);
      done();
    });
  });

  it("should create filters from config and set correct ones", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      expect(component.filterSelections.length).toEqual(2);
      expect(component.filterSelections[0].selectedOption).toEqual(
        routeData.filters[0].default
      );
      expect(component.filterSelections[1].selectedOption).toEqual("");
      done();
    });
  });

  it("should set the clicked column group", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      component.ready = true;
      const clickedColumnGroup = routeData.columnGroups.groups[0];
      component.columnGroupClick(clickedColumnGroup.name);
      expect(component.selectedColumnGroup).toEqual(clickedColumnGroup.name);
      expect(component.columnsToDisplay).toEqual(clickedColumnGroup.columns);
      done();
    });
  });

  it("should apply the clicked filter", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      const dropoutFs = component.filterSelections[0];
      const clickedOption = routeData.filters[0].false;
      component.filterClick(dropoutFs, clickedOption);
      expect(component.filterSelections[0].selectedOption).toEqual(
        clickedOption
      );
      component.childrenDataSource.data.forEach((child: Child) => {
        expect(child.isActive).toBeFalse();
      });
      done();
    });
  });

  it("should navigate to the correct url params when clicking  a filter", (done) => {
    component.ngOnInit();
    setTimeout(() => {
      const router = fixture.debugElement.injector.get(Router);
      spyOn(router, "navigate");
      const dropoutFs = component.filterSelections[0];
      const centerFs = component.filterSelections[1];
      const clickedOption = routeData.filters[0].false;
      component.filterClick(dropoutFs, clickedOption);
      const expectedParams = {};
      expectedParams[dropoutFs.name] = clickedOption;
      expectedParams[centerFs.name] = "";
      expectedParams["view"] = routeData.columnGroups.default;
      expect(router.navigate).toHaveBeenCalledWith(["child"], {
        queryParams: expectedParams,
        replaceUrl: false,
      });
      done();
    });
  });

  it("should creat the correct filter string", () => {
    component.applyFilter("test String    ");
    expect(component.childrenDataSource.filter).toEqual("test string");
  });
});
