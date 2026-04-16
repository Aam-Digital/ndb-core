import { TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormService } from "./entity-form.service";
import {
  EntityForm,
  EntityFormGroup,
} from "#src/app/core/common-components/entity-form/entity-form";
import {
  FormControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { Entity } from "../../entity/model/entity";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { InvalidFormFieldError } from "./invalid-form-field.error";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";
import { Router } from "@angular/router";
import { NotFoundComponent } from "../../config/dynamic-routing/not-found/not-found.component";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "./FormConfig";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import moment from "moment";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EventEmitter } from "@angular/core";

describe("EntityFormService", () => {
  let service: EntityFormService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    service = TestBed.inject(EntityFormService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should not save invalid entities", async () => {
    const entity = new Entity("initialId");
    const copyEntity = entity.copy();
    vi.spyOn(entity, "copy").mockReturnValue(copyEntity);
    vi.spyOn(copyEntity, "assertValid").mockImplementation(() => {
      throw new Error();
    });

    const formGroup = new UntypedFormGroup({
      _id: new FormControl("newId"),
    });
    const entityForm = createMockEntityForm(entity, formGroup);

    await expect(service.saveChanges(entityForm, entity)).rejects.toThrow();
    expect(entity.getId()).not.toBe(`${Entity.ENTITY_TYPE}:newId`);
  });

  it("should update entity if saving is successful", async () => {
    const entity = new Entity("initialId");
    const formGroup = new UntypedFormGroup({
      _id: new UntypedFormControl(`${Entity.ENTITY_TYPE}:newId`),
    });
    const entityForm = createMockEntityForm(entity, formGroup);
    TestBed.inject(EntityAbility).update([
      { subject: "Entity", action: "create" },
    ]);

    await service.saveChanges(entityForm, entity);

    expect(entity.getId()).toBe(`${Entity.ENTITY_TYPE}:newId`);
  });

  it("should mark form pristine and disable it after saving", async () => {
    const entity = new Entity("initialId");
    const formGroup = new UntypedFormGroup({
      _id: new UntypedFormControl(`${Entity.ENTITY_TYPE}:newId`),
    });
    TestBed.inject(EntityAbility).update([
      { subject: "Entity", action: "create" },
    ]);
    const entityForm = createMockEntityForm(entity, formGroup);

    await service.saveChanges(entityForm, entity);

    expect(formGroup.pristine).toBe(true);
    // form status change is needed for EditFileComponent to start file upload, for example
    expect(formGroup.disabled).toBe(true);
  });

  it("should show actionable guidance for known multi-tab IndexedDB errors", async () => {
    const entity = new Entity("initialId");
    const formGroup = new UntypedFormGroup({
      _id: new UntypedFormControl(`${Entity.ENTITY_TYPE}:newId`),
    });
    const entityForm = createMockEntityForm(entity, formGroup);
    TestBed.inject(EntityAbility).update([
      { subject: "Entity", action: "create" },
    ]);

    vi.spyOn(TestBed.inject(EntityMapperService), "save").mockRejectedValueOnce(
      new Error(
        "unknown_error: Database encountered an unknown error ConstraintError: Unable to add key to index 'seq'",
      ),
    );

    await expect(service.saveChanges(entityForm, entity)).rejects.toThrow(
      "Please close other tabs and reload this page",
    );
  });

  it("should throw an error when trying to create a entity with missing permissions", async () => {
    TestBed.inject(EntityAbility).update([
      { subject: "all", action: "manage" },
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "create",
        inverted: true,
        conditions: { name: "un-permitted entity" },
      },
    ]);
    const school = new TestEntity();

    const formGroup = new UntypedFormGroup({
      name: new UntypedFormControl("normal school"),
    });
    const entityForm = createMockEntityForm(school, formGroup);

    await service.saveChanges(entityForm, school);
    expect(school.name).toBe("normal school");

    formGroup.patchValue({ name: "un-permitted entity" });
    const result = service.saveChanges(entityForm, school);
    await expect(result).rejects.toThrow();
    expect(school.name).toBe("normal school");
  });

  it("should create forms with the validators included", async () => {
    TestEntity.schema.set("result", {
      validators: { min: 0, max: 100, required: true },
    });

    const formFields = [{ id: "name" }, { id: "result" }];
    const form = await service.createEntityForm(formFields, new TestEntity());

    expect(form.formGroup.valid).toBe(false);

    // @ts-ignore "result" field was temporarily added for this test
    form.formGroup.patchValue({ result: 100 });
    expect(form.formGroup.valid).toBe(true);

    // @ts-ignore "result" field was temporarily added for this test
    form.formGroup.patchValue({ result: 101 });
    expect(form.formGroup.valid).toBe(false);

    TestEntity.schema.delete("result");
  });

  it("should use create permissions to disable fields when creating a new entity", async () => {
    const formFields = [{ id: "name" }, { id: "dateOfBirth" }];
    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "read",
        fields: ["name", "dateOfBirth"],
      },
      { subject: TestEntity.ENTITY_TYPE, action: "update", fields: ["name"] },
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "create",
        fields: ["dateOfBirth"],
      },
    ]);

    const formGroup = await service.createEntityForm(
      formFields,
      new TestEntity(),
    );

    expect(formGroup.formGroup.get("name").disabled).toBe(true);
    expect(formGroup.formGroup.get("dateOfBirth").enabled).toBe(true);
  });

  it("should always keep properties disabled if user does not have 'update' permissions for them", async () => {
    const formFields = [{ id: "name" }, { id: "dateOfBirth" }];
    TestBed.inject(EntityAbility).update([
      {
        subject: TestEntity.ENTITY_TYPE,
        action: "read",
        fields: ["name", "dateOfBirth"],
      },
      { subject: TestEntity.ENTITY_TYPE, action: "update", fields: ["name"] },
    ]);

    const child = new TestEntity();
    child._rev = "foo"; // "not new" state

    const form = await service.createEntityForm(formFields, child);

    expect(form.formGroup.get("name").enabled).toBe(true);
    expect(form.formGroup.get("dateOfBirth").disabled).toBe(true);

    form.formGroup.disable();

    expect(form.formGroup.get("name").disabled).toBe(true);
    expect(form.formGroup.get("dateOfBirth").disabled).toBe(true);

    form.formGroup.enable();

    expect(form.formGroup.get("name").enabled).toBe(true);
    expect(form.formGroup.get("dateOfBirth").disabled).toBe(true);
  });

  it("should create a error if form is invalid", async () => {
    const formFields = [{ id: "schoolId" }, { id: "start" }];
    const form = await service.createEntityForm(
      formFields,
      new ChildSchoolRelation(),
    );

    return expect(
      service.saveChanges(form, new ChildSchoolRelation()),
    ).rejects.toEqual(expect.any(InvalidFormFieldError));
  });

  it("should set pending changes once a form is edited and reset it once saved or canceled", async () => {
    const formFields = [{ id: "inactive" }];
    const form = await service.createEntityForm(formFields, new Entity());
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    form.formGroup.markAsDirty();
    form.formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBe(true);

    TestBed.inject(EntityAbility).update([
      { action: "manage", subject: "all" },
    ]);
    await service.saveChanges(form, new Entity());

    expect(unsavedChanges.pending).toBe(false);

    form.formGroup.markAsDirty();
    form.formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBe(true);

    service.resetForm(form, new Entity());

    expect(unsavedChanges.pending).toBe(false);
  });

  it("should disable fields that have readonlyAfterSet validator and have a value", async () => {
    const formFields = [{ id: "name", validators: { readonlyAfterSet: true } }];
    const formWithNewEntity = await service.createEntityForm(
      formFields,
      new TestEntity(),
    );
    formWithNewEntity.formGroup.controls["name"].setValue("test");
    // should not disable while still editing the first time
    expect(formWithNewEntity.formGroup.get("name").disabled).toBe(false);

    const formWithExistingEntity = await service.createEntityForm(
      formFields,
      TestEntity.create({ name: "existing name", _rev: "1" }),
    );
    expect(formWithExistingEntity.formGroup.get("name").disabled).toBe(true);
  });

  it("should reset form on cancel, including special fields with getter", async () => {
    class MockEntity extends Entity {
      @DatabaseField()
      simpleField = "original";

      @DatabaseField()
      get getterField(): string {
        return this._getterValue;
      }

      set getterField(value) {
        this._getterValue = value;
      }

      private _getterValue: string = "original value";

      @DatabaseField()
      emptyField;
    }

    const formFields = ["simpleField", "getterField", "emptyField"];
    const mockEntity = new MockEntity();
    const form = await service.createEntityForm(formFields, mockEntity);

    form.formGroup.get("simpleField").setValue("new");
    form.formGroup.get("getterField").setValue("new value");
    form.formGroup.get("emptyField").setValue("value");

    service.resetForm(form, mockEntity);

    expect(form.formGroup.get("simpleField").value).toBe("original");
    expect(form.formGroup.get("getterField").value).toBe("original value");
    expect(form.formGroup.get("emptyField").value).toBeUndefined();
  });

  it("should reset state once navigation happens", async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: "test", component: NotFoundComponent }]);
    const unsavedChanged = TestBed.inject(UnsavedChangesService);
    const formFields = [{ id: "inactive" }];
    const formGroup = await service.createEntityForm(formFields, new Entity());
    formGroup.formGroup.markAsDirty();
    formGroup.formGroup.get("inactive").setValue(true);

    expect(unsavedChanged.pending).toBe(true);

    await router.navigate(["test"]);

    expect(unsavedChanged.pending).toBe(false);

    // Changes are not listened to anymore
    formGroup.formGroup.markAsDirty();
    formGroup.formGroup.get("inactive").setValue(true);

    expect(unsavedChanged.pending).toBe(false);
  });

  it("should assign default values", async () => {
    const schema: EntitySchemaField = {
      defaultValue: {
        mode: "static",
        config: { value: 1 },
      },
    };
    TestEntity.schema.set("test", schema);

    let form = await service.createEntityForm(
      [{ id: "test" }],
      new TestEntity(),
    );
    expect(form.formGroup.get("test").value).toEqual(1);

    schema.defaultValue = {
      mode: "dynamic",
      config: { value: PLACEHOLDERS.NOW },
    };

    form = await service.createEntityForm([{ id: "test" }], new TestEntity());
    expect(
      moment(form.formGroup.get("test").value).isSame(moment(), "minutes"),
    ).toBe(true);

    schema.defaultValue = {
      mode: "dynamic",
      config: { value: PLACEHOLDERS.CURRENT_USER },
    };
    form = await service.createEntityForm([{ id: "test" }], new TestEntity());
    expect(form.formGroup.get("test").value).toEqual(
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    );

    schema.dataType = EntityDatatype.dataType;
    schema.isArray = true;
    form = await service.createEntityForm([{ id: "test" }], new TestEntity());
    expect(form.formGroup.get("test").value).toEqual([
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    ]);

    TestEntity.schema.delete("test");
  });

  it("should allow creating a form without applying default values", async () => {
    TestEntity.schema.set("test", {
      defaultValue: {
        mode: "static",
        config: { value: 1 },
      },
    });

    const form = await service.createEntityForm(
      [{ id: "test" }],
      new TestEntity(),
      false,
      true,
      false,
    );
    expect(form.formGroup.get("test").value).toEqual(null);

    TestEntity.schema.delete("test");
  });

  it("should not fail if user entity does not exist and current user value is assigned", async () => {
    TestBed.inject(CurrentUserSubject).next(undefined);

    // simple property
    TestEntity.schema.set("user", {
      defaultValue: {
        mode: "dynamic",
        config: { value: PLACEHOLDERS.CURRENT_USER },
      },
    });
    let form = await service.createEntityForm(
      [{ id: "user" }],
      new TestEntity(),
    );
    expect(form.formGroup.get("user").value).toEqual(null);

    // array property
    TestEntity.schema.get("user").dataType = EntityDatatype.dataType;
    TestEntity.schema.get("user").isArray = true;
    form = await service.createEntityForm([{ id: "user" }], new TestEntity());
    expect(form.formGroup.get("user").value).toEqual(null);

    TestEntity.schema.delete("user");
  });

  it("should not assign default values to existing entities", async () => {
    TestEntity.schema.set("test", {
      defaultValue: {
        mode: "static",
        config: { value: 1 },
      },
    });

    const entity = new TestEntity();
    entity._rev = "1-existing_entity";
    const form = await service.createEntityForm([{ id: "test" }], entity);
    expect(form.formGroup.get("test").value).toEqual(null);

    TestEntity.schema.delete("test");
  });

  it("should not overwrite existing values with default value", async () => {
    TestEntity.schema.set("test", {
      defaultValue: {
        mode: "static",
        config: { value: 1 },
      },
    });

    const entity = new TestEntity();
    entity["test"] = 2;
    const form = await service.createEntityForm([{ id: "test" }], entity);
    expect(form.formGroup.get("test").value).toEqual(2);

    TestEntity.schema.delete("test");
  });

  it("should not save 'null' as value from empty form fields", async () => {
    TestEntity.schema.set("test", { dataType: "string" });

    const entity = new TestEntity();
    const form = await service.createEntityForm([{ id: "test" }], entity);
    form.formGroup.get("test").reset();
    expect(form.formGroup.get("test").getRawValue()).toEqual(null);

    await service.saveChanges(form, entity);

    const entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    const actualSaved = entityMapper.get(entity.getType(), entity.getId());
    expect(actualSaved).toEqual(entity);
    // service should remove 'null' value, which are the default for empty form fields
    expect(actualSaved["test"]).not.toEqual(null);

    TestEntity.schema.delete("test");
  });

  it("should add column definitions from property schema", () => {
    class Test extends Entity {
      @DatabaseField({
        description: "Property description",
        additional: "someAdditional",
      })
      propertyField: string;
    }

    vi.spyOn(
      TestBed.inject(EntitySchemaService),
      "getComponent",
    ).mockReturnValue("PredefinedComponent");
    const entity = new Test();
    const field1: FormFieldConfig = {
      id: "fieldWithDefinition",
      editComponent: "EditComponent",
      viewComponent: "DisplayComponent",
      label: "Field with definition",
      description: "Custom tooltip",
      additional: "additional",
    };
    const field2: FormFieldConfig = { id: "propertyField", label: "Property" };

    const result1 = service.extendFormFieldConfig(
      field1,
      entity.getConstructor(),
    );
    const result2 = service.extendFormFieldConfig(
      field2,
      entity.getConstructor(),
    );

    expect(result1).toEqual({
      id: "fieldWithDefinition",
      editComponent: "EditComponent",
      viewComponent: "DisplayComponent",
      label: "Field with definition",
      forTable: false,
      description: "Custom tooltip",
      additional: "additional",
    } as FormFieldConfig);
    expect(result2).toEqual({
      id: "propertyField",
      dataType: "string",
      editComponent: "PredefinedComponent",
      viewComponent: "PredefinedComponent",
      label: "Property",
      forTable: false,
      description: "Property description",
      additional: "someAdditional",
    } as FormFieldConfig);
  });

  function createMockEntityForm<T extends Entity>(
    entity: T,
    formGroup: UntypedFormGroup,
  ): EntityForm<T> {
    return {
      formGroup: formGroup as EntityFormGroup<typeof entity>,
      entity: entity,
      fieldConfigs: [],
      onFormStateChange: new EventEmitter(),
      onSave: vi.fn(),
    } as unknown as EntityForm<T>;
  }
});
