import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
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
    component.entitySchemaField = {
      // Mock EntitySchemaField data
      validators: {
        required: true,
        min: 0,
        max: 10,
        pattern: "^[a-zA-Z0-9]+$",
        uniqueId: "guid",
      },
    };
    component.entitySchemaField.validators = { required: false };
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
      regex: "abc",
      uniqueId: "",
    };

    // execute
    const actualResult =
      component.removeDefaultValuesFromValidatorConfig(testFormValues);

    // check result
    const expectedResult = {
      required: true,
      max: 100,
      regex: "abc",
    };
    expect(actualResult).toEqual(expectedResult);
  });
});
