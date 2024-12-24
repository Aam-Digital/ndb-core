import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import {
  EntityForm,
  EntityFormGroup,
  EntityFormService,
} from "./entity-form.service";
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
    spyOn(entity, "copy").and.returnValue(copyEntity);
    spyOn(copyEntity, "assertValid").and.throwError(new Error());

    const formGroup = new UntypedFormGroup({
      _id: new FormControl("newId"),
    });
    const entityForm = createMockEntityForm(entity, formGroup);

    await expectAsync(service.saveChanges(entityForm, entity)).toBeRejected();
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

    expect(formGroup.pristine).toBeTrue();
    // form status change is needed for EditFileComponent to start file upload, for example
    expect(formGroup.disabled).toBeTrue();
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
    await expectAsync(result).toBeRejected();
    expect(school.name).toBe("normal school");
  });

  it("should create forms with the validators included", async () => {
    TestEntity.schema.set("result", {
      validators: { min: 0, max: 100, required: true },
    });

    const formFields = [{ id: "name" }, { id: "result" }];
    const form = await service.createEntityForm(formFields, new TestEntity());

    expect(form.formGroup.valid).toBeFalse();

    // @ts-ignore "result" field was temporarily added for this test
    form.formGroup.patchValue({ result: 100 });
    expect(form.formGroup.valid).toBeTrue();

    // @ts-ignore "result" field was temporarily added for this test
    form.formGroup.patchValue({ result: 101 });
    expect(form.formGroup.valid).toBeFalse();

    TestEntity.schema.delete("result");
  });

  it("should use create permissions to disable fields when creating a new entity", fakeAsync(async () => {
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
    tick();

    expect(formGroup.formGroup.get("name").disabled).toBeTrue();
    expect(formGroup.formGroup.get("dateOfBirth").enabled).toBeTrue();
  }));

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

    expect(form.formGroup.get("name").enabled).toBeTrue();
    expect(form.formGroup.get("dateOfBirth").disabled).toBeTrue();

    form.formGroup.disable();

    expect(form.formGroup.get("name").disabled).toBeTrue();
    expect(form.formGroup.get("dateOfBirth").disabled).toBeTrue();

    form.formGroup.enable();

    expect(form.formGroup.get("name").enabled).toBeTrue();
    expect(form.formGroup.get("dateOfBirth").disabled).toBeTrue();
  });

  it("should create a error if form is invalid", async () => {
    const formFields = [{ id: "schoolId" }, { id: "start" }];
    const form = await service.createEntityForm(
      formFields,
      new ChildSchoolRelation(),
    );

    return expectAsync(
      service.saveChanges(form, new ChildSchoolRelation()),
    ).toBeRejectedWith(jasmine.any(InvalidFormFieldError));
  });

  it("should set pending changes once a form is edited and reset it once saved or canceled", async () => {
    const formFields = [{ id: "inactive" }];
    const form = await service.createEntityForm(formFields, new Entity());
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    form.formGroup.markAsDirty();
    form.formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBeTrue();

    TestBed.inject(EntityAbility).update([
      { action: "manage", subject: "all" },
    ]);
    await service.saveChanges(form, new Entity());

    expect(unsavedChanges.pending).toBeFalse();

    form.formGroup.markAsDirty();
    form.formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBeTrue();

    service.resetForm(form, new Entity());

    expect(unsavedChanges.pending).toBeFalse();
  });

  it("should reset form on cancel, including special fields with getter", async () => {
    class MockEntity extends Entity {
      @DatabaseField() simpleField = "original";

      @DatabaseField() get getterField(): string {
        return this._getterValue;
      }

      set getterField(value) {
        this._getterValue = value;
      }

      private _getterValue: string = "original value";

      @DatabaseField() emptyField;
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

    expect(unsavedChanged.pending).toBeTrue();

    await router.navigate(["test"]);

    expect(unsavedChanged.pending).toBeFalse();

    // Changes are not listened to anymore
    formGroup.formGroup.markAsDirty();
    formGroup.formGroup.get("inactive").setValue(true);

    expect(unsavedChanged.pending).toBeFalse();
  });

  it("should assign default values", async () => {
    const schema: EntitySchemaField = {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    };
    Entity.schema.set("test", schema);

    let form = await service.createEntityForm([{ id: "test" }], new Entity());
    expect(form.formGroup.get("test")).toHaveValue(1);

    schema.defaultValue = {
      mode: "dynamic",
      value: PLACEHOLDERS.NOW,
    };

    form = await service.createEntityForm([{ id: "test" }], new Entity());
    expect(
      moment(form.formGroup.get("test").value).isSame(moment(), "minutes"),
    ).toBeTrue();

    schema.defaultValue = {
      mode: "dynamic",
      value: PLACEHOLDERS.CURRENT_USER,
    };
    form = await service.createEntityForm([{ id: "test" }], new Entity());
    expect(form.formGroup.get("test")).toHaveValue(
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    );

    schema.dataType = EntityDatatype.dataType;
    schema.isArray = true;
    form = await service.createEntityForm([{ id: "test" }], new Entity());
    expect(form.formGroup.get("test")).toHaveValue([
      `${TestEntity.ENTITY_TYPE}:${TEST_USER}`,
    ]);

    Entity.schema.delete("test");
  });

  it("should not fail if user entity does not exist and current user value is assigned", async () => {
    TestBed.inject(CurrentUserSubject).next(undefined);

    // simple property
    Entity.schema.set("user", {
      defaultValue: {
        mode: "dynamic",
        value: PLACEHOLDERS.CURRENT_USER,
      },
    });
    let form = await service.createEntityForm([{ id: "user" }], new Entity());
    expect(form.formGroup.get("user")).toHaveValue(null);

    // array property
    Entity.schema.get("user").dataType = EntityDatatype.dataType;
    Entity.schema.get("user").isArray = true;
    form = await service.createEntityForm([{ id: "user" }], new Entity());
    expect(form.formGroup.get("user")).toHaveValue(null);

    Entity.schema.delete("user");
  });

  it("should not assign default values to existing entities", async () => {
    Entity.schema.set("test", {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    });

    const entity = new Entity();
    entity._rev = "1-existing_entity";
    const form = await service.createEntityForm([{ id: "test" }], entity);
    expect(form.formGroup.get("test")).toHaveValue(null);

    Entity.schema.delete("test");
  });

  it("should not overwrite existing values with default value", async () => {
    Entity.schema.set("test", {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    });

    const entity = new Entity();
    entity["test"] = 2;
    const form = await service.createEntityForm([{ id: "test" }], entity);
    expect(form.formGroup.get("test")).toHaveValue(2);

    Entity.schema.delete("test");
  });

  it("should not save 'null' as value from empty form fields", async () => {
    Entity.schema.set("test", { dataType: "string" });

    const entity = new Entity();
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
  });

  it("should add column definitions from property schema", () => {
    class Test extends Entity {
      @DatabaseField({
        description: "Property description",
        additional: "someAdditional",
      })
      propertyField: string;
    }

    spyOn(TestBed.inject(EntitySchemaService), "getComponent").and.returnValue(
      "PredefinedComponent",
    );
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
      onSave: jasmine.createSpy(),
    } as unknown as EntityForm<T>;
  }
});
