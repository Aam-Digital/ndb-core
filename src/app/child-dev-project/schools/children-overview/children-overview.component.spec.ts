import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { ChildrenOverviewComponent } from "./children-overview.component";
import { SchoolsModule } from "../schools.module";
import { School } from "../model/school";
import { Child } from "../../children/model/child";
import { SchoolsService } from "../schools.service";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  const schoolsService: jasmine.SpyObj<SchoolsService> = jasmine.createSpyObj(
    "schoolsService",
    ["getChildrenForSchool"]
  );

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [],
        imports: [SchoolsModule, RouterTestingModule, NoopAnimationsModule],
        providers: [{ provide: SchoolsService, useValue: schoolsService }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the children for a school", fakeAsync(() => {
    const school = new School("s1");
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    const config = { entity: school };
    schoolsService.getChildrenForSchool.and.returnValue(
      Promise.resolve([child1, child2])
    );
    component.onInitFromDynamicConfig(config);
    expect(schoolsService.getChildrenForSchool).toHaveBeenCalledWith(
      school.getId()
    );
    tick();
    expect(component.studentsDataSource.data).toEqual([child1, child2]);
  }));

  function expectToBeSortedAccordingTo(specifier: string, sortedValues: any[]) {
    let id = 0;
    const ids = [];
    // create an array of children with increasing id's
    let children = sortedValues.map((value) => {
      ids.push(id);
      const child = new Child(String(id));
      id += 1;
      child[specifier] = value;
      return child;
    });
    // shuffle the array
    children = children
      .map((a) => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value);
    // and re-sort it
    component.sort.sort({
      id: specifier,
      start: "asc",
      disableClear: false,
    });
    const sortedChildIds = component.studentsDataSource
      .sortData(children, component.sort)
      .map((it) => Number(it.getId()));
    expect(sortedChildIds).toEqual(ids);
  }

  it("should sort the table according to the different column values", () => {
    component.ngAfterViewInit();
    expectToBeSortedAccordingTo("name", ["AA", "AB", "F", "ZZ"]);
    expectToBeSortedAccordingTo("projectNumber", [1, 3, 5, 10]);
    expectToBeSortedAccordingTo("schoolClass", ["AA", "FG", "FH", "I"]);
    // cannot test sorting according to age because the setter is inaccessible
  });
});
