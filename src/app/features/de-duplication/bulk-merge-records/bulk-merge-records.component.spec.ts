import { CommonModule } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { of } from "rxjs";

describe("BulkMergeRecordsComponent", () => {
  let mockEntityFormService: any;

  const mergeTestEntity1 = new TestEntity();
  const mergeTestEntity2 = new TestEntity();

  beforeEach(async () => {
    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, BulkMergeRecordsComponent],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor: TestEntity,
            entitiesToMerge: [mergeTestEntity1, mergeTestEntity2],
          },
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
        {
          provide: UserAdminService,
          useValue: { getAllRoles: vi.fn().mockReturnValue(of([])) },
        },
      ],
    }).compileComponents();
  });

  it("should create", () => {
    const fixture = TestBed.createComponent(
      BulkMergeRecordsComponent<TestEntity>,
    );
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe("BulkMergeRecordsComponent account warning", () => {
  const mergeTestEntity1 = new TestEntity();
  const mergeTestEntity2 = new TestEntity();
  const mockAccount = { id: "kc-1", email: "a@test.com", enabled: true };

  let mockConfirmationDialog: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };
    mockDialogRef = { close: vi.fn() };

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
            entityAccounts: [mockAccount, null],
          },
        },
        {
          provide: EntityFormService,
          useValue: {
            createEntityForm: vi.fn().mockResolvedValue({
              formGroup: new FormGroup({}),
            }),
            extendFormFieldConfig: vi.fn(),
          },
        },
        {
          provide: UserAdminService,
          useValue: { getAllRoles: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();
  });

  it("should show account warning at submit time when accounts exist", async () => {
    const fixture = TestBed.createComponent(
      BulkMergeRecordsComponent<TestEntity>,
    );
    await fixture.componentInstance.ngOnInit();

    await fixture.componentInstance.confirmAndMergeRecords();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledWith(
      expect.stringContaining("Warning"),
      expect.any(String),
    );
  });

  it("should return false and not close dialog when user cancels account warning", async () => {
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);
    const fixture = TestBed.createComponent(
      BulkMergeRecordsComponent<TestEntity>,
    );
    await fixture.componentInstance.ngOnInit();

    const result = await fixture.componentInstance.confirmAndMergeRecords();

    expect(result).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
