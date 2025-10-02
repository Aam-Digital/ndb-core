import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditMonthComponent } from "./edit-month.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import moment from "moment";

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
