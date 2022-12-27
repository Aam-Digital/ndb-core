import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditAgeComponent } from "./edit-age.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatNativeDateModule } from "@angular/material/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { setupEditComponent } from "../edit-component.spec";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";

describe("EditAgeComponent", () => {
  let component: EditAgeComponent;
  let fixture: ComponentFixture<EditAgeComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        FontAwesomeTestingModule,
        MatInputModule,
      ],
      declarations: [EditAgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAgeComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should transform Date to DateOfBirth", async () => {
    const datepicker = await loader.getHarness(MatDatepickerInputHarness);

    await datepicker.setValue("2022-12-20");

    expect(component.formControl.value).toBeInstanceOf(DateWithAge);
    expect(component.formControl.value).toBeDate(new Date("2022-12-20"));
  });
});
