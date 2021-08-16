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
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  let mockSchoolsService: jasmine.SpyObj<SchoolsService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(
    waitForAsync(() => {
      mockSchoolsService = jasmine.createSpyObj(["getChildrenForSchool"]);
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });

      TestBed.configureTestingModule({
        declarations: [],
        imports: [SchoolsModule, RouterTestingModule, NoopAnimationsModule],
        providers: [
          { provide: SchoolsService, useValue: mockSchoolsService },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapper([new User("TestUser")]),
          },
          { provide: SessionService, useValue: mockSessionService },
        ],
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
    mockSchoolsService.getChildrenForSchool.and.resolveTo([child1, child2]);

    component.onInitFromDynamicConfig(config);

    expect(mockSchoolsService.getChildrenForSchool).toHaveBeenCalledWith(
      school.getId()
    );
    tick();
    expect(component.children).toEqual([child1, child2]);
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
