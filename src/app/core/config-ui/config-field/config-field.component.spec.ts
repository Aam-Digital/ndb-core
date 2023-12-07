import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfigFieldComponent } from "./config-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatFormFieldHarness } from "@angular/material/form-field/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { Entity } from "../../entity/model/entity";

describe("ConfigFieldComponent", () => {
  let component: ConfigFieldComponent;
  let fixture: ComponentFixture<ConfigFieldComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ConfigFieldComponent,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitySchemaField: {},
            entityType: Entity,
          },
        },
        { provide: MatDialogRef, useValue: null },
      ],
    });
    fixture = TestBed.createComponent(ConfigFieldComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should generate id (if new field) from label", async () => {
    const labelInput = await loader
      .getHarness(MatFormFieldHarness.with({ floatingLabelText: "Label" }))
      .then((field) => field.getControl(MatInputHarness));
    const idInput = await loader
      .getHarness(
        MatFormFieldHarness.with({ floatingLabelText: "Field ID (readonly)" }),
      )
      .then((field) => field.getControl(MatInputHarness));

    // Initially ID is automatically generated from label
    await labelInput.setValue("new label");
    await expectAsync(idInput.getValue()).toBeResolvedTo("newLabel");

    // manual edit of ID field stops auto generation of ID
    await idInput.setValue("my_id");
    await labelInput.setValue("other label");
    await expectAsync(idInput.getValue()).toBeResolvedTo("my_id");
  });
});
