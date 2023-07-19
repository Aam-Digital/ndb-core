import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { Child } from "../../model/child";
import { ChildrenService } from "../../children.service";
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
    mockChildrenService.getChild.and.resolveTo(child);
    mockChildrenService.getHealthChecksOfChild.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [HealthCheckupComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthCheckupComponent);
    component = fixture.componentInstance;
    component.entity = child;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
