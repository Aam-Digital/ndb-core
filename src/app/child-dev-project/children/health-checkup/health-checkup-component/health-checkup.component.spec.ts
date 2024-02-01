import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HealthCheckupComponent } from "./health-checkup.component";
import { Child } from "../../model/child";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("HealthCheckupComponent", () => {
  let component: HealthCheckupComponent;
  let fixture: ComponentFixture<HealthCheckupComponent>;
  const child = new Child();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HealthCheckupComponent, MockedTestingModule.withState()],
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
