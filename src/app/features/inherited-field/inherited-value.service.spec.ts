import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { InheritedValueService } from "./inherited-value.service";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import {
  cleanUpTemporarySchemaFields,
  getDefaultInheritedForm,
} from "../../core/default-values/default-value-service/default-value.service.spec";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { DefaultValueService } from "../../core/default-values/default-value-service/default-value.service";
import { EventEmitter } from "@angular/core";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { UpdatedEntity } from "../../core/entity/model/entity-update";
import { Config } from "../../core/config/config";
import { Subject } from "rxjs";
import { DefaultValueStrategy } from "../../core/default-values/default-value-strategy.interface";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";

describe("InheritedValueService", () => {
  let service: InheritedValueService;
  let defaultValueService: DefaultValueService;
  let mockEntityMapperService: jasmine.SpyObj<EntityMapperService>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    mockEntityMapperService = jasmine.createSpyObj(["load", "receiveUpdates"]);
    mockEntityMapperService.receiveUpdates.and.returnValue(updateSubject);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DefaultValueStrategy,
          useClass: InheritedValueService,
          multi: true,
        },
        { provide: EntityMapperService, useValue: mockEntityMapperService },
        { provide: EntityAbility, useValue: mockAbility },
        {
          provide: EntitySchemaService,
          useValue: {
            valueToDatabaseFormat: jasmine
              .createSpy("valueToDatabaseFormat")
              .and.callFake((value) => {
                if (value && typeof value === "object" && value.id) {
                  return value.id;
                }
                return value;
              }),
          },
        },
        EntityRegistry,
      ],
    });
    // @ts-ignore
    service = TestBed.inject<DefaultValueStrategy[]>(DefaultValueStrategy)[0];
    defaultValueService = TestBed.inject(DefaultValueService);
  });

  afterEach(() => {
    cleanUpTemporarySchemaFields();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should do nothing, if field in parent entity is missing", () => {
    // given
    let entity = new Entity();

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "invalid-field",
            sourceReferenceField: "reference-1",
          },
        },
      },
      form,
    );

    // then
    expect(targetFormControl.value).toBe(undefined);
    expect(
      form.watcher.has("sourceFormControlValueChanges_field1"),
    ).toBeFalse();
  });

  it("should set default value on FormControl, if target field empty", fakeAsync(() => {
    // given
    let entity = new Entity("Entity:0");
    entity["foo"] = "bar";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity));

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
        field2: new FormControl(),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        isArray: false,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "field2",
          },
        },
      },
      form,
    );

    // when
    tick();
    form.formGroup.get("field2").setValue("Entity:0");
    tick(10); // fetching reference is always async

    // then
    expect(form.watcher.has("sourceFormControlValueChanges_field2")).toBeTrue();
    expect(targetFormControl.value).toBe("bar");
  }));

  it("should set default array value on FormControl, if target field empty", fakeAsync(() => {
    // given
    let entity = new Entity("Entity:0");
    entity["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity));

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        newField1: new FormControl(),
        newField2: new FormControl(),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("newField1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "newField2",
          },
        },
      },
      form,
    );

    // when
    tick();
    form.formGroup.get("newField2").setValue("Entity:0");
    tick(10); // fetching reference is always async

    // then
    expect(
      form.watcher.has("sourceFormControlValueChanges_newField2"),
    ).toBeTrue();
    expect(targetFormControl.value).toEqual(["bar", "doo"]);
  }));

  it("should set value on FormControl, if source is single value array", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    let entity0 = new Entity("Entity:0");
    entity0["foo"] = ["bar"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue(["Entity:0"]);
    tick(10); // fetching reference is always async

    // then
    expect(form.formGroup.get("field").value).toEqual(["bar"]);
  }));

  it("should not set value on FormControl, if source is multi value array", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue(["Entity:0", "Entity:1"]);
    tick(10); // fetching reference is always async

    // then
    expect(form.formGroup.get("field").value).toEqual(undefined);
  }));

  it("should reset FormControl, if parent (array) field got cleared", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue("foo");
    tick();

    expect(form.formGroup.get("field").value).toEqual(["bar", "doo"]);

    // when/then
    form.formGroup.get("reference-1").setValue(null);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue(undefined);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue("");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should reset FormControl, if parent (single value) field got cleared", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: false,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = "bar";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue("foo");
    tick();

    expect(form.formGroup.get("field").value).toBe("bar");

    // when/then
    form.formGroup.get("reference-1").setValue(null);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue(undefined);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue("");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should do nothing, if parent entity does not exist", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // when/then
    form.formGroup.get("reference-1").setValue("non-existing-entity-id");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should do nothing, if formGroup is disabled", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });

    form.formGroup.disable();

    mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // when/then
    form.formGroup.get("reference-1").setValue("non-existing-entity-id");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(null);
  }));

  it("should set value on FormControl, if source is not in formGroup but set on entity", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "foo",
            sourceReferenceField: "reference-1",
          },
        },
      },
    });
    form.formGroup.removeControl("reference-1");

    let entity0 = new Entity();
    entity0["foo"] = ["bar"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));
    form.entity["reference-1"] = entity0.getId();

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toEqual(["bar"]);
  }));

  it("should handle copying single value to array field", fakeAsync(() => {
    let entity = new Entity("User:Test");
    entity["status"] = "ongoing";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity));

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
        field2: new FormControl(),
      }),
      onFormStateChange: new EventEmitter(),
      entity: new Entity(),
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "status",
            sourceReferenceField: "field2",
          },
        },
      },
      form,
    );

    tick();
    form.formGroup.get("field2").setValue("User:Test");
    // The tick() is required here to allow the asynchronous value change and any dependent logic to complete.
    tick();

    expect(targetFormControl.value).toEqual(["ongoing"]);

    // PART 2:
    // check that array to array inheritance keeps the correct form also
    entity["status"] = ["status_1", "status_2"];
    form.formGroup.reset();

    service.setDefaultValue(
      targetFormControl,
      {
        isArray: true,
        defaultValue: {
          mode: "inherited-field",
          config: {
            sourceValueField: "status",
            sourceReferenceField: "field2",
          },
        },
      },
      form,
    );

    tick();
    form.formGroup.get("field2").setValue("User:Test");
    // The tick() is required here to allow the asynchronous value change and any dependent logic to complete.
    tick();

    expect(targetFormControl.value).toEqual(["status_1", "status_2"]);
  }));
});
