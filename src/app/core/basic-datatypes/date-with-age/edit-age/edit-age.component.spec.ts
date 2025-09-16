import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { DateAdapter, MAT_DATE_FORMATS } from "@angular/material/core";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditAgeComponent, NoopAnimationsModule],
      providers: [
        { provide: DateAdapter, useClass: DateAdapterWithFormatting },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAgeComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should transform Date to DateOfBirth", async () => {
    const datepicker = await loader.getHarness(MatDatepickerInputHarness);

    await datepicker.setValue("6/21/2019");

    expect(component.formControl.value).toBeInstanceOf(DateWithAge);
    expect(component.formControl.value).toBeDate("2019-06-21");
  });
});
