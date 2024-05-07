import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEditDescriptionOnlyFieldComponent } from "./admin-edit-description-only-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "app/core/entity/model/entity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormBuilder } from "@angular/forms";
import { AdminEntityService } from "app/core/admin/admin-entity.service";

describe("AdminEditDescriptionOnlyFieldComponent", () => {
  let component: AdminEditDescriptionOnlyFieldComponent;
  let fixture: ComponentFixture<AdminEditDescriptionOnlyFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminEditDescriptionOnlyFieldComponent,
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
          FormBuilder,
          AdminEntityService,
        },
        { provide: MatDialogRef, useValue: { close: () => null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEditDescriptionOnlyFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize schemaFieldsForm with proper values", () => {
    component.formField = { id: "foo", label: "Test Label" };
    component.initSettings();
    expect(component.schemaFieldsForm.get("label").value).toBe("Test Label");
  });
});
