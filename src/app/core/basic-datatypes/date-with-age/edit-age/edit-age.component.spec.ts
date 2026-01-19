import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DateAdapter, MAT_DATE_FORMATS } from "@angular/material/core";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import moment from "moment";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import {
  DATE_FORMATS,
  DateAdapterWithFormatting,
} from "../../../language/date-adapter-with-formatting";
import { DateWithAge } from "../dateWithAge";
import { EditAgeComponent } from "./edit-age.component";

describe("EditAgeComponent", () => {
  let component: EditAgeComponent;
  let fixture: ComponentFixture<EditAgeComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditAgeComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: DateAdapter, useClass: DateAdapterWithFormatting },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAgeComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;

    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  xit("should transform Date to DateOfBirth", async () => {
    // the updated implementation doesn't support this anymore
    // but has a separate age signal

    const datepicker = await loader.getHarness(MatDatepickerInputHarness);

    await datepicker.setValue("6/21/2019");

    expect(component.formControl.value).toBeInstanceOf(DateWithAge);
    expect(component.formControl.value).toBeDate("2019-06-21");
  });

  it("should update age when date is changed", async () => {
    const datepicker = await loader.getHarness(MatDatepickerInputHarness);

    await datepicker.setValue(
      moment().subtract(20, "years").toDate().toLocaleDateString(),
    );

    expect(component.age()).toEqual(20);
  });
});
