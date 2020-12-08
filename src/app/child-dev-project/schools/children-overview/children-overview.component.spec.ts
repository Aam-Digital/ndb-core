import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ChildrenOverviewComponent } from "./children-overview.component";
import { SchoolsModule } from "../schools.module";
import { School } from "../model/school";
import { Child } from "../../children/model/child";
import { SchoolsService } from "../schools.service";
import { RouterTestingModule } from "@angular/router/testing";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  const schoolsService: jasmine.SpyObj<SchoolsService> = jasmine.createSpyObj(
    "schoolsService",
    ["getChildrenForSchool"]
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [SchoolsModule, RouterTestingModule],
      providers: [{ provide: SchoolsService, useValue: schoolsService }],
    }).compileComponents();
  }));

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
});
