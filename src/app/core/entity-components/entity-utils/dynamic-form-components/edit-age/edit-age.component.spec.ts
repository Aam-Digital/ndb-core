import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditAgeComponent } from "./edit-age.component";
import { setupEditComponent } from "../edit-component.spec";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";

describe("EditAgeComponent", () => {
  let component: EditAgeComponent;
  let fixture: ComponentFixture<EditAgeComponent>;
  let loader: HarnessLoader;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditAgeComponent, MockedTestingModule],
    }).compileComponents();
  }));

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

    await datepicker.setValue("6/21/2019");

    expect(component.formControl.value).toBeInstanceOf(DateWithAge);
    expect(component.formControl.value).toBeDate("2019-06-21");
  });
});
