import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SelectComponent } from "./select.component";
import { Entity } from "../../entity/entity";

describe("SelectComponent", () => {
  let component: SelectComponent<Entity>;
  let fixture: ComponentFixture<SelectComponent<Entity>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
