import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { EntityFieldViewComponent } from "app/core/common-components/entity-field-view/entity-field-view.component";
import { Entity } from "app/core/entity/model/entity";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntityFormService } from "app/core/common-components/entity-form/entity-form.service";

class TestEntity extends Entity {
  static override schema = new Map<string, EntitySchemaField>([
    ["name", { label: "Name", dataType: "string" }],
    ["age", { label: "Age", dataType: "number" }],
  ]);

  name: string;
  age: number;
  id: string;

  constructor() {
    super();
  }
}

describe("BulkMergeRecordsComponent", () => {
  let component: BulkMergeRecordsComponent<TestEntity>;
  let fixture: ComponentFixture<BulkMergeRecordsComponent<TestEntity>>;
  let mockDialogRef: jasmine.SpyObj<
    MatDialogRef<BulkMergeRecordsComponent<TestEntity>>
  >;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  const entityA = new TestEntity();
  entityA.name = "Entity A";
  entityA.age = 25;
  entityA.id = "123";

  const entityB = new TestEntity();
  entityB.name = "Entity B";
  entityB.age = 30;
  entityB.id = "456";

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
            entitiesToMerge: [entityA, entityB],
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

  it("should update mergedEntity on form changes", () => {
    component.mergeForm.get("name").setValue("New Name");
    component.mergeForm.get("age").setValue(35);

    expect(component.mergedEntity.name).toBe("New Name");
    expect(component.mergedEntity.age).toBe(35);
  });
});
