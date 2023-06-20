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
    service.extendFormFieldConfig(formFields, ChildSchoolRelation);
    const formGroup = service.createFormGroup(
      formFields,
      new ChildSchoolRelation()
    );

    return expectAsync(
      service.saveChanges(formGroup, new ChildSchoolRelation())
    ).toBeRejectedWith(jasmine.any(InvalidFormFieldError));
  });
});
