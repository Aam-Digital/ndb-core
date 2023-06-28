import { TestBed } from "@angular/core/testing";

import { EntityFormService } from "./entity-form.service";
import {
  FormBuilder,
  FormControl,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";
import { School } from "../../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { InvalidFormFieldError } from "./invalid-form-field.error";
import { MatDialogModule } from "@angular/material/dialog";
import { UnsavedChangesService } from "../entity-details/form/unsaved-changes.service";
import { Router } from "@angular/router";
import { NotFoundComponent } from "../../view/dynamic-routing/not-found/not-found.component";
import { SessionService } from "../../session/session-service/session.service";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { TEST_USER } from "../../../utils/mocked-testing.module";
import { arrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-array";
import { entityArrayEntitySchemaDatatype } from "../../entity/schema-datatypes/datatype-entity-array";

describe("EntityFormService", () => {
  let service: EntityFormService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockEntityMapper.save.and.resolveTo();
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        FormBuilder,
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        EntityAbility,
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => ({ name: TEST_USER }) },
        },
      ],
    });
    service = TestBed.inject(EntityFormService);
  });

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
    expect(entity.getId()).not.toBe("newId");
  });

  it("should update entity if saving is successful", async () => {
    const entity = new Entity("initialId");
    const formGroup = new UntypedFormGroup({
      _id: new UntypedFormControl("newId"),
    });
    TestBed.inject(EntityAbility).update([
      { subject: "Entity", action: "create" },
    ]);

    await service.saveChanges(formGroup, entity);

    expect(entity.getId()).toBe("newId");
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
    service.extendFormFieldConfig(formFields, ChildSchoolRelation);
    const formGroup = service.createFormGroup(
      formFields,
      new ChildSchoolRelation()
    );

    expect(formGroup.invalid).toBeTrue();
    formGroup.patchValue({ schoolId: "someSchool" });
    expect(formGroup.valid).toBeTrue();
    formGroup.patchValue({ result: 101 });
    expect(formGroup.invalid).toBeTrue();
    formGroup.patchValue({ result: 100 });
    expect(formGroup.valid).toBeTrue();
  });

  it("should create a error if form is invalid", () => {
    const formFields = [{ id: "schoolId" }, { id: "start" }];
    const formGroup = service.createFormGroup(
      formFields,
      new ChildSchoolRelation()
    );

    return expectAsync(
      service.saveChanges(formGroup, new ChildSchoolRelation())
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
      defaultValue: 1,
    };
    Entity.schema.set("test", schema);

    let form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue(1);

    schema.defaultValue = PLACEHOLDERS.NOW;
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue(new Date());

    schema.defaultValue = PLACEHOLDERS.CURRENT_USER;
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue(TEST_USER);

    schema.dataType = arrayEntitySchemaDatatype.name;
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue([TEST_USER]);

    schema.dataType = entityArrayEntitySchemaDatatype.name;
    form = service.createFormGroup([{ id: "test" }], new Entity());
    expect(form.get("test")).toHaveValue([TEST_USER]);
  });
});
