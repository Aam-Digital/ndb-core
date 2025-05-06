import { EntityForm } from "../../common-components/entity-form/entity-form.service";
import { Entity } from "../../entity/model/entity";
import { FormBuilder, FormControl } from "@angular/forms";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueService } from "./default-value.service";
import { DynamicPlaceholderValueService } from "../x-dynamic-placeholder/dynamic-placeholder-value.service";
import { InheritedValueService } from "../x-inherited-value/inherited-value.service";
import { EventEmitter } from "@angular/core";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum-testing";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";

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
  let mockInheritedValueService: jasmine.SpyObj<InheritedValueService>;

  beforeEach(() => {
    mockInheritedValueService = jasmine.createSpyObj([
      "setDefaultValue",
      "initEntityForm",
      "onFormValueChanges",
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DefaultDatatype,
          useClass: ConfigurableEnumDatatype,
          multi: true,
        },
        CurrentUserSubject,
        { provide: InheritedValueService, useValue: mockInheritedValueService },
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
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
    expect(form.formGroup.get("field").value).toEqual(null);
  }));

  it("should transform configurable-enum and set the default value", fakeAsync(() => {
    const enumId = "genders";
    const testEnumValue = { id: "M", label: "male" };
    const enumService = TestBed.inject(ConfigurableEnumService);
    spyOn(enumService, "getEnumValues")
      .withArgs(enumId)
      .and.returnValue([testEnumValue]);

    const fieldConfig: EntitySchemaField = {
      dataType: "configurable-enum",
      additional: enumId,
      defaultValue: {
        mode: "static",
        value: "M",
      },
    };

    testDefaultValueCase(service, fieldConfig, testEnumValue);
    tick();
  }));

  it("should transform configurable-enum array and set the default value", fakeAsync(() => {
    const enumId = "genders";
    const testEnumValue = { id: "M", label: "male" };
    const enumService = TestBed.inject(ConfigurableEnumService);
    spyOn(enumService, "getEnumValues")
      .withArgs(enumId)
      .and.returnValue([testEnumValue]);

    const fieldConfig: EntitySchemaField = {
      dataType: "configurable-enum",
      additional: enumId,
      isArray: true,
      defaultValue: {
        mode: "static",
        value: [testEnumValue.id],
      },
    };
    testDefaultValueCase(service, fieldConfig, [testEnumValue]);
    tick();

    const fieldConfig2: EntitySchemaField = {
      dataType: "configurable-enum",
      additional: enumId,
      isArray: true,
      defaultValue: {
        mode: "static",
        value: testEnumValue.id, // should also work with single value
      },
    };
    testDefaultValueCase(service, fieldConfig2, [testEnumValue]);
    tick();
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

  it("should set 'static' default value on FormControl", () => {
    return testDefaultValueCase(
      service,
      {
        defaultValue: {
          mode: "static",
          value: "default_value",
        },
      },
      "default_value",
    );
  });

  it("should call service on dynamic mode", fakeAsync(() => {
    const setDefaultValueSpy = spyOn(
      TestBed.inject(DynamicPlaceholderValueService),
      "setDefaultValue",
    );

    testDefaultValueCase(
      service,
      {
        defaultValue: {
          mode: "dynamic",
          value: "x",
        },
      },
      null,
    );
    tick();

    // then
    expect(setDefaultValueSpy).toHaveBeenCalled();
  }));

  it("should call service on inherited mode", fakeAsync(() => {
    testDefaultValueCase(
      service,
      {
        defaultValue: {
          mode: "inherited-from-referenced-entity",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
      null,
    );
    tick();

    // then
    expect(mockInheritedValueService.initEntityForm).toHaveBeenCalled();
    expect(mockInheritedValueService.setDefaultValue).toHaveBeenCalled();
  }));
});
