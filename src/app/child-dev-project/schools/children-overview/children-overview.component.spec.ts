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
import { Router } from "@angular/router";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  let mockSchoolsService: jasmine.SpyObj<SchoolsService>;

  beforeEach(
    waitForAsync(() => {
      mockSchoolsService = jasmine.createSpyObj(["getRelationsForSchool"]);

      TestBed.configureTestingModule({
        declarations: [],
        imports: [
          SchoolsModule,
          RouterTestingModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [{ provide: SchoolsService, useValue: mockSchoolsService }],
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

  it("should load the children for a school", fakeAsync(() => {
    const school = new School("s1");
    const child1 = new ChildSchoolRelation("c1");
    const child2 = new ChildSchoolRelation("c2");
    const config = { entity: school };
    mockSchoolsService.getRelationsForSchool.and.resolveTo([child1, child2]);

    component.onInitFromDynamicConfig(config);

    expect(mockSchoolsService.getRelationsForSchool).toHaveBeenCalledWith(
      school.getId()
    );
    tick();
    expect(component.records).toEqual([child1, child2]);
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
});
