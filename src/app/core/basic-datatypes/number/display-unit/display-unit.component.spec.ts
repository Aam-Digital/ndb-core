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
    fixture.componentRef.setInput("entity", new Entity());
    fixture.componentRef.setInput("id", "height");
    fixture.componentRef.setInput("value", "120");
    fixture.componentRef.setInput("config", "cm");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
