import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ChildrenOverviewComponent } from "./children-overview.component";
import { SchoolsModule } from "../schools.module";
import { School } from "../model/school";
import { Child } from "../../children/model/child";
import { Router } from "@angular/router";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { ChildrenService } from "../../children/children.service";
import moment from "moment";
import { FormDialogService } from "../../../core/form-dialog/form-dialog.service";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const school = new School("s1");
  const active1 = new ChildSchoolRelation("r1");
  const active2 = new ChildSchoolRelation("r2");
  const inactive = new ChildSchoolRelation("r2");
  inactive.end = moment().subtract("1", "week").toDate();

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);

    TestBed.configureTestingModule({
      imports: [SchoolsModule, MockedTestingModule.withState()],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: FormDialogService, useValue: null },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenOverviewComponent);
    component = fixture.componentInstance;
    component.entity = new School();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should on default only show active relations", async () => {
    mockChildrenService.queryRelationsOf.and.resolveTo([
      active1,
      active2,
      inactive,
    ]);

    await component.onInitFromDynamicConfig({ entity: school });

    expect(mockChildrenService.queryRelationsOf).toHaveBeenCalledWith(
      "school",
      school.getId()
    );
    expect(component.displayedRecords).toEqual([active1, active2]);
  });

  it("should show all relations if configured; with active ones being highlighted", async () => {
    mockChildrenService.queryRelationsOf.and.resolveTo([
      active1,
      active2,
      inactive,
    ]);

    await component.onInitFromDynamicConfig({
      entity: new School(),
      config: { showInactive: true },
    });

    expect(component.displayedRecords).toEqual([active1, active2, inactive]);
    expect(component.backgroundColorFn(active1)).not.toEqual("");
    expect(component.backgroundColorFn(inactive)).toEqual("");
  });

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
