import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayUnitComponent } from "./display-unit.component";
import { HealthCheck } from "../../../../../child-dev-project/health-checkup/model/health-check";

describe("DisplayUnitComponent", () => {
  let component: DisplayUnitComponent;
  let fixture: ComponentFixture<DisplayUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DisplayUnitComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayUnitComponent);
    component = fixture.componentInstance;
    component.entity = new HealthCheck();
    component.property = "height";
    component.unit = "cm";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
