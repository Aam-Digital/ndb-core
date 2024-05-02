import { TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormService } from "./entity-form.service";
import {
  FormControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { Entity } from "../../entity/model/entity";
import { School } from "../../../child-dev-project/schools/model/school";
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
import { Child } from "../../../child-dev-project/children/model/child";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { FormFieldConfig } from "./FormConfig";
import { User } from "../../user/user";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import moment from "moment";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MockEntityMapperService } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";

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

    await expectAsync(service.saveChanges(formGroup, entity)).toBeRejected();
    expect(entity.getId()).not.toBe(`${Entity.ENTITY_TYPE}:newId`);
  });

  it("should update entity if saving is successful", async () => {
    const entity = new Entity("initialId");
    const formGroup = new UntypedFormGroup({
      _id: new UntypedFormControl(`${Entity.ENTITY_TYPE}:newId`),
    });
    TestBed.inject(EntityAbility).update([
      { subject: "Entity", action: "create" },
    ]);

    await service.saveChanges(formGroup, entity);

    expect(entity.getId()).toBe(`${Entity.ENTITY_TYPE}:newId`);
  });

  it("should throw an error when trying to create a entity with missing permissions", async () => {
    TestBed.inject(EntityAbility).update([
      { subject: "all", action: "manage" },
      {
        subject: "School",
        action: "create",
        inverted: true,
        conditions: { name: "un-permitted school" },
      },
    ]);
    const school = new School();

    const formGroup = new UntypedFormGroup({
      name: new UntypedFormControl("normal school"),
    });
    await service.saveChanges(formGroup, school);
    expect(school.name).toBe("normal school");

    formGroup.patchValue({ name: "un-permitted school" });
    const result = service.saveChanges(formGroup, school);
    await expectAsync(result).toBeRejected();
    expect(school.name).toBe("normal school");
  });

  it("should create forms with the validators included", () => {
    const formFields = [{ id: "schoolId" }, { id: "result" }];
    const formGroup = service.createFormGroup(
      formFields,
      new ChildSchoolRelation(),
    );

    expect(formGroup.invalid).toBeTrue();
    formGroup.patchValue({ schoolId: "someSchool" });
    expect(formGroup.valid).toBeTrue();
    formGroup.patchValue({ result: 101 });
    expect(formGroup.invalid).toBeTrue();
    formGroup.patchValue({ result: 100 });
    expect(formGroup.valid).toBeTrue();
  });

  it("should use create permissions to disable fields when creating a new entity", () => {
    const formFields = [{ id: "name" }, { id: "dateOfBirth" }];
    TestBed.inject(EntityAbility).update([
      { subject: "Child", action: "read", fields: ["name", "dateOfBirth"] },
      { subject: "Child", action: "update", fields: ["name"] },
      { subject: "Child", action: "create", fields: ["dateOfBirth"] },
    ]);

    const formGroup = service.createFormGroup(formFields, new Child());

    expect(formGroup.get("name").disabled).toBeTrue();
    expect(formGroup.get("dateOfBirth").enabled).toBeTrue();
  });

  it("should always keep properties disabled if user does not have 'update' permissions for them", () => {
    const formFields = [{ id: "name" }, { id: "dateOfBirth" }];
    TestBed.inject(EntityAbility).update([
      { subject: "Child", action: "read", fields: ["name", "dateOfBirth"] },
      { subject: "Child", action: "update", fields: ["name"] },
    ]);

    const child = new Child();
    child._rev = "foo"; // "not new" state

    const formGroup = service.createFormGroup(formFields, child);

    expect(formGroup.get("name").enabled).toBeTrue();
    expect(formGroup.get("dateOfBirth").disabled).toBeTrue();

    formGroup.disable();

    expect(formGroup.get("name").disabled).toBeTrue();
    expect(formGroup.get("dateOfBirth").disabled).toBeTrue();

    formGroup.enable();

    expect(formGroup.get("name").enabled).toBeTrue();
    expect(formGroup.get("dateOfBirth").disabled).toBeTrue();
  });

  it("should create a error if form is invalid", () => {
    const formFields = [{ id: "schoolId" }, { id: "start" }];
    const formGroup = service.createFormGroup(
      formFields,
      new ChildSchoolRelation(),
    );

    return expectAsync(
      service.saveChanges(formGroup, new ChildSchoolRelation()),
    ).toBeRejectedWith(jasmine.any(InvalidFormFieldError));
  });

  it("should set pending changes once a form is edited and reset it once saved or canceled", async () => {
    const formFields = [{ id: "inactive" }];
    const formGroup = service.createFormGroup(formFields, new Entity());
    const unsavedChanges = TestBed.inject(UnsavedChangesService);

    formGroup.markAsDirty();
    formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBeTrue();

    TestBed.inject(EntityAbility).update([
      { action: "manage", subject: "all" },
    ]);
    await service.saveChanges(formGroup, new Entity());

    expect(unsavedChanges.pending).toBeFalse();

    formGroup.markAsDirty();
    formGroup.get("inactive").setValue(true);
    expect(unsavedChanges.pending).toBeTrue();

    service.resetForm(formGroup, new Entity());

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
    const formGroup = service.createFormGroup(formFields, mockEntity);

    formGroup.get("simpleField").setValue("new");
    formGroup.get("getterField").setValue("new value");
    formGroup.get("emptyField").setValue("value");

    service.resetForm(formGroup, mockEntity);

    expect(formGroup.get("simpleField").value).toBe("original");
    expect(formGroup.get("getterField").value).toBe("original value");
    expect(formGroup.get("emptyField").value).toBeUndefined();
  });

  it("should reset state once navigation happens", async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: "test", component: NotFoundComponent }]);
    const unsavedChanged = TestBed.inject(UnsavedChangesService);
    const formFields = [{ id: "inactive" }];
    const formGroup = service.createFormGroup(formFields, new Entity());
    formGroup.markAsDirty();
    formGroup.get("inactive").setValue(true);

    expect(unsavedChanged.pending).toBeTrue();

    await router.navigate(["test"]);

    expect(unsavedChanged.pending).toBeFalse();

    // Changes are not listened to anymore
    formGroup.markAsDirty();
    formGroup.get("inactive").setValue(true);

    expect(unsavedChanged.pending).toBeFalse();
  });

  it("should assign default values", () => {
    const schema: EntitySchemaField = {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    };
    Entity.schema.set("test", schema);

    let form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue(1);

    schema.defaultValue = {
      mode: "dynamic",
      value: PLACEHOLDERS.NOW,
    };
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(
      moment(form.get("test").value).isSame(moment(), "minutes"),
    ).toBeTrue();

    schema.defaultValue = {
      mode: "dynamic",
      value: PLACEHOLDERS.CURRENT_USER,
    };
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue(`${User.ENTITY_TYPE}:${TEST_USER}`);

    schema.dataType = EntityDatatype.dataType;
    schema.isArray = true;
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue([`${User.ENTITY_TYPE}:${TEST_USER}`]);

    Entity.schema.delete("test");
  });

  it("should not fail if user entity does not exist and current user value is assigned", () => {
    TestBed.inject(CurrentUserSubject).next(undefined);

    // simple property
    Entity.schema.set("user", {
      defaultValue: {
        mode: "dynamic",
        value: PLACEHOLDERS.CURRENT_USER,
      },
    });
    let form = service.createFormGroup([{ id: "user" }], new Entity());
    expect(form.get("user")).toHaveValue(null);

    // array property
    Entity.schema.get("user").dataType = EntityDatatype.dataType;
    Entity.schema.get("user").isArray = true;
    form = service.createFormGroup([{ id: "user" }], new Entity());
    expect(form.get("user")).toHaveValue(null);

    Entity.schema.delete("user");
  });

  it("should not assign default values to existing entities", () => {
    Entity.schema.set("test", {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    });

    const entity = new Entity();
    entity._rev = "1-existing_entity";
    const form = service.createFormGroup([{ id: "test" }], entity);
    expect(form.get("test")).toHaveValue(null);

    Entity.schema.delete("test");
  });

  it("should not overwrite existing values with default value", () => {
    Entity.schema.set("test", {
      defaultValue: {
        mode: "static",
        value: 1,
      },
    });

    const entity = new Entity();
    entity["test"] = 2;
    const form = service.createFormGroup([{ id: "test" }], entity);
    expect(form.get("test")).toHaveValue(2);

    Entity.schema.delete("test");
  });

  it("should not save 'null' as value from empty form fields", async () => {
    Entity.schema.set("test", { dataType: "string" });

    const entity = new Entity();
    const form = service.createFormGroup([{ id: "test" }], entity);
    form.get("test").reset();
    expect(form.get("test").getRawValue()).toEqual(null);

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
    class Test extends Child {
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
});
