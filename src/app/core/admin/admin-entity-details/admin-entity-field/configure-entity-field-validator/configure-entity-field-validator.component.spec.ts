import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConfigureValidatorPopupComponent } from "./configure-entity-field-validator.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigureValidatorPopupComponent", () => {
  let component: ConfigureValidatorPopupComponent;
  let fixture: ComponentFixture<ConfigureValidatorPopupComponent>;

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
      ],
      providers: [FormBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureValidatorPopupComponent);
    component = fixture.componentInstance;
    component.entitySchemaField = {
      // Mock EntitySchemaField data
      validators: {
        required: true,
        min: 0,
        max: 10,
        pattern: "^[a-zA-Z0-9]+$",
        validEmail: true,
        uniqueId: "uniqueIdValidator",
      },
    };
    component.entitySchemaField.validators = { required: false };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
