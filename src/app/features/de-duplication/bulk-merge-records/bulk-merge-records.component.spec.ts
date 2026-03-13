import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";

describe("BulkMergeRecordsComponent", () => {
  let component: BulkMergeRecordsComponent<TestEntity>;
  let fixture: ComponentFixture<BulkMergeRecordsComponent<TestEntity>>;
  let mockDialogRef: any;
  let mockEntityFormService: any;

  const mergeTestEntity1 = new TestEntity();

  const mergeTestEntity2 = new TestEntity();

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };
    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        EntityFieldViewComponent,
        BulkMergeRecordsComponent,
      ],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entityConstructor: TestEntity,
            entitiesToMerge: [mergeTestEntity1, mergeTestEntity2],
          },
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkMergeRecordsComponent<TestEntity>);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
