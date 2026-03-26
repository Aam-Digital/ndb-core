import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { of, throwError } from "rxjs";

describe("BulkMergeRecordsComponent", () => {
  let component: BulkMergeRecordsComponent<TestEntity>;
  let mockDialogRef: any;
  let mockEntityFormService: any;
  let mockUserAdminService: any;
  let mockConfirmationDialog: any;

  const mergeTestEntity1 = new TestEntity();
  const mergeTestEntity2 = new TestEntity();
  const mockAccount0 = {
    id: "kc-1",
    email: "a@test.com",
    enabled: true,
    roles: [{ id: "role-1", name: "Admin" }],
  };
  const mockAccount1 = {
    id: "kc-2",
    email: "b@test.com",
    enabled: true,
    roles: [{ id: "role-2", name: "User" }],
  };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };
    mockUserAdminService = {
      getAllRoles: vi.fn().mockReturnValue(
        of([
          { id: "role-1", name: "Admin" },
          { id: "role-2", name: "User" },
        ]),
      ),
      updateUser: vi.fn().mockReturnValue(of({ userUpdated: true })),
    };
    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, BulkMergeRecordsComponent],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor: TestEntity,
            entitiesToMerge: [mergeTestEntity1, mergeTestEntity2],
            entityAccounts: [mockAccount0, mockAccount1],
          },
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
        { provide: UserAdminService, useValue: mockUserAdminService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      BulkMergeRecordsComponent<TestEntity>,
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use fallback roles from accounts when getAllRoles fails", async () => {
    mockUserAdminService.getAllRoles.mockReturnValue(
      throwError(() => new Error("network error")),
    );
    await component.ngOnInit();

    expect(component.availableRoles).toEqual([
      { id: "role-1", name: "Admin" },
      { id: "role-2", name: "User" },
    ]);
  });

  it("should pre-select the email from the account at index 0 by default", async () => {
    await component.ngOnInit();

    expect(component.selectedAccountEmailIndex).toBe(0);
  });

  it("should call updateUser with changed email and close dialog on confirm", async () => {
    mockEntityFormService.createEntityForm.mockResolvedValue({
      formGroup: {
        invalid: false,
        markAllAsTouched: vi.fn(),
        value: {},
      },
    });
    await component.ngOnInit();

    component.accountEmailControl.setValue("new@test.com");
    component.accountEmailControl.markAsDirty();
    component.accountForm!.markAsDirty();

    await component.confirmAndMergeRecords();

    expect(mockUserAdminService.updateUser).toHaveBeenCalledWith(
      mockAccount0.id,
      expect.objectContaining({ email: "new@test.com" }),
    );
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
