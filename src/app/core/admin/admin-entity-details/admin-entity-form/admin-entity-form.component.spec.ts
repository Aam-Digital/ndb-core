import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { of } from "rxjs";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import {
  ColumnConfig,
  toFormFieldConfig,
} from "../../../common-components/entity-form/FormConfig";
import { DefaultValueService } from "../../../default-values/default-value-service/default-value.service";
import { FormConfig } from "../../../entity-details/form/form.component";
import { AdminEntityService } from "../../admin-entity.service";
import { AdminModule } from "../../admin.module";
import { AdminEntityFormComponent } from "./admin-entity-form.component";

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
      "extendFormFieldConfig",
    ]);
    mockFormService.createEntityForm.and.returnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );
    mockFormService.extendFormFieldConfig.and.callFake((field) =>
      toFormFieldConfig(field),
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

    await component.ngOnChanges({ config: true as any });
    fixture.detectChanges();
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
      .filter(([key, value]) => !value.isInternalField)
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
    const newField = {
      id: "test",
      label: "Test Field",
    };
    mockDialog.open.and.returnValue({
      afterClosed: () => of(newField),
    } as any);

    const targetContainer = component.config.fieldGroups[0].fields;
    component.drop(mockDropNewFieldEvent(targetContainer));
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(targetContainer).toEqual(["name", newField.id, "other"]);
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

  it("should update the global schema when updateEntitySchema is true", fakeAsync(async () => {
    component.updateEntitySchema = true;
    const field = { id: "test", label: "Test Field" } as any;
    spyOn(component, "openFieldConfig").and.returnValue(Promise.resolve(field));
    const adminEntityService = TestBed.inject(AdminEntityService);
    spyOn(adminEntityService, "updateSchemaField");
    await component.openConfigDetails("category" as any);
    tick();

    expect(adminEntityService.updateSchemaField).toHaveBeenCalledWith(
      TestEntity,
      "test",
      field,
    );
  }));

  it("should filter fields by field ID and label when searching", async () => {
    component.config = {
      fieldGroups: [{ fields: ["other"] }],
    };
    await component.ngOnChanges({ config: true as any });

    //filtering by field ID
    component.searchFilter.setValue("nam");
    fixture.detectChanges();

    let filteredFields = component.filteredFields();
    let nonPlaceholderFields = filteredFields.filter(
      (f) =>
        f !== component.createNewFieldPlaceholder &&
        f !== component.createNewTextPlaceholder,
    );

    expect(nonPlaceholderFields).toContain("name");
    expect(nonPlaceholderFields).not.toContain("category");

    //filtering by label
    component.searchFilter.setValue("Date");
    fixture.detectChanges();

    filteredFields = component.filteredFields();
    nonPlaceholderFields = filteredFields.filter(
      (f) =>
        f !== component.createNewFieldPlaceholder &&
        f !== component.createNewTextPlaceholder,
    );

    expect(nonPlaceholderFields).toContain("dateOfBirth");
    expect(nonPlaceholderFields).not.toContain("name");
    expect(nonPlaceholderFields).not.toContain("category");
  });

  it("should prefill label when creating new field with search text", fakeAsync(() => {
    component.searchFilter.setValue("testField");
    mockDialog.open.and.returnValue({
      afterClosed: () => of({ id: "testField" }),
    } as any);

    component.openFieldConfig(component.createNewFieldPlaceholder);
    tick();

    const dialogData = mockDialog.open.calls.mostRecent().args[1].data as any;
    expect(dialogData.entitySchemaField.label).toBe("testField");
    expect(dialogData.entitySchemaField.id).toBeNull();
  }));
});
