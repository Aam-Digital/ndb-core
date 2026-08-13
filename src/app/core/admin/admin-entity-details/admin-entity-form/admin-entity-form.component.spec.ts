import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { CdkDrag, CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { By } from "@angular/platform-browser";
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
import {
  AdminEntityFormComponent,
  FieldDropTarget,
} from "./admin-entity-form.component";

type FieldDropEvent = CdkDragDrop<
  FieldDropTarget,
  FieldDropTarget,
  ColumnConfig
>;

describe("AdminEntityFormComponent", () => {
  let component: AdminEntityFormComponent;
  let fixture: ComponentFixture<AdminEntityFormComponent>;

  let mockFormService: any;
  let mockDialog: any;

  let testConfig: FormConfig;

  beforeEach(async () => {
    testConfig = {
      fieldGroups: [
        { header: "Group 1", fields: ["name", "other"] },
        { fields: ["category"] },
      ],
    };

    mockFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
      extendFormFieldConfig: vi
        .fn()
        .mockName("EntityFormService.extendFormFieldConfig"),
    };
    mockFormService.createEntityForm.mockReturnValue(
      Promise.resolve({
        formGroup: new FormGroup({}),
      } as EntityForm<any>),
    );
    mockFormService.extendFormFieldConfig.mockImplementation(
      (field, entityType) => {
        const fieldConfig = toFormFieldConfig(field);
        const schemaField = entityType.schema.get(fieldConfig.id);
        if (schemaField) {
          return { ...schemaField, ...fieldConfig };
        }
        return fieldConfig;
      },
    );
    mockDialog = {
      open: vi.fn().mockName("MatDialog.open"),
    };

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
          useValue: {
            getDefaultValueUiHint: vi.fn(),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("config", testConfig);
    fixture.componentRef.setInput("entityType", TestEntity);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create and init a form", () => {
    expect(component).toBeTruthy();

    expect(component.dummyEntity()).toBeTruthy();
    expect(component.dummyForm()).toBeTruthy();
  });

  it("should load all fields from schema that are not already in form as available fields", async () => {
    const fieldsInView = ["date"];
    fixture.componentRef.setInput("config", {
      fieldGroups: [{ fields: fieldsInView }],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const noteUserFacingFields = Array.from(TestEntity.schema.entries())
      .filter(([key, value]) => !value.isInternalField)
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);
    expect(component.availableFields()).toEqual([
      component.createNewFieldPlaceholder,
      component.createNewTextPlaceholder,
      ...noteUserFacingFields.filter((x) => !fieldsInView.includes(x)),
    ]);
  });

  /**
   * Simulate dropping `field` into the drop list `to` (a field group's index or the toolbar).
   * Drags start from the toolbar unless `from` says otherwise.
   */
  function mockDropEvent(
    field: ColumnConfig,
    to: FieldDropTarget,
    currentIndex = 1,
    from: FieldDropTarget = "available",
    previousIndex = 0,
  ) {
    return {
      item: { data: field },
      container: { data: to },
      currentIndex,
      previousContainer: { data: from },
      previousIndex,
    } as FieldDropEvent;
  }

  it("should add new field in view if field config dialog succeeds", async () => {
    vi.useFakeTimers();
    try {
      const newField = {
        id: "test",
        label: "Test Field",
      };
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(newField),
      } as any);

      component.drop(mockDropEvent(component.createNewFieldPlaceholder, 0));
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.fieldGroups()[0].fields).toEqual([
        "name",
        newField.id,
        "other",
      ]);
      expect(component.availableFields()).toContain(
        component.createNewFieldPlaceholder,
      );
      // the new field is in the form now, so it is no longer offered in the toolbar
      expect(component.availableFields()).not.toContain(newField.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not add new field in view if field config dialog is cancelled", async () => {
    vi.useFakeTimers();
    try {
      mockDialog.open.mockReturnValue({ afterClosed: () => of("") } as any);

      component.drop(mockDropEvent(component.createNewFieldPlaceholder, 0));
      await vi.advanceTimersByTimeAsync(0);

      expect(component.fieldGroups()[0].fields).toEqual(["name", "other"]);
      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.availableFields()).toContain(
        component.createNewFieldPlaceholder,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not create field (show dialog) if new field is dropped on toolbar (available fields)", async () => {
    vi.useFakeTimers();
    try {
      component.drop(
        mockDropEvent(component.createNewFieldPlaceholder, "available"),
      );
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDialog.open).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create a new fieldGroup in config on dropping field in new-group drop area", async () => {
    vi.useFakeTimers();
    try {
      const field = component.fieldGroups()[0].fields[0];
      component.dropNewGroup(mockDropEvent(field, undefined, 0, 0, 0));
      await vi.advanceTimersByTimeAsync(0);

      expect(component.fieldGroups()[2]).toEqual({ fields: [field] });
      // the field has moved, so it is gone from the group it was dragged out of
      expect(component.fieldGroups()[0].fields).toEqual(["other"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should move a field from one group into another", async () => {
    await component.drop(mockDropEvent("name", 1, 0, 0, 0));

    expect(component.fieldGroups()).toEqual([
      { header: "Group 1", fields: ["other"] },
      { fields: ["name", "category"] },
    ]);
  });

  it("should reorder fields within a group", async () => {
    await component.drop(mockDropEvent("name", 0, 1, 0, 0));

    expect(component.fieldGroups()[0].fields).toEqual(["other", "name"]);
  });

  it("should remove a field from the form when dropped back into the toolbar", async () => {
    await component.drop(mockDropEvent("name", "available", 0, 0, 0));

    expect(component.fieldGroups()[0].fields).toEqual(["other"]);
    expect(component.availableFields()).toContain("name");
  });

  it("should not mutate the config input when fields are moved", async () => {
    const configBefore = JSON.stringify(testConfig);

    await component.drop(mockDropEvent("name", 1, 0, 0, 0));

    expect(JSON.stringify(testConfig)).toBe(configBefore);
  });

  it("should keep a field that only overwrites some settings unchanged while rendering the preview", async () => {
    // the preview is rendered before the dummy entity is available,
    // so the field config must not be completed with details from its schema
    const partiallyOverwrittenField = {
      id: "name",
      displayFullLengthLabel: true,
    };
    const previewFixture = TestBed.createComponent(AdminEntityFormComponent);
    previewFixture.componentRef.setInput("config", {
      fieldGroups: [{ fields: [partiallyOverwrittenField, "other"] }],
    });
    previewFixture.componentRef.setInput("entityType", TestEntity);

    previewFixture.detectChanges();
    await previewFixture.whenStable();

    expect(previewFixture.componentInstance.fieldGroups()[0].fields[0]).toEqual(
      {
        id: "name",
        displayFullLengthLabel: true,
      },
    );
  });

  it("should reorder the field groups", () => {
    component.dropFieldGroups({
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<unknown>);

    expect(component.fieldGroups()).toEqual([
      { fields: ["category"] },
      { header: "Group 1", fields: ["name", "other"] },
    ]);
  });

  it("should identify each fields drop list by the target a drop applies to", () => {
    const dropListData = fixture.debugElement
      .queryAll(By.directive(CdkDropList))
      .map((el) => el.injector.get(CdkDropList).data);

    // the outer list only reorders the groups themselves and needs no target;
    // the two group lists and the toolbar identify where a dropped field goes
    expect(dropListData).toEqual([undefined, 0, 1, undefined, "available"]);
  });

  it("should connect the toolbar, so fields can be dragged out of the form again", () => {
    const dropLists = fixture.debugElement
      .queryAll(By.directive(CdkDropList))
      .map((el) => el.injector.get(CdkDropList));
    const toolbar = dropLists.find((list) => list.data === "available");
    const fieldGroups = dropLists.filter(
      (list) => typeof list.data === "number",
    );

    expect(toolbar.id).toBe(component.availableFieldsDropListId());
    for (const group of fieldGroups) {
      expect(group.connectedTo).toContain(toolbar.id);
    }
  });

  it("should attach each field to its drag, so a drop knows what was moved", () => {
    const draggedFields = fixture.debugElement
      .queryAll(By.css(".admin-form-field"))
      .map((el) => el.injector.get(CdkDrag).data);

    expect(draggedFields).toEqual(
      expect.arrayContaining([
        "name",
        "other",
        "category",
        component.createNewFieldPlaceholder,
        component.createNewTextPlaceholder,
      ]),
    );
  });

  it("should move all fields from removed group to availableFields toolbar", async () => {
    vi.useFakeTimers();
    try {
      const removedFields = component.config().fieldGroups[0].fields;
      expect(
        removedFields.some((x) => component.availableFields().includes(x)),
      ).not.toBe(true);

      component.removeGroup(0);
      await vi.advanceTimersByTimeAsync(0);

      expect(component.fieldGroups()).toEqual([{ fields: ["category"] }]);
      expect(component.availableFields()).toEqual(
        expect.arrayContaining(removedFields),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should hide a single field", async () => {
    const field = "subject";
    const group = component.config().fieldGroups[0];
    component.hideField(field, group);

    expect(component.config().fieldGroups[0].fields).not.toContain(field);
  });

  it("should update the global schema when updateEntitySchema is true", async () => {
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput("updateEntitySchema", true);
      const field = { id: "test", label: "Test Field" } as any;
      vi.spyOn(component, "openFieldConfig").mockReturnValue(
        Promise.resolve(field),
      );
      const adminEntityService = TestBed.inject(AdminEntityService);
      vi.spyOn(adminEntityService, "updateSchemaField");
      component.openConfigDetails("category" as any);
      await vi.advanceTimersByTimeAsync(0);

      expect(adminEntityService.updateSchemaField).toHaveBeenCalledWith(
        TestEntity,
        "test",
        field,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should filter fields by field ID and label when searching", async () => {
    TestEntity.schema.set("uniqueTestFieldId", {
      label: "Special Label",
      dataType: "text",
    });
    TestEntity.schema.set("anotherFieldForTest", {
      label: "Another Label",
      dataType: "text",
    });

    try {
      fixture.componentRef.setInput("config", {
        fieldGroups: [{ fields: ["other"] }],
      });

      fixture.detectChanges();
      await fixture.whenStable();

      // Test filtering by field ID
      component.searchFilter.setValue("uniqueTest");
      fixture.detectChanges();

      let filteredFields = component.filteredFields();
      let nonPlaceholderFields = filteredFields.filter(
        (f) =>
          f !== component.createNewFieldPlaceholder &&
          f !== component.createNewTextPlaceholder,
      );

      expect(nonPlaceholderFields).toContain("uniqueTestFieldId");
      expect(nonPlaceholderFields).not.toContain("name");
      expect(nonPlaceholderFields).not.toContain("category");
      expect(nonPlaceholderFields).not.toContain("anotherFieldForTest");

      // Test filtering by label
      component.searchFilter.setValue("Special Label");
      fixture.detectChanges();

      filteredFields = component.filteredFields();
      nonPlaceholderFields = filteredFields.filter(
        (f) =>
          f !== component.createNewFieldPlaceholder &&
          f !== component.createNewTextPlaceholder,
      );

      expect(nonPlaceholderFields).toContain("uniqueTestFieldId");
      expect(nonPlaceholderFields).not.toContain("name");
      expect(nonPlaceholderFields).not.toContain("category");
      expect(nonPlaceholderFields).not.toContain("anotherFieldForTest");
    } finally {
      TestEntity.schema.delete("uniqueTestFieldId");
      TestEntity.schema.delete("anotherFieldForTest");
    }
  });

  it("should keep the group header input while typing, without rebuilding the form", async () => {
    // the parent (e.g. AdminEntityDetailsComponent) feeds the emitted config back into the input
    component.configChange.subscribe((newConfig) =>
      fixture.componentRef.setInput("config", newConfig),
    );
    const getHeaderInput = () =>
      fixture.nativeElement.querySelector(
        "app-admin-section-header input",
      ) as HTMLInputElement;

    const inputBefore = getHeaderInput();
    inputBefore.focus();
    const createFormCallsBefore =
      mockFormService.createEntityForm.mock.calls.length;

    inputBefore.value = "Group 1x";
    inputBefore.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getHeaderInput()).toBe(inputBefore);
    expect(document.activeElement).toBe(inputBefore);
    expect(component.fieldGroups()[0].header).toBe("Group 1x");
    expect(mockFormService.createEntityForm.mock.calls.length).toBe(
      createFormCallsBefore,
    );
  });

  it("should update the preview of a field whose schema was changed", async () => {
    vi.useFakeTimers();
    const originalSchema = TestEntity.schema.get("name");
    try {
      const previewLabels = () =>
        fixture.debugElement
          .queryAll(By.css("app-entity-field-edit"))
          .map((field) => field.componentInstance._field()?.label);
      fixture.detectChanges();
      expect(previewLabels()).toContain("Name");

      TestBed.inject(AdminEntityService).updateSchemaField(TestEntity, "name", {
        ...originalSchema,
        label: "Full Legal Title",
      });
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();

      expect(previewLabels()).toContain("Full Legal Title");
    } finally {
      TestEntity.schema.set("name", originalSchema);
      vi.useRealTimers();
    }
  });

  it("should prefill label when creating new field with search text", async () => {
    vi.useFakeTimers();
    try {
      component.searchFilter.setValue("testField");
      mockDialog.open.mockReturnValue({
        afterClosed: () => of({ id: "testField" }),
      } as any);

      component.openFieldConfig(component.createNewFieldPlaceholder);
      await vi.advanceTimersByTimeAsync(0);

      const dialogData = vi.mocked(mockDialog.open).mock.lastCall[1]
        .data as any;
      expect(dialogData.entitySchemaField.label).toBe("testField");
      expect(dialogData.entitySchemaField.id).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
