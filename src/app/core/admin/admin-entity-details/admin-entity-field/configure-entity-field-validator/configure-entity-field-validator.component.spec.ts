import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ConfigureEntityFieldValidatorComponent", () => {
  let component: ConfigureEntityFieldValidatorComponent;
  let fixture: ComponentFixture<ConfigureEntityFieldValidatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        FontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [FormBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureEntityFieldValidatorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entitySchemaField", {
      validators: { required: false },
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should remove unchanged default values before emitting output", () => {
    // set up
    const testFormValues = {
      required: true,
      min: null,
      max: 100,
      minAge: null,
      maxAge: 12,
      minDate: null,
      maxDate: new Date(2010, 0, 1),
      pattern: "abc",
      uniqueId: "",
    };

    // execute
    const actualResult =
      component.removeDefaultValuesFromValidatorConfig(testFormValues);

    // check result
    const expectedResult = {
      required: true,
      max: 100,
      maxAge: 12,
      maxDate: new Date(2010, 0, 1),
      pattern: "abc",
    };
    expect(actualResult).toEqual(expectedResult);
  });

  it("should load existing pattern config and emit edited pattern and custom message under the 'pattern' key", () => {
    fixture.componentRef.setInput("entitySchemaField", {
      dataType: "string",
      validators: { pattern: { pattern: "[0-9]{10}", message: "custom msg" } },
    });
    fixture.detectChanges();

    const patternControl = component
      .validatorForm()
      .get("pattern") as AbstractControl;
    const messageControl = component
      .validatorForm()
      .get("patternMessage") as AbstractControl;
    expect(patternControl?.value).toBe("[0-9]{10}");
    expect(messageControl?.value).toBe("custom msg");

    let emitted;
    component.entityValidatorChanges.subscribe((v) => (emitted = v));

    patternControl.setValue("[a-z]+");
    expect(emitted).toEqual({
      pattern: { pattern: "[a-z]+", message: "custom msg" },
    });

    messageControl.setValue("");
    expect(emitted).toEqual({ pattern: "[a-z]+" });

    messageControl.setValue("only lowercase letters");
    expect(emitted).toEqual({
      pattern: { pattern: "[a-z]+", message: "only lowercase letters" },
    });

    patternControl.setValue("");
    expect(emitted).toEqual({});
    expect(messageControl.disabled).toBe(true); // message only editable while a pattern is set
  });

  it("should flag invalid regex input as control error and not emit it", () => {
    fixture.componentRef.setInput("entitySchemaField", {
      dataType: "string",
      validators: {},
    });
    fixture.detectChanges();

    let emitted;
    component.entityValidatorChanges.subscribe((v) => (emitted = v));

    const patternControl = component
      .validatorForm()
      .get("pattern") as AbstractControl;
    const messageControl = component
      .validatorForm()
      .get("patternMessage") as AbstractControl;
    expect(messageControl.disabled).toBe(true); // disabled while no pattern is set

    patternControl.setValue("[a-z");

    expect(patternControl.hasError("invalidPattern")).toBe(true);
    expect(emitted).toEqual({});
    expect(messageControl.enabled).toBe(true); // editable as soon as user types a pattern
  });
});
