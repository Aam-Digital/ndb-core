import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { ChildrenModule } from "../../children/children.module";
import { MockSessionModule } from "../../../core/session/mock-session.module";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child("22");

  beforeEach(
    waitForAsync(() => {
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
        imports: [
          ChildrenModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
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
