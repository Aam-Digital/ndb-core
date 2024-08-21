import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayUnitComponent } from "./display-unit.component";
import { Entity } from "../../../entity/model/entity";

describe("DisplayUnitComponent", () => {
  let component: DisplayUnitComponent;
  let fixture: ComponentFixture<DisplayUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayUnitComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayUnitComponent);
    component = fixture.componentInstance;
    component.entity = new Entity();
    component.id = "height";
    component.value = "120";
    component.config = "cm";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
