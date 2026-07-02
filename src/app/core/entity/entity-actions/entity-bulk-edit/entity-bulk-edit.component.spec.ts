import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityBulkEditComponent } from "./entity-bulk-edit.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../database-entity.decorator";
import { UnsavedChangesService } from "#src/app/core/entity-details/form/unsaved-changes.service";
import type { Mock } from "vitest";
import { Subject } from "rxjs";
import { signal, WritableSignal } from "@angular/core";

type DialogRefMock = {
  beforeClosed: Mock;
  close: Mock;
};

type EntityFormServiceMock = {
  createEntityForm: Mock;
  extendFormFieldConfig: Mock;
};

describe("EntityBulkEditComponent", () => {
  let component: EntityBulkEditComponent<any>;
  let fixture: ComponentFixture<EntityBulkEditComponent<any>>;
  let mockDialogRef: DialogRefMock;
  let mockEntityFormService: EntityFormServiceMock;
  let mockUnsavedChanges: { pending: WritableSignal<boolean> };
  let beforeClosed$: Subject<unknown>;

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
    beforeClosed$ = new Subject();
    mockDialogRef = {
      beforeClosed: vi.fn().mockReturnValue(beforeClosed$.asObservable()),
      close: vi.fn().mockName("MatDialogRef.close"),
    };
    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };
    mockUnsavedChanges = { pending: signal(false) };

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
        { provide: UnsavedChangesService, useValue: mockUnsavedChanges },
        FormBuilder,
        AdminEntityService,
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityBulkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });
  it("should initialize form controls", () => {
    expect(component.selectedFieldFormControl).toBeDefined();
    expect(component.selectedFieldFormControl.validator).toBeDefined();
  });

  it("should initialize selectedField with proper values", () => {
    component.selectedField = { id: "foo", label: "Test Label" };

    component.ngOnInit();
    expect(component.selectedFieldFormControl.value).toBe("");
  });

  it("should not save if the form is invalid", () => {
    component.selectedFieldFormControl.setValue("");

    component.save();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  // The bulk-edit form's unsaved-changes state is now tracked per-form and cleared
  // automatically when the dialog's DestroyRef is destroyed (see EntityFormService),
  // so the component no longer restores a previous global pending state on close.
});
