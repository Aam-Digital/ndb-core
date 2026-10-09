import { TestBed } from "@angular/core/testing";

import { InheritedValueService } from "./inherited-value.service";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import {
  cleanUpTemporarySchemaFields,
  getDefaultInheritedForm,
} from "../../core/default-values/default-value-service/default-value.service.test-utils";
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
  let mockEntityMapperService: any;
  let mockAbility: any;
  const updateSubject = new Subject<UpdatedEntity<Config>>();

  beforeEach(() => {
    mockEntityMapperService = {
      load: vi.fn(),
      loadType: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    mockEntityMapperService.receiveUpdates.mockReturnValue(updateSubject);
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
            valueToEntityFormat: (v) => v,
            valueToDatabaseFormat: (v) => v,
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
    expect(form.watcher.has("sourceFormControlValueChanges_field1")).toBe(
      false,
    );
  });

  it("should set default value on FormControl, if target field empty", async () => {
    vi.useFakeTimers();
    try {
      // given
      let entity = new Entity("Entity:0");
      entity["foo"] = "bar";
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity));

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
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("field2").setValue("Entity:0");
      await vi.advanceTimersByTimeAsync(10); // fetching reference is always async

      // then
      expect(form.watcher.has("sourceFormControlValueChanges_field2")).toBe(
        true,
      );
      expect(targetFormControl.value).toBe("bar");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set default array value on FormControl, if target field empty", async () => {
    vi.useFakeTimers();
    try {
      // given
      let entity = new Entity("Entity:0");
      entity["foo"] = ["bar", "doo"];
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity));

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
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("newField2").setValue("Entity:0");
      await vi.advanceTimersByTimeAsync(10); // fetching reference is always async

      // then
      expect(form.watcher.has("sourceFormControlValueChanges_newField2")).toBe(
        true,
      );
      expect(targetFormControl.value).toEqual(["bar", "doo"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set value on FormControl, if source is single value array", async () => {
    vi.useFakeTimers();
    try {
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
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity0));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("reference-1").setValue(["Entity:0"]);
      await vi.advanceTimersByTimeAsync(10); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toEqual(["bar"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not set value on FormControl, if source is multi value array", async () => {
    vi.useFakeTimers();
    try {
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
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity0));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("reference-1").setValue(["Entity:0", "Entity:1"]);
      await vi.advanceTimersByTimeAsync(10); // fetching reference is always async

      // then
      expect(form.formGroup.get("field").value).toEqual(undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reset FormControl, if parent (array) field got cleared", async () => {
    vi.useFakeTimers();
    try {
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
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity0));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("reference-1").setValue("foo");
      await vi.advanceTimersByTimeAsync(0);

      expect(form.formGroup.get("field").value).toEqual(["bar", "doo"]);

      // when/then
      form.formGroup.get("reference-1").setValue(null);
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);

      form.formGroup.get("reference-1").setValue(undefined);
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);

      form.formGroup.get("reference-1").setValue("");
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reset FormControl, if parent (single value) field got cleared", async () => {
    vi.useFakeTimers();
    try {
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
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity0));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("reference-1").setValue("foo");
      await vi.advanceTimersByTimeAsync(0);

      expect(form.formGroup.get("field").value).toBe("bar");

      // when/then
      form.formGroup.get("reference-1").setValue(null);
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);

      form.formGroup.get("reference-1").setValue(undefined);
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);

      form.formGroup.get("reference-1").setValue("");
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should do nothing, if parent entity does not exist", async () => {
    vi.useFakeTimers();
    try {
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

      mockEntityMapperService.load.mockReturnValue(Promise.resolve(undefined));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // when/then
      form.formGroup.get("reference-1").setValue("non-existing-entity-id");
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not throw if parent entity load fails while initializing inherited values", async () => {
    vi.useFakeTimers();
    try {
      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "foo",
              sourceReferenceField: "reference-1",
            },
          },
        },
      });
      form.entity = new Entity("Entity:123");
      form.entity["reference-1"] = "User:missing";
      mockEntityMapperService.load.mockReturnValue(
        Promise.reject(new Error("forbidden")),
      );

      let thrownError: Error | undefined;
      defaultValueService
        .handleEntityForm(form, form.entity)
        .catch((error: Error) => (thrownError = error));
      await vi.advanceTimersByTimeAsync(0);

      expect(thrownError).toBeUndefined();
      expect(form.inheritedParentValues.get("field")).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should do nothing, if formGroup is disabled", async () => {
    vi.useFakeTimers();
    try {
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

      mockEntityMapperService.load.mockReturnValue(Promise.resolve(undefined));

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // when/then
      form.formGroup.get("reference-1").setValue("non-existing-entity-id");
      await vi.advanceTimersByTimeAsync(0); // fetching reference is always async
      expect(form.formGroup.get("field").value).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set value on FormControl, if source is not in formGroup but set on entity", async () => {
    vi.useFakeTimers();
    try {
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
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity0));
      form.entity["reference-1"] = entity0.getId();

      // when
      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(form.formGroup.get("field").value).toEqual(["bar"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle copying single value to array field", async () => {
    vi.useFakeTimers();
    try {
      let entity = new Entity("User:Test");
      entity["status"] = "ongoing";
      mockEntityMapperService.load.mockReturnValue(Promise.resolve(entity));

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

      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("field2").setValue("User:Test");
      // Await the asynchronous value change and dependent logic before asserting.
      await vi.advanceTimersByTimeAsync(0);

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

      await vi.advanceTimersByTimeAsync(0);
      form.formGroup.get("field2").setValue("User:Test");
      // Await the asynchronous value change and dependent logic before asserting.
      await vi.advanceTimersByTimeAsync(0);

      expect(targetFormControl.value).toEqual(["status_1", "status_2"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should detect when field is in sync with parent value", async () => {
    vi.useFakeTimers();
    try {
      const parentEntity = new Entity("Parent:1");
      parentEntity["category"] = "primary";
      mockEntityMapperService.load.mockReturnValue(
        Promise.resolve(parentEntity),
      );

      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "category",
              sourceReferenceField: "parent",
            },
          },
        },
      });

      form.entity["parent"] = parentEntity.getId();
      form.formGroup.get("field").setValue("primary");

      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      const hint = defaultValueService.getDefaultValueUiHint(form, "field");

      expect(hint.isInSync).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should detect when field is not in sync with parent value", async () => {
    vi.useFakeTimers();
    try {
      const parentEntity = new Entity("Parent:1");
      parentEntity["category"] = "primary";
      mockEntityMapperService.load.mockReturnValue(
        Promise.resolve(parentEntity),
      );

      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "category",
              sourceReferenceField: "parent",
            },
          },
        },
      });

      form.entity["parent"] = parentEntity.getId();
      form.formGroup.get("field").setValue("secondary");

      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      const hint = defaultValueService.getDefaultValueUiHint(form, "field");

      expect(hint.isInSync).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sync field value from parent when syncFromParentField is called", async () => {
    vi.useFakeTimers();
    try {
      const parentEntity = new Entity("Parent:1");
      parentEntity["category"] = "primary";
      mockEntityMapperService.load.mockReturnValue(
        Promise.resolve(parentEntity),
      );

      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "category",
              sourceReferenceField: "parent",
            },
          },
        },
      });

      form.entity["parent"] = parentEntity.getId();
      form.formGroup.get("field").setValue("secondary");

      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      const hint = defaultValueService.getDefaultValueUiHint(form, "field");

      expect(form.formGroup.get("field").value).toBe("secondary");
      expect(hint.isInSync).toBe(false);

      hint.syncFromParentField();

      expect(form.formGroup.get("field").value).toBe("primary");

      const updatedHint = defaultValueService.getDefaultValueUiHint(
        form,
        "field",
      );
      expect(updatedHint.isInSync).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle enum values with valueMapping in isInSync check", async () => {
    vi.useFakeTimers();
    try {
      const parentEntity = new Entity("Parent:1");
      parentEntity["status"] = "active";
      mockEntityMapperService.load.mockReturnValue(
        Promise.resolve(parentEntity),
      );

      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "status",
              sourceReferenceField: "parent",
              valueMapping: {
                active: "in-progress",
                finished: "completed",
              },
            },
          },
        },
      });

      form.entity["parent"] = parentEntity.getId();
      form.formGroup.get("field").setValue("in-progress");

      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      const hint = defaultValueService.getDefaultValueUiHint(form, "field");

      expect(hint.isInSync).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sync enum values with valueMapping when syncFromParentField is called", async () => {
    vi.useFakeTimers();
    try {
      const parentEntity = new Entity("Parent:1");
      parentEntity["status"] = "active";
      mockEntityMapperService.load.mockReturnValue(
        Promise.resolve(parentEntity),
      );

      const form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "status",
              sourceReferenceField: "parent",
              valueMapping: {
                active: "in-progress",
                finished: "completed",
              },
            },
          },
        },
      });

      form.entity["parent"] = parentEntity.getId();
      form.formGroup.get("field").setValue("wrong-value");

      defaultValueService.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      const hint = defaultValueService.getDefaultValueUiHint(form, "field");

      expect(form.formGroup.get("field").value).toBe("wrong-value");
      expect(hint.isInSync).toBe(false);

      hint.syncFromParentField();

      expect(form.formGroup.get("field").value).toBe("in-progress");

      const updatedHint = defaultValueService.getDefaultValueUiHint(
        form,
        "field",
      );
      expect(updatedHint.isInSync).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  describe("field collecting the values of all linked records", () => {
    async function initCollectingForm(
      currentValue: string[],
      linkedRecordValues: string[][],
      aggregation: "add" | "replace" = "add",
    ) {
      const form = getDefaultInheritedForm({
        field: {
          isArray: true,
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceReferenceEntity: "Entity",
              sourceReferenceField: "parent",
              sourceValueField: "category",
              aggregation,
            },
          },
        },
      });
      form.entity._rev = "1-existing";
      form.entity["parent"] = "Entity:own-parent";
      form.formGroup.get("field").setValue(currentValue);

      const linkedRecords = linkedRecordValues.map((values, i) => {
        const record = new Entity();
        record["parent"] =
          i === 0 ? [form.entity.getId(), "Entity:other"] : form.entity.getId();
        record["category"] = values;
        return record;
      });
      const unrelatedRecord = new Entity();
      unrelatedRecord["parent"] = "Entity:other";
      unrelatedRecord["category"] = ["unrelated"];
      mockEntityMapperService.loadType.mockResolvedValue([
        ...linkedRecords,
        unrelatedRecord,
      ]);

      await defaultValueService.handleEntityForm(form, form.entity);
      return form;
    }

    it.each([
      [["a", "b"], [["b"], ["a"]], true],
      [["a", "b", "manual"], [["a"], ["b"]], false],
      [["a"], [["a"], ["a", "b"]], false],
    ])(
      "current %j with linked records %j is in sync: %s",
      async (currentValue, linkedRecordValues, expectedInSync) => {
        const form = await initCollectingForm(currentValue, linkedRecordValues);

        const hint = defaultValueService.getDefaultValueUiHint(form, "field");

        expect(hint.isCollectedFromLinkedRecords).toBe(true);
        expect(hint.isInSync).toBe(expectedInSync);
      },
    );

    it("should replace the value with the values of all linked records on sync", async () => {
      const form = await initCollectingForm(
        ["a", "stale"],
        [
          ["a", "b"],
          ["b", "c"],
        ],
      );

      defaultValueService
        .getDefaultValueUiHint(form, "field")
        .syncFromParentField();

      expect(form.formGroup.get("field").value).toEqual(["a", "b", "c"]);
      expect(
        defaultValueService.getDefaultValueUiHint(form, "field").isInSync,
      ).toBe(true);
    });

    it("should not show a hint without values of linked records", async () => {
      const form = await initCollectingForm(["manual"], []);

      expect(
        defaultValueService.getDefaultValueUiHint(form, "field"),
      ).toBeUndefined();
    });

    it("should not show a hint for automation rules replacing the value", async () => {
      const form = await initCollectingForm(["a"], [["b"]], "replace");

      expect(
        defaultValueService.getDefaultValueUiHint(form, "field"),
      ).toBeUndefined();
      expect(mockEntityMapperService.loadType).not.toHaveBeenCalled();
    });

    it("should not load the record's own parent for an automation rule", async () => {
      await initCollectingForm(["a"], [["a"]]);

      expect(mockEntityMapperService.load).not.toHaveBeenCalled();
    });
  });
});
