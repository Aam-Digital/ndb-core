import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfigFieldComponent } from "./config-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntitySchemaField_withId } from "../config-entity-form/config-entity-form.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigFieldComponent", () => {
  let component: ConfigFieldComponent;
  let fixture: ComponentFixture<ConfigFieldComponent>;

  let testSchemaField: EntitySchemaField_withId;

  beforeEach(() => {
    testSchemaField = {
      id: "test",
    };

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
          useValue: { entitySchemaField: testSchemaField },
        },
        { provide: MatDialogRef, useValue: null },
      ],
    });
    fixture = TestBed.createComponent(ConfigFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
