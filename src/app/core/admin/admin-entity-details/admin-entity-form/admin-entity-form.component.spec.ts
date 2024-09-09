import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AdminEntityFormComponent } from "./admin-entity-form.component";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import {
  EntityForm,
  EntityFormService,
} from "../../../common-components/entity-form/entity-form.service";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { of } from "rxjs";
import { AdminModule } from "../../admin.module";
import { FormConfig } from "../../../entity-details/form/form.component";
import { ColumnConfig } from "../../../common-components/entity-form/FormConfig";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { DefaultValueService } from "../../../default-values/default-value.service";

describe("AdminEntityFormComponent", () => {
  let component: AdminEntityFormComponent;
  let fixture: ComponentFixture<AdminEntityFormComponent>;

  let mockFormService: jasmine.SpyObj<EntityFormService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  let testConfig: FormConfig;

  beforeEach(async () => {
    testConfig = {
      fieldGroups: [
        { header: "Group 1", fields: ["name", "other"] },
        { fields: ["category"] },
      ],
    };

    mockFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      imports: [
        AdminModule,
        CoreTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: EntityFormService,
          useValue: mockFormService,
        },
        {
          provide: MatDialog,
          useValue: mockDialog,
        },
        {
          provide: DefaultValueService,
          useValue: jasmine.createSpyObj(["getDefaultValueUiHint"]),
        },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityFormComponent);
    component = fixture.componentInstance;

    component.config = testConfig;
    component.entityType = TestEntity;

    fixture.detectChanges();

    await component.ngOnChanges({ config: true as any });
  });

  it("should create and init a form", () => {
    expect(component).toBeTruthy();

    expect(component.dummyEntity).toBeTruthy();
    expect(component.dummyForm).toBeTruthy();
  });

  it("should load all fields from schema that are not already in form as available fields", async () => {
    const fieldsInView = ["date"];
    component.config = {
      fieldGroups: [{ fields: fieldsInView }],
    };

    await component.ngOnChanges({ config: true as any });

    const noteUserFacingFields = Array.from(TestEntity.schema.entries())
      .filter(([key, value]) => value.label)
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);
    expect(component.availableFields).toEqual([
      component.createNewFieldPlaceholder,
      component.createNewTextPlaceholder,
      ...noteUserFacingFields.filter((x) => !fieldsInView.includes(x)),
    ]);
  });

  function mockDropNewFieldEvent(
    targetContainer: ColumnConfig[],
    previousContainer?: ColumnConfig[],
    previousIndex?: number,
  ) {
    previousContainer = previousContainer ?? component.availableFields;
    previousIndex = previousIndex ?? 0; // "new field" placeholder is always first

    return {
      container: { data: targetContainer },
      currentIndex: 1,
      previousContainer: { data: previousContainer },
      previousIndex: previousIndex,
    } as Partial<CdkDragDrop<ColumnConfig[], ColumnConfig[]>> as CdkDragDrop<
      ColumnConfig[],
      ColumnConfig[]
    >;
  }

  it("should add new field in view if field config dialog succeeds", fakeAsync(() => {
    const newFieldId = "test-created-field";
    mockDialog.open.and.returnValue({
      afterClosed: () => of(newFieldId),
    } as any);

    const targetContainer = component.config.fieldGroups[0].fields;
    component.drop(mockDropNewFieldEvent(targetContainer));
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(targetContainer).toEqual(["name", newFieldId, "other"]);
    expect(component.availableFields).toContain(
      component.createNewFieldPlaceholder,
    );
  }));

  it("should not add new field in view if field config dialog is cancelled", fakeAsync(() => {
    mockDialog.open.and.returnValue({ afterClosed: () => of("") } as any);

    const targetContainer = component.config.fieldGroups[0].fields;
    component.drop(mockDropNewFieldEvent(targetContainer));
    tick();

    expect(targetContainer).toEqual(["name", "other"]);
    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.availableFields).toContain(
      component.createNewFieldPlaceholder,
    );
  }));

  it("should not create field (show dialog) if new field is dropped on toolbar (available fields)", fakeAsync(() => {
    component.drop(mockDropNewFieldEvent(component.availableFields));
    tick();

    expect(mockDialog.open).not.toHaveBeenCalled();
  }));

  it("should create a new fieldGroup in config on dropping field in new-group drop area", fakeAsync(() => {
    const field = component.config.fieldGroups[0].fields[0];
    const dropEvent = mockDropNewFieldEvent(
      null,
      component.config.fieldGroups[0].fields,
      0,
    );
    component.dropNewGroup(dropEvent);
    tick();

    expect(component.config.fieldGroups[2]).toEqual({ fields: [field] });
  }));

  it("should move all fields from removed group to availableFields toolbar", fakeAsync(() => {
    const removedFields = component.config.fieldGroups[0].fields;
    expect(
      removedFields.some((x) => component.availableFields.includes(x)),
    ).not.toBeTrue();

    component.removeGroup(0);
    tick();

    expect(component.config.fieldGroups).toEqual([{ fields: ["category"] }]);
    expect(component.availableFields).toEqual(
      jasmine.arrayContaining(removedFields),
    );
  }));

  it("should hide a single field", fakeAsync(() => {
    const field = "subject";
    const group = component.config.fieldGroups[0];
    component.hideField(field, group);

    expect(component.config.fieldGroups[0].fields).not.toContain(field);
  }));
});
