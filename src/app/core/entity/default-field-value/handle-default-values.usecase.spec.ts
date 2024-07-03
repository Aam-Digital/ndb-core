import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { HandleDefaultValuesUseCase } from "./handle-default-values.usecase";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { LoggingService } from "../../logging/logging.service";
import { FormBuilder, FormControl } from "@angular/forms";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { Entity } from "../model/entity";
import { EntityForm } from "../../common-components/entity-form/entity-form.service";
import { EntitySchema } from "../schema/entity-schema";

function getDefaultInheritedFormGroup(): EntityForm<any> {
  return {
    defaultValueConfigs: new Map(),
    entity: new Entity(),
    inheritedParentValues: new Map(),
    inheritedSyncStatus: new Map(),
    watcher: new Map(),
    formGroup: new FormBuilder().group<any>({
      "field-1": new FormControl(),
      "field-2": new FormControl(),
      "reference-1": new FormControl(),
    }),
  };
}

describe("HandleDefaultValuesUseCase", () => {
  let service: HandleDefaultValuesUseCase;
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
    service = TestBed.inject(HandleDefaultValuesUseCase);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("on dynamic mode", () => {
    it("should do nothing, if targetFormControl is missing", fakeAsync(() => {
      // given
      let form = getDefaultInheritedFormGroup();

      let fieldConfigs: EntitySchema = new Map();

      fieldConfigs.set("field-invalid", {
        defaultValue: {
          mode: "dynamic",
          value: "bar",
        },
      });

      // when
      service.handleEntityForm(form, fieldConfigs, true);
      tick();

      // then
      expect(form.formGroup.get("field-2").value).toBe(null);
    }));

    it("should not set default value on FormControl, if target field is dirty and not empty", fakeAsync(() => {
      // given
      let form = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "dynamic",
          value: "foo",
        },
      });

      form.formGroup.get("field-2").setValue("pre-filled");
      form.formGroup.get("field-2").markAsDirty();

      // when
      service.handleEntityForm(form, fieldConfigs, true);
      tick();

      // then
      expect(form.formGroup.get("field-2").value).toBe("pre-filled");
    }));

    it("should do nothing, if value is not a valid PLACEHOLDER", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "dynamic",
          value: "invalid-placeholder",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should set current USER, if PLACEHOLDER.CURRENT_USER is selected", fakeAsync(() => {
      // given
      let form = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "dynamic",
          value: "$current_user",
        },
      });

      let user = new Entity();

      TestBed.inject(CurrentUserSubject).next(user);

      // when
      service.handleEntityForm(form, fieldConfigs, true);
      tick();

      // then
      expect(form.formGroup.get("field-2").value).toBe(user.getId());
    }));

    it("should set current Date, if PLACEHOLDER.NOW is selected", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBeDate(new Date());
    }));

    it("should do nothing, if entity is not new", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
      });

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, false);
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));
  });

  describe("on static mode", () => {
    it("should do nothing, if targetFormControl is missing", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-invalid", {
        defaultValue: {
          mode: "static",
          value: "bar",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should set default value on FormControl, if target field empty", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "static",
          value: "bar",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe("bar");
    }));

    it("should not set default value on FormControl, if target field is dirty and not empty", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "static",
          value: "foo",
        },
      });

      formGroup.formGroup.get("field-2").setValue("pre-filled");
      formGroup.formGroup.get("field-2").markAsDirty();

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe("pre-filled");
    }));

    it("should not set default value on FormControl, if target field is not empty", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "static",
          value: "bar",
        },
      });

      formGroup.formGroup.get("field-2").setValue("foo");

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe("foo");
    }));

    it("should do nothing, if entity is not new", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "static",
          value: "foo",
        },
      });

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, false);
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));
  });

  describe("on inherited mode", () => {
    it("should do nothing, if parentFormControl is missing", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-invalid",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick(); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should do nothing, if field in parent entity is missing", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "invalid-field",
          localAttribute: "reference-1",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick(); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should do nothing, if targetFormControl is missing", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-invalid", {
        defaultValue: {
          mode: "inherited",
          field: "invalid-field",
          localAttribute: "reference-1",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick(); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should set default value on FormControl, if target field empty", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = "bar";
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();
      formGroup.formGroup.get("reference-1").setValue("Entity:0");
      tick(10); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-1").value).toBe(null);
      expect(formGroup.formGroup.get("field-2").value).toBe("bar");
    }));

    it("should set default array value on FormControl, if target field empty", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar", "doo"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();
      formGroup.formGroup.get("reference-1").setValue("Entity:0");
      tick(10); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-1").value).toBe(null);
      expect(formGroup.formGroup.get("field-2").value).toEqual(["bar", "doo"]);
    }));

    it("should set value on FormControl, if source is single value array", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();
      formGroup.formGroup.get("reference-1").setValue(["Entity:0"]);
      tick(10); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-1").value).toBe(null);
      expect(formGroup.formGroup.get("field-2").value).toEqual(["bar"]);
    }));

    it("should not set value on FormControl, if source is multi value array", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = ["bar", "doo"];
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();
      formGroup.formGroup.get("reference-1").setValue(["Entity:0", "Entity:1"]);
      tick(10); // fetching reference is always async

      // then
      expect(formGroup.formGroup.get("field-1").value).toBe(null);
      expect(formGroup.formGroup.get("field-2").value).toEqual(null);
    }));

    it("should not set default value on FormControl, if target field is dirty and not empty", fakeAsync(() => {
      // given
      let form = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = "bar";
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));
      form.formGroup.get("field-2").setValue("pre-filled");
      form.formGroup.get("field-2").markAsDirty();

      // when
      service.handleEntityForm(form, fieldConfigs, true);
      tick();
      form.formGroup.get("reference-1").setValue("Entity:0");
      tick(); // fetching reference is always async

      // then
      expect(form.formGroup.get("field-2").value).toBe("pre-filled");
    }));

    it("should reset FormControl, if parent field got cleared", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();
      formGroup.formGroup.get("reference-1").setValue("foo bar doo");
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue(null);
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(undefined);

      formGroup.formGroup.get("reference-1").setValue(undefined);
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(undefined);

      formGroup.formGroup.get("reference-1").setValue("");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(undefined);
    }));

    it("should do nothing, if parent entity does not exist", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should do nothing, if formGroup is disabled", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      formGroup.formGroup.disable();

      mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, true);
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue("non-existing-entity-id");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));

    it("should do nothing, if entity is not new", fakeAsync(() => {
      // given
      let formGroup = getDefaultInheritedFormGroup();

      let fieldConfigs: Map<string, EntitySchemaField> = new Map();
      fieldConfigs.set("field-2", {
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      });

      let entity0 = new Entity();
      entity0["foo"] = "bar";
      mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

      // when
      service.handleEntityForm(formGroup, fieldConfigs, false);
      tick();

      // when/then
      formGroup.formGroup.get("reference-1").setValue("Entity:0");
      tick(); // fetching reference is always async
      expect(formGroup.formGroup.get("field-2").value).toBe(null);
    }));
  });
});
