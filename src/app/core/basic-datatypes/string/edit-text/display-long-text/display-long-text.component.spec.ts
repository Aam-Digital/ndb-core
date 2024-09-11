import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayLongTextComponent } from "./display-long-text.component";
import { Entity } from "../../../../entity/model/entity";

describe("DisplayLongTextComponent", () => {
  let component: DisplayLongTextComponent;
  let fixture: ComponentFixture<DisplayLongTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayLongTextComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayLongTextComponent);
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
