import { EntityForm } from "../common-components/entity-form/entity-form.service";
import { Entity } from "../entity/model/entity";
import { FormBuilder, FormControl } from "@angular/forms";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LoggingService } from "../logging/logging.service";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { CurrentUserSubject } from "../session/current-user-subject";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { DefaultValueService } from "./default-value.service";

let temporarySchemaFields: string[];

function getDefaultInheritedForm(
  additionalSchemaConfig: {
    [key: string]: EntitySchemaField;
  } = {},
): EntityForm<any> {
  for (const key in additionalSchemaConfig) {
    Entity.schema.set(key, additionalSchemaConfig[key]);
  }
  temporarySchemaFields = Object.keys(additionalSchemaConfig);

  const entity = new Entity();

  return {
    entity: entity,
    defaultValueConfigs: DefaultValueService.getDefaultValueConfigs(entity),
    inheritedParentValues: new Map(),
    inheritedSyncStatus: new Map(),
    watcher: new Map(),
    formGroup: new FormBuilder().group<any>({
      field: new FormControl(),
      field2: new FormControl(),
      "reference-1": new FormControl(),
    }),
  };
}

describe("DefaultValueService", () => {
  let service: DefaultValueService;
  let mockEntityMapperService: jasmine.SpyObj<EntityMapperService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    mockEntityMapperService = jasmine.createSpyObj(["load"]);
    mockLoggingService = jasmine.createSpyObj(["warn"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapperService },
        { provide: LoggingService, useValue: mockLoggingService },
        CurrentUserSubject,
      ],
    });
    service = TestBed.inject(DefaultValueService);
  });

  afterEach(() => {
    for (const key of temporarySchemaFields ?? []) {
      Entity.schema.delete(key);
    }
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should do nothing, if targetFormControl is missing", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      undefinedField: {
        defaultValue: {
          mode: "static",
          value: "default_value",
        },
      },
    });

    // when
    service.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toBe(null);
  }));

  it("should not set default value on FormControl, if target field is dirty and not empty", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        defaultValue: {
          mode: "static",
          value: "default_value",
        },
      },
    });

    form.formGroup.get("field").setValue("pre-filled");
    form.formGroup.get("field").markAsDirty();

    // when
    service.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toBe("pre-filled");
  }));

  it("should not set default value on FormControl, if target field is not empty", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        defaultValue: {
          mode: "static",
          value: "default_value",
        },
      },
    });

    form.formGroup.get("field").setValue("pre-filled");

    // when
    service.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toBe("pre-filled");
  }));

  it("should do nothing, if entity is not new", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        defaultValue: {
          mode: "static",
          value: "default_value",
        },
      },
    });

    form.entity = new Entity();
    form.entity["_rev"] = "1"; // mark as "not new"

    // when
    service.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toBe(null);
  }));

  describe("on static mode", () => {
    it("should set default value on FormControl", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "static",
            value: "default_value",
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // then
      expect(form.formGroup.get("field").value).toBe("default_value");
    }));
  });

  describe("on dynamic mode", () => {
    it("should do nothing, if value is not a valid PLACEHOLDER", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "dynamic",
            value: "invalid-placeholder",
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // then
      expect(form.formGroup.get("field").value).toBe(null);
    }));

    it("should set current USER, if PLACEHOLDER.CURRENT_USER is selected", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "dynamic",
            value: "$current_user",
          },
        },
      });

      let user = new Entity();
      TestBed.inject(CurrentUserSubject).next(user);

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // then
      expect(form.formGroup.get("field").value).toBe(user.getId());
    }));

    it("should set current Date, if PLACEHOLDER.NOW is selected", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "dynamic",
            value: "$now",
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // then
      expect(form.formGroup.get("field").value).toBeDate(new Date());
    }));
  });

  describe("on inherited mode", () => {
    it("should do nothing, if field in parent entity is missing", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited",
            field: "invalid-field",
            localAttribute: "reference-1",
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      tick(); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toBe(null);
    }));

    it("should set default value on FormControl, if target field empty", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = "bar";
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(form, form.entity);
      tick();
      form.formGroup.get("reference-1").setValue("Entity:0");
      tick(10); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toBe("bar");
    }));

    it("should set default array value on FormControl, if target field empty", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          isArray: true,
          defaultValue: {
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar", "doo"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(form, form.entity);
      tick();
      form.formGroup.get("reference-1").setValue("Entity:0");
      tick(10); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toEqual(["bar", "doo"]);
    }));

    it("should set value on FormControl, if source is single value array", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          isArray: true,
          defaultValue: {
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(form, form.entity);
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
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar", "doo"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(form, form.entity);
      tick();
      form.formGroup.get("reference-1").setValue(["Entity:0", "Entity:1"]);
      tick(10); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toEqual(null);
    }));

    it("should reset FormControl, if parent field got cleared", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          isArray: true,
          defaultValue: {
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      tick();
      form.formGroup.get("reference-1").setValue("foo bar doo");
      tick();

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
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // when/then
      form.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(null);
    }));

    it("should do nothing, if formGroup is disabled", fakeAsync(() => {
      // given
      let form = getDefaultInheritedForm({
        field: {
          isArray: true,
          defaultValue: {
            mode: "inherited",
            field: "foo",
            localAttribute: "reference-1",
          },
        },
      });

      form.formGroup.disable();

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(form, form.entity);
      tick();

      // when/then
      form.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(null);
    }));
  });
});
