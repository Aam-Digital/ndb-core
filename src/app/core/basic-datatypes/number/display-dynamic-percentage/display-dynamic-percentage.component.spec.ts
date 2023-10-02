import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayDynamicPercentageComponent } from "./display-dynamic-percentage.component";
import { Entity } from "app/core/entity/model/entity";

describe("DisplayDynamicPercentageComponent", () => {
  let component: DisplayDynamicPercentageComponent;

  let fixture: ComponentFixture<DisplayDynamicPercentageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayDynamicPercentageComponent],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(DisplayDynamicPercentageComponent);
    component = fixture.componentInstance;
    component.config = {
      total: "totalValue",
      actual: "actualValue",
    };
    component.entity = new Entity();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the correct percentage value", () => {
    component.entity["totalValue"] = 200;
    component.entity["actualValue"] = 50;
    expect(component.calculateValue()).toEqual(25);
  });

  it("should not display a value if one of the two values is not a number", () => {
    component.entity["totalValue"] = 15;
    expect(component.calculateValue()).toBe(undefined);
  });

  it("should not display a value if totalValue is 0", () => {
    component.entity["totalValue"] = 0;
    component.entity["actualValue"] = 15;
    expect(component.calculateValue()).toBe(undefined);
  });
});
