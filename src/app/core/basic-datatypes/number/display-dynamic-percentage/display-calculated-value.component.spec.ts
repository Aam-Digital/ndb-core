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
    fixture.componentRef.setInput(
      "entity",
      Object.assign(new Entity(), entity),
    );
    expect(component.calculatedValue()).toEqual(25);
  });

  it("should not display a value if one of the two values is not a number", () => {
    entity["totalValue"] = 15;
    fixture.componentRef.setInput(
      "entity",
      Object.assign(new Entity(), entity),
    );
    expect(component.calculatedValue()).toBe(undefined);
  });

  it("should not display a value if totalValue is 0", () => {
    entity["totalValue"] = 0;
    entity["actualValue"] = 15;
    fixture.componentRef.setInput(
      "entity",
      Object.assign(new Entity(), entity),
    );
    expect(component.calculatedValue()).toBe(undefined);
  });
});
