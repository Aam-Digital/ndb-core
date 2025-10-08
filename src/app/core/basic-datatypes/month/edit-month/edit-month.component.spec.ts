import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import moment from "moment";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditMonthComponent } from "./edit-month.component";

describe("EditMonthComponent", () => {
  let component: EditMonthComponent;
  let fixture: ComponentFixture<EditMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMonthComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMonthComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should save the selected moment on the form control", () => {
    const selected = new Date("2021-05-01");
    const closeSpy = jasmine.createSpy();

    component.setMonthAndYear(moment(selected), { close: closeSpy } as any);

    expect(component.formControl).toHaveValue(selected);
    expect(closeSpy).toHaveBeenCalled();
  });
});
