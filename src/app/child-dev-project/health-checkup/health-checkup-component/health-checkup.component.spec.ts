import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { of } from "rxjs";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AlertService } from "../../../core/alerts/alert.service";
import { ChildrenModule } from "../../children/children.module";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../core/entity/mock-entity-mapper-service";

describe("HealthCheckupComponent", () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child();
  let mockedEntityMapper: MockEntityMapperService;

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });
      mockedEntityMapper = mockEntityMapper([new User("TestUser")]);
      mockChildrenService = jasmine.createSpyObj([
        "getChild",
        "getEducationalMaterialsOfChild",
        "getHealthChecksOfChild",
      ]);
      mockChildrenService.getChild.and.returnValue(of(child));
      mockChildrenService.getEducationalMaterialsOfChild.and.returnValue(
        of([])
      );
      mockChildrenService.getHealthChecksOfChild.and.returnValue(of([]));

      TestBed.configureTestingModule({
        imports: [ChildrenModule, NoopAnimationsModule],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: EntityMapperService, useValue: mockedEntityMapper },
          AlertService,
          { provide: SessionService, useValue: mockSessionService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthCheckupComponent);
    component = fixture.componentInstance;
    component.child = child;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
