import { CommonModule } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
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
