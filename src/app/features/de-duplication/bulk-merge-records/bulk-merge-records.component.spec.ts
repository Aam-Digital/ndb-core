import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { of, throwError } from "rxjs";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";

@DatabaseEntity("TestEntityWithUserAccountsComp")
class TestEntityWithUserAccounts extends Entity {
  static override readonly enableUserAccounts = true;
}

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
          useValue: {
            getAllRoles: vi.fn().mockReturnValue(of([])),
            getUser: vi
              .fn()
              .mockReturnValue(throwError(() => ({ status: 404 }))),
          },
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
  let fixture: ComponentFixture<BulkMergeRecordsComponent<TestEntity>>;

  const mockFormSetup = {
    createEntityForm: vi.fn().mockResolvedValue({
      formGroup: new FormGroup({}),
    }),
    extendFormFieldConfig: vi.fn(),
  };

  async function setupModule(
    options: {
      getUser?: (id: string) => any;
      entityConstructor?: any;
    } = {},
  ) {
    mockConfirmationDialog = {
      getConfirmation: vi.fn().mockResolvedValue(true),
    };
    mockDialogRef = { close: vi.fn() };

    const entityConstructor =
      options.entityConstructor ?? TestEntityWithUserAccounts;
    const getUser =
      options.getUser ??
      vi.fn().mockReturnValue(throwError(() => ({ status: 404 })));

    await TestBed.configureTestingModule({
      imports: [CommonModule, BulkMergeRecordsComponent],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor,
            entitiesToMerge: [mergeTestEntity1, mergeTestEntity2],
          },
        },
        { provide: EntityFormService, useValue: mockFormSetup },
        {
          provide: UserAdminService,
          useValue: {
            getAllRoles: vi.fn().mockReturnValue(of([])),
            getUser,
          },
        },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkMergeRecordsComponent<TestEntity>);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("should show account warning at submit time when accounts exist", async () => {
    await setupModule({
      getUser: vi.fn().mockImplementation((id: string) => {
        if (id === mergeTestEntity1.getId()) return of(mockAccount);
        return throwError(() => ({ status: 404 }));
      }),
    });

    await fixture.componentInstance.confirmAndMergeRecords();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledWith(
      expect.stringContaining("Warning"),
      expect.any(String),
    );
  });

  it("should return false and not close dialog when user cancels account warning", async () => {
    await setupModule({
      getUser: vi.fn().mockImplementation((id: string) => {
        if (id === mergeTestEntity1.getId()) return of(mockAccount);
        return throwError(() => ({ status: 404 }));
      }),
    });
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

    const result = await fixture.componentInstance.confirmAndMergeRecords();

    expect(result).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it("should close dialog with merged entity when all confirmations are accepted", async () => {
    await setupModule({
      getUser: vi.fn().mockImplementation((id: string) => {
        if (id === mergeTestEntity1.getId()) return of(mockAccount);
        return throwError(() => ({ status: 404 }));
      }),
    });

    await fixture.componentInstance.confirmAndMergeRecords();

    expect(mockDialogRef.close).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should NOT show account warning when no accounts exist", async () => {
    await setupModule();

    await fixture.componentInstance.confirmAndMergeRecords();

    const calls = mockConfirmationDialog.getConfirmation.mock.calls;
    const accountWarningCall = calls.find((c: string[]) =>
      c[0]?.includes("Warning"),
    );
    expect(accountWarningCall).toBeUndefined();
  });

  it("should show accountLoadError confirmation when API failed and entity type supports accounts", async () => {
    await setupModule({
      getUser: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
    });

    await fixture.componentInstance.confirmAndMergeRecords();

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalledWith(
      expect.stringContaining("Warning"),
      expect.stringContaining("account"),
    );
  });

  it("should return false and not close dialog when user cancels accountLoadError confirmation", async () => {
    await setupModule({
      getUser: vi.fn().mockReturnValue(throwError(() => ({ status: 500 }))),
    });
    mockConfirmationDialog.getConfirmation.mockResolvedValue(false);

    const result = await fixture.componentInstance.confirmAndMergeRecords();

    expect(result).toBe(false);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
