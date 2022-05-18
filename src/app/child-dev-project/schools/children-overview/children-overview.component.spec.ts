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
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { ChildrenService } from "../../children/children.service";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);

      TestBed.configureTestingModule({
        imports: [SchoolsModule, MockedTestingModule.withState()],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenOverviewComponent);
    component = fixture.componentInstance;
    component.entity = new School();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the relations for a school", fakeAsync(() => {
    const school = new School("s1");
    const relation1 = new ChildSchoolRelation("r1");
    const relation2 = new ChildSchoolRelation("r2");
    const config = { entity: school };
    mockChildrenService.queryRelationsOf.and.resolveTo([relation1, relation2]);

    component.onInitFromDynamicConfig(config);
    tick();

    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      school.getId(),
      true
    );
    expect(component.records).toEqual([relation1, relation2]);
  }));

  it("should route to a child when clicked", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    const child = new Child();

    component.routeToChild(child);

    expect(router.navigate).toHaveBeenCalledWith([
      `/${Child.ENTITY_TYPE.toLowerCase()}`,
      child.getId(),
    ]);
  });

  it("should create a relation with the school ID already been set", () => {
    component.entity = new School("testID");

    const newRelation = component.generateNewRecordFactory()();

    expect(newRelation).toBeInstanceOf(ChildSchoolRelation);
    expect(newRelation.schoolId).toBe("testID");
  });
});
