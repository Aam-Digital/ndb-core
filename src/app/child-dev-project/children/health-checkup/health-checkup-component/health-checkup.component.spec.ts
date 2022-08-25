import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { of } from "rxjs";
import { Child } from "../../model/child";
import { ChildrenService } from "../../children.service";
import { ChildrenModule } from "../../children.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("HealthCheckupComponent", () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  const child = new Child();

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj([
      "getChild",
      "getHealthChecksOfChild",
    ]);
    mockChildrenService.getChild.and.returnValue(of(child));
    mockChildrenService.getHealthChecksOfChild.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ChildrenModule, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

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
