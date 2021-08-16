import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ChildrenModule } from "../../children/children.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child("22");

  beforeEach(
    waitForAsync(() => {
      mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
      mockSessionService.getCurrentUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });
      mockChildrenService = jasmine.createSpyObj([
        "getChild",
        "getEducationalMaterialsOfChild",
      ]);
      mockChildrenService.getChild.and.returnValue(of(child));
      mockChildrenService.getEducationalMaterialsOfChild.and.returnValue(
        of([])
      );
      TestBed.configureTestingModule({
        declarations: [EducationalMaterialComponent],
        imports: [ChildrenModule, NoopAnimationsModule],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
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
    fixture = TestBed.createComponent(EducationalMaterialComponent);
    component = fixture.componentInstance;
    component.child = child;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
