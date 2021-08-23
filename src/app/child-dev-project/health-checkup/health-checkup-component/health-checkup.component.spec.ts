import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { of } from "rxjs";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { ChildrenService } from "../../children/children.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AlertService } from "../../../core/alerts/alert.service";
import { ChildrenModule } from "../../children/children.module";
import { MockSessionModule } from "../../../core/session/mock-session.module";

describe("HealthCheckupComponent", () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child();

  beforeEach(
    waitForAsync(() => {
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
        imports: [
          ChildrenModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [
          DatePipe,
          { provide: ChildrenService, useValue: mockChildrenService },
          AlertService,
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
