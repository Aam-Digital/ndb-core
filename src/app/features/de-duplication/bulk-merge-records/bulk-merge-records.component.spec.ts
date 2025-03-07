import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";
import { TestEntity } from "app/utils/test-utils/TestEntity";

describe("BulkMergeRecordsComponent", () => {
  let component: BulkMergeRecordsComponent<TestEntity>;
  let fixture: ComponentFixture<BulkMergeRecordsComponent<TestEntity>>;
  let mockDialogRef: jasmine.SpyObj<
    MatDialogRef<BulkMergeRecordsComponent<TestEntity>>
  >;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  const mergeTestEntity1 = new TestEntity();

  const mergeTestEntity2 = new TestEntity();

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj(["close"]);
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
      "extendFormFieldConfig",
    ]);
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
