import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayCalculatedValueComponent } from "./display-calculated-value.component";
import { Entity } from "app/core/entity/model/entity";

describe("DisplayCalculatedValueComponent", () => {
  let component: DisplayCalculatedValueComponent;
  let fixture: ComponentFixture<DisplayCalculatedValueComponent>;
  let entity: Entity;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayCalculatedValueComponent],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(DisplayCalculatedValueComponent);
    component = fixture.componentInstance;
    entity = new Entity();
    fixture.componentRef.setInput("config", {
      total: "totalValue",
      actual: "actualValue",
    });
    fixture.componentRef.setInput("entity", entity);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the correct percentage value", () => {
    entity["totalValue"] = 200;
    entity["actualValue"] = 50;
    expect(component.calculateValue()).toEqual(25);
  });

  it("should not display a value if one of the two values is not a number", () => {
    entity["totalValue"] = 15;
    expect(component.calculateValue()).toBe(undefined);
  });

  it("should not display a value if totalValue is 0", () => {
    entity["totalValue"] = 0;
    entity["actualValue"] = 15;
    expect(component.calculateValue()).toBe(undefined);
  });
});
