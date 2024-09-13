import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityBulkEditComponent } from "./entity-bulk-edit.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";

describe("EntityBulkEditComponent", () => {
  let component: EntityBulkEditComponent<any>;
  let fixture: ComponentFixture<EntityBulkEditComponent<any>>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EntityBulkEditComponent<any>>>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  const mockEntityConstructor = {
    schema: new Map([
      ["name", { label: "foo" }],
      ["gender", { label: "Male" }],
    ]),
  };

  const mockEntityData = {
    getConstructor: () => mockEntityConstructor,
    formData: {
      name: "Value 1",
      gender: "Value 2",
    },
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
      "extendFormFieldConfig",
    ]);

    await TestBed.configureTestingModule({
      imports: [
        EntityBulkEditComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitiesToEdit: [mockEntityData],
            entityConstructor: mockEntityConstructor,
          },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: EntityFormService, useValue: mockEntityFormService },
        FormBuilder,
        AdminEntityService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityBulkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize selectedField with proper values", () => {
    component.selectedField = { id: "foo", label: "Test Label" };

    component.ngOnInit();
    expect(component.selectedFieldFormControl.value).toBe("");
  });

  it("should fetch and populate entity fields", () => {
    component.fetchEntityFieldsData();

    expect(component.entityFields.length).toBe(2);
    expect(component.entityFields[0].key).toBe("name");
    expect(component.entityFields[0].label).toBe("foo");
  });

  it("should not save if the form is invalid", () => {
    component.selectedFieldFormControl.setValue("");

    component.save();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
