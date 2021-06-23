import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ChildrenModule } from "../../children/children.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "app/core/entity/mock-entity-mapper-service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;

  const mockChildrenService = {
    getChild: () => {
      return of([new Child("22")]);
    },
    getEducationalMaterialsOfChild: () => {
      return of([]);
    },
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [EducationalMaterialComponent],
        imports: [ChildrenModule, NoopAnimationsModule],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: EntityMapperService, useValue: mockEntityMapper([]) },
          {
            provide: SessionService,
            useValue: { getCurrentUser: () => new User() },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EducationalMaterialComponent);
    component = fixture.componentInstance;
    component.child = new Child("22");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
