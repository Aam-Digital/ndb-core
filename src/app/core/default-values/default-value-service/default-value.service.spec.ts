import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Entity } from "../../entity/model/entity";
import { FormBuilder, FormControl } from "@angular/forms";
import { TestBed } from "@angular/core/testing";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueService } from "./default-value.service";
import { DynamicPlaceholderValueService } from "../x-dynamic-placeholder/dynamic-placeholder-value.service";
import { InheritedValueService } from "../../../features/inherited-field/inherited-value.service";
import { EventEmitter } from "@angular/core";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { StaticDefaultValueService } from "../x-static/static-default-value.service";
import { SyncStateSubject } from "app/core/session/session-type";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";

/**
 * Helper function to add some custom schema fields to Entity for testing.
 * Use in combination with a call to cleanUpTemporarySchemaFields() in afterEach.
 *
 * @param additionalSchemaConfig
 */
export function getDefaultInheritedForm(
  additionalSchemaConfig: {
    [key: string]: EntitySchemaField;
  } = {},
): EntityForm<any> {
  for (const key in additionalSchemaConfig) {
    Entity.schema.set(key, additionalSchemaConfig[key]);
  }
  Entity["_temporarySchemaFields"] = Object.keys(additionalSchemaConfig);

  const entity = new Entity();

  return {
    entity: entity,
    fieldConfigs: Array.from(entity.getSchema().entries()).map(
      ([key, fieldConfig]) => ({ id: key, ...fieldConfig }),
    ),
    inheritedParentValues: new Map(),
    watcher: new Map(),
    onFormStateChange: new EventEmitter<"saved" | "cancelled">(),
    formGroup: new FormBuilder().group<any>({
      field: new FormControl(),
      field2: new FormControl(),
      "reference-1": new FormControl(),
    }),
  };
}

/**
 * Helper function to remove custom schema fields from Entity
 * that have been created using getDefaultInheritedForm().
 *
 * Call this in afterEach if you use getDefaultInheritedForm() in a test.
 */
export function cleanUpTemporarySchemaFields() {
  for (const key of Entity["_temporarySchemaFields"] ?? []) {
    Entity.schema.delete(key);
  }
  delete Entity["_temporarySchemaFields"];
}

export async function testDefaultValueCase(
  service: DefaultValueService,
  fieldSchema: EntitySchemaField,
  expected: any,
) {
  // given
  let form = getDefaultInheritedForm({
    field: fieldSchema,
  });

  // when
  await service.handleEntityForm(form, form.entity);

  // then
  expect(form.formGroup.get("field").value).toEqual(expected);

  cleanUpTemporarySchemaFields();
}

describe("DefaultValueService", () => {
  let service: DefaultValueService;
  let mockInheritedValueService: any;

  beforeEach(() => {
    mockInheritedValueService = {
      setDefaultValue: vi.fn(),
      initEntityForm: vi.fn(),
      onFormValueChanges: vi.fn(),
    };
    // @ts-ignore
    mockInheritedValueService["mode"] = "inherited-field";

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DefaultDatatype,
          useClass: ConfigurableEnumDatatype,
          multi: true,
        },
        CurrentUserSubject,
        {
          provide: DefaultValueStrategy,
          useClass: StaticDefaultValueService,
          multi: true,
        },
        {
          provide: DefaultValueStrategy,
          useClass: DynamicPlaceholderValueService,
          multi: true,
        },
        {
          provide: DefaultValueStrategy,
          useValue: mockInheritedValueService,
          multi: true,
        },
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        ConfigurableEnumService,
        SyncStateSubject,
        EntityAbility,
      ],
    });
    service = TestBed.inject(DefaultValueService);
  });

  afterEach(() => {
    cleanUpTemporarySchemaFields();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should do nothing, if targetFormControl is missing", async () => {
    vi.useFakeTimers();
    try {
      // given
      let form = getDefaultInheritedForm({
        undefinedField: {
          defaultValue: {
            mode: "static",
            config: { value: "default_value" },
          },
        },
      });

      // when
      service.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(form.formGroup.get("field").value).toEqual(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should transform configurable-enum and set the default value", async () => {
    vi.useFakeTimers();
    try {
      const enumId = "genders";
      const testEnumValue = { id: "M", label: "male" };
      const enumService = TestBed.inject(ConfigurableEnumService);
      vi.spyOn(enumService, "getEnumValues").mockImplementation((id) =>
        id === enumId ? [testEnumValue] : [],
      );

      const fieldConfig: EntitySchemaField = {
        dataType: "configurable-enum",
        additional: enumId,
        defaultValue: {
          mode: "static",
          config: { value: "M" },
        },
      };

      testDefaultValueCase(service, fieldConfig, testEnumValue);
      await vi.advanceTimersByTimeAsync(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should transform configurable-enum array and set the default value", async () => {
    vi.useFakeTimers();
    try {
      const enumId = "genders";
      const testEnumValue = { id: "M", label: "male" };
      const enumService = TestBed.inject(ConfigurableEnumService);
      vi.spyOn(enumService, "getEnumValues").mockImplementation((id) =>
        id === enumId ? [testEnumValue] : [],
      );

      const fieldConfig: EntitySchemaField = {
        dataType: "configurable-enum",
        additional: enumId,
        isArray: true,
        defaultValue: {
          mode: "static",
          config: { value: [testEnumValue.id] },
        },
      };
      testDefaultValueCase(service, fieldConfig, [testEnumValue]);
      await vi.advanceTimersByTimeAsync(0);

      const fieldConfig2: EntitySchemaField = {
        dataType: "configurable-enum",
        additional: enumId,
        isArray: true,
        defaultValue: {
          mode: "static",
          config: { value: testEnumValue.id }, // should also work with single value
        },
      };
      testDefaultValueCase(service, fieldConfig2, [testEnumValue]);
      await vi.advanceTimersByTimeAsync(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not set default value on FormControl, if target field is dirty and not empty", async () => {
    vi.useFakeTimers();
    try {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "static",
            config: { value: "default_value" },
          },
        },
      });

      form.formGroup.get("field").setValue("pre-filled");
      form.formGroup.get("field").markAsDirty();

      // when
      service.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(form.formGroup.get("field").value).toBe("pre-filled");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not set default value on FormControl, if target field is not empty", async () => {
    vi.useFakeTimers();
    try {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "static",
            config: { value: "default_value" },
          },
        },
      });

      form.formGroup.get("field").setValue("pre-filled");

      // when
      service.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(form.formGroup.get("field").value).toBe("pre-filled");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should do nothing, if entity is not new", async () => {
    vi.useFakeTimers();
    try {
      // given
      let form = getDefaultInheritedForm({
        field: {
          defaultValue: {
            mode: "static",
            config: { value: "default_value" },
          },
        },
      });

      form.entity = new Entity();
      form.entity["_rev"] = "1"; // mark as "not new"

      // when
      service.handleEntityForm(form, form.entity);
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(form.formGroup.get("field").value).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set 'static' default value on FormControl", () => {
    return testDefaultValueCase(
      service,
      {
        defaultValue: {
          mode: "static",
          config: { value: "default_value" },
        },
      },
      "default_value",
    );
  });

  it("should call service on dynamic mode", async () => {
    vi.useFakeTimers();
    try {
      const strategies: DefaultValueStrategy[] = TestBed.inject(
        DefaultValueStrategy,
      ) as any;

      const dynamicStrategySpy = vi.spyOn(
        strategies.find((s) => s instanceof DynamicPlaceholderValueService),
        "setDefaultValue",
      );
      const staticStrategySpy = vi.spyOn(
        strategies.find((s) => s instanceof StaticDefaultValueService),
        "setDefaultValue",
      );

      testDefaultValueCase(
        service,
        {
          defaultValue: {
            mode: "dynamic",
            config: { value: "x" },
          },
        },
        null,
      );
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(dynamicStrategySpy).toHaveBeenCalled();
      expect(staticStrategySpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should call service on inherited mode", async () => {
    vi.useFakeTimers();
    try {
      testDefaultValueCase(
        service,
        {
          defaultValue: {
            mode: "inherited-field",
            config: {
              sourceValueField: "foo",
              sourceReferenceField: "reference-1",
            },
          },
        },
        null,
      );
      await vi.advanceTimersByTimeAsync(0);

      // then
      expect(mockInheritedValueService.initEntityForm).toHaveBeenCalled();
      expect(mockInheritedValueService.setDefaultValue).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
