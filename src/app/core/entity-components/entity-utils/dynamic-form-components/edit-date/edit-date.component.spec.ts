import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDateComponent } from "./edit-date.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupEditComponent } from "../edit-component.spec";
import { MatNativeDateModule } from "@angular/material/core";
import moment from "moment";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateComponent, NoopAnimationsModule, MatNativeDateModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("Should have the date set to the current date when the relevant property is set in the property scheme", () => {
    setupEditComponent(component, "testProperty", {
      defaultValue: "$now",
    });
    fixture.detectChanges();
    expect(
      moment(component.formControl.value).isSame(moment(), "days")
    ).toBeTrue();
  });

  it("Should not start of with a default date by default", () => {
    // No setup required; this is the default case
    setupEditComponent(component);
    fixture.detectChanges();
    expect(component.formControl.value).toBeFalsy();
  });
});
