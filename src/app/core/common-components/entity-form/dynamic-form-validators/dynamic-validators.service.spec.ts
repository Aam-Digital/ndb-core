import { TestBed } from "@angular/core/testing";

import { DynamicValidatorsService } from "./dynamic-validators.service";
import { patternWithMessage } from "../../../basic-datatypes/string/pattern.validator";
import {
  DYNAMIC_VALIDATORS,
  FormValidatorConfig,
} from "./form-validator-config";
import {
  AbstractControl,
  AsyncValidatorFn,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { DataFilter } from "../../../filter/filters/filters";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import { Entity } from "../../../entity/model/entity";
import { createEmbeddedEntity } from "../../../entity/model/embedded-entity";
import { FormFieldConfig } from "../FormConfig";
import {
  LinkedRecordsSource,
  registerLinkedRecordsSource,
} from "../../../basic-datatypes/entity/selection-condition";

/** a built validator: all rules run as async validators returning a promise */
type Check = (control: AbstractControl) => Promise<ValidationErrors | null>;

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  let mockedEntityMapper: any;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CoreTestingModule] });
    mockedEntityMapper = TestBed.inject(EntityMapperService);
    vi.spyOn(mockedEntityMapper, "loadType");
    vi.spyOn(mockedEntityMapper, "load");
    service = TestBed.inject(DynamicValidatorsService);
  });

  async function testValidator(
    validator: ValidatorFn | AsyncValidatorFn,
    successState: any,
    failureState: any,
  ) {
    function dummyFormControl(state) {
      const control = new UntypedFormControl(state);
      control.markAsDirty();
      return control;
    }

    const resultSuccess = await validator(dummyFormControl(successState));
    expect(resultSuccess, "Expected validator not to have errors").toBeNull();

    const resultFailure = await validator(dummyFormControl(failureState));
    expect(resultFailure, "Expected validator to have errors").toEqual(
      expect.any(Object),
    );
  }

  it("should load validators from the config", async () => {
    const config: FormValidatorConfig = {
      min: 9,
      pattern: "[a-z]*",
    };
    const validators = service.buildValidators(config, new TestEntity())
      .asyncValidators as Check[];
    expect(validators).toHaveLength(2);
    await testValidator(validators[0], 10, 8);
    await testValidator(validators[1], "ab", "1");
  });

  it("generates a correct validator for correct configs", async () => {
    const config: FormValidatorConfig = {
      min: 9,
      max: 10,
      pattern: "foo",
    };
    const validators = service.buildValidators(config, new TestEntity())
      .asyncValidators as Check[];
    for (const [index, [successState, failureState]] of [
      [10, 8],
      [8, 11],
      ["foo", "bar"],
    ].entries()) {
      await testValidator(validators[index], successState, failureState);
    }
  });

  it("can generate a validator with custom message for patterns", async () => {
    const validators = service.buildValidators(
      {
        pattern: {
          message: "M",
          pattern: "[a-z]",
        },
      },
      new TestEntity(),
    ).asyncValidators as Check[];
    expect(validators).toHaveLength(1);
    const invalidForm = new UntypedFormControl("09");
    const validationErrors = await validators[0](invalidForm);
    expect(validationErrors.pattern).toEqual(
      expect.objectContaining({
        message: "M",
      }),
    );
  });

  it("should validate minDate and maxDate", async () => {
    const config: FormValidatorConfig = {
      minDate: "2010-01-01",
      maxDate: "2020-12-31",
    };

    const validators = service.buildValidators(config, new TestEntity())
      .asyncValidators as Check[];

    expect(validators).toHaveLength(2);
    await testValidator(
      validators[0],
      new Date(2010, 0, 1),
      new Date(2009, 11, 31),
    );
    await testValidator(
      validators[1],
      new Date(2020, 11, 31),
      new Date(2021, 0, 1),
    );

    const invalidDateControl = new UntypedFormControl(new Date(2009, 11, 31));
    invalidDateControl.markAsDirty();
    const validationErrors = await validators[0](invalidDateControl);
    expect(validationErrors.minDate.errorMessage).toContain("on or after");
  });

  it("should validate minAge and maxAge", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 24));

    try {
      const config: FormValidatorConfig = {
        minAge: 9,
        maxAge: 25,
      };

      const validators = service.buildValidators(config, new TestEntity())
        .asyncValidators as Check[];

      expect(validators).toHaveLength(2);
      await testValidator(
        validators[0],
        new Date(2015, 3, 24),
        new Date(2018, 3, 25),
      );
      await testValidator(
        validators[1],
        new Date(2010, 3, 24),
        new Date(1990, 3, 24),
      );

      const invalidAgeControl = new UntypedFormControl(new Date(1990, 3, 24));
      invalidAgeControl.markAsDirty();
      const validationErrors = await validators[1](invalidAgeControl);
      expect(validationErrors.maxAge.errorMessage).toContain("between");
      expect(validationErrors.maxAge.errorMessage).toContain("9 and 25");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should build uniqueId async validator", async () => {
    const config: FormValidatorConfig = {
      uniqueId: true,
    };
    mockedEntityMapper.loadType.mockResolvedValue([
      TestEntity.create({ name: "existing id" }),
    ]);

    const validators = service.buildValidators(
      config,
      new TestEntity(),
      "name",
    ).asyncValidators;
    await testValidator(validators[0], "new id", "existing id");

    const duplicateControl = new UntypedFormControl("existing id");
    duplicateControl.markAsDirty();
    const validationErrors = await validators[0](duplicateControl);
    expect(validationErrors.uniqueId.errorMessage).toContain("already exists");
    expect(validationErrors.uniqueProperty).toBeUndefined();

    expect(mockedEntityMapper.loadType).toHaveBeenCalledWith("TestEntity");
  });

  it("still runs the async checks of a field while one of its checks only warns", async () => {
    mockedEntityMapper.loadType.mockResolvedValue([
      TestEntity.create({ name: "abc" }),
    ]);
    const control = new UntypedFormControl(
      "",
      service.buildValidators(
        { pattern: "^[A-Z]+$", uniqueId: true, _warningOnly: ["pattern"] },
        new TestEntity(),
        "name",
      ),
    );

    control.setValue("abc");
    await vi.waitFor(() => expect(control.pending).toBe(false));

    expect(control.errors).toEqual({
      pattern: expect.objectContaining({ warning: true }),
      uniqueId: expect.objectContaining({ errorMessage: expect.any(String) }),
    });
  });

  it("lets form fields see that a field is required", () => {
    const control = new UntypedFormControl(
      null,
      service.buildValidators({ required: true }, new TestEntity()),
    );

    expect(control.hasValidator(Validators.required)).toBe(true);
  });

  it("does not leave a field pending when a check fails", async () => {
    mockedEntityMapper.loadType.mockRejectedValue(new Error("not loaded"));
    const control = new UntypedFormControl(
      "",
      service.buildValidators({ uniqueId: true }, new TestEntity(), "name"),
    );

    control.setValue("abc");
    await vi.waitFor(() => expect(control.pending).toBe(false));

    expect(control.errors).toBeNull();
  });

  it("leaves no error on a field that was disabled while it was checked", async () => {
    const control = new UntypedFormControl(
      -5,
      service.buildValidators({ min: 0 }, new TestEntity()),
    );

    control.disable();
    await new Promise((resolve) => setTimeout(resolve));

    expect(control.errors).toBeNull();
  });

  it("locks an empty required field with readonlyAfterSet of a saved record right away", async () => {
    const entity = new TestEntity();
    entity["_rev"] = "1-abc";
    const control = new UntypedFormControl(
      null,
      service.buildValidators(
        { required: true, readonlyAfterSet: true },
        entity,
        "name",
      ),
    );

    await vi.waitFor(() => expect(control.disabled).toBe(true));
  });

  it("gives every registered rule a label for the admin tab", () => {
    for (const rule of service.rules.values()) {
      expect(rule.label, rule.key).toBeTruthy();
    }
  });

  it.each([
    ["minDate", "date", "Minimum Date"],
    ["minDate", "month", "Minimum Month"],
    ["maxDate", "date-only", "Maximum Date"],
    ["maxDate", "month", "Maximum Month"],
  ])("names the %s limit of a %s field %s", (key, dataType, label) => {
    const datatype =
      TestBed.inject(EntitySchemaService).getDatatypeOrDefault(dataType);

    expect(service.rules.get(key).labelFor(datatype)).toBe(label);
  });

  it("skips the uniqueId validator for inner fields of embedded entries", async () => {
    const entry = createEmbeddedEntity(new Map(), {
      record: new Entity("record"),
      field: "documents",
      existing: false,
    });

    const options = service.buildValidators(
      { uniqueId: true },
      entry,
      "documentNumber",
    );

    expect(options.asyncValidators).toEqual([]);
  });

  it.each([
    [{ required: true }, null, expect.any(String)],
    [{ min: 9 }, 8, expect.stringContaining("9")],
    [{ max: 10 }, 11, expect.stringContaining("10")],
    [{ pattern: "[a-z]+" }, "123", expect.any(String)],
  ])(
    "adds a readable message to the error of %o",
    async (config: FormValidatorConfig, invalidValue, message) => {
      const control = new UntypedFormControl(
        invalidValue,
        service.buildValidators(config, new TestEntity()),
      );
      await vi.waitFor(() => expect(control.pending).toBe(false));

      expect(control.errors[Object.keys(config)[0]].errorMessage).toEqual(
        message,
      );
    },
  );

  it.each([
    [{ unknownRule: 5, max: 5 }, 1],
    [{ required: false, uniqueId: false, readonlyAfterSet: false }, 0],
  ])(
    "builds only the validators that exist and are switched on: %o",
    async (config, expectedCount) => {
      const options = service.buildValidators(
        config as FormValidatorConfig,
        new TestEntity(),
        "name",
      );

      expect(options.asyncValidators).toHaveLength(expectedCount);
    },
  );

  it.each([
    ["a text", String.raw`^\d+$`],
    ["a regular expression", /^\d+$/],
  ])("checks a pattern given as %s", async (_, pattern) => {
    const validator = service.buildValidators({ pattern }, new TestEntity())
      .asyncValidators[0] as Check;

    expect(await validator(new UntypedFormControl("12"))).toBeNull();
    expect(
      (await validator(new UntypedFormControl("1a")))?.pattern,
    ).toBeDefined();
  });

  it("adds no pattern check for a pattern without value", async () => {
    const options = service.buildValidators(
      { pattern: null },
      new TestEntity(),
    );

    expect(options.asyncValidators).toEqual([]);
  });

  it.each([
    [{ max: 10, _warningOnly: ["max"] }, 11, "max", true],
    [{ max: 10 }, 11, "max", undefined],
    [
      { required: true, _warningOnly: ["required"] },
      null,
      "required",
      undefined,
    ],
  ])(
    "makes an error only a warning if _warningOnly lists a validator that can be one: %o",
    async (config: FormValidatorConfig, invalidValue, key, warning) => {
      const control = new UntypedFormControl(
        invalidValue,
        service.buildValidators(config, new TestEntity()),
      );
      await vi.waitFor(() => expect(control.pending).toBe(false));

      expect(control.errors[key].warning).toBe(warning);
    },
  );

  it("registers a rule for each validator key of the config type", async () => {
    const keys = [...service.rules.keys()];

    expect(new Set(keys)).toEqual(new Set(DYNAMIC_VALIDATORS));
    expect(keys).toHaveLength(DYNAMIC_VALIDATORS.length);
  });

  describe("withinParent", () => {
    const parent = Object.assign(TestEntity.create("Training"), {
      period: { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) },
    });
    const outside = {
      start: new Date(2026, 4, 20),
      end: new Date(2026, 5, 15),
    };

    /**
     * @param parentInForm the parent link entered in the form; undefined if the form has no such field
     * @param parentOfRecord the parent link saved for the record
     */
    function validate(
      period: object,
      parentInForm: string | null | undefined,
      parentOfRecord?: string,
      anonymized = false,
    ) {
      const record = Object.assign(new TestEntity(), {
        ref: parentOfRecord,
        anonymized,
      });
      const { asyncValidators } = service.buildValidators(
        { withinParent: { parentReferenceField: "ref" } },
        record,
        "period",
      );
      const form = new UntypedFormGroup({
        period: new UntypedFormControl(period),
        ...(parentInForm !== undefined && {
          ref: new UntypedFormControl(parentInForm),
        }),
      });
      return (asyncValidators as AsyncValidatorFn[])[0](form.get("period"));
    }

    beforeEach(() => mockedEntityMapper.load.mockResolvedValue(parent));

    it("returns a warning with the parent's name for a period beyond the parent's", async () => {
      expect(await validate(outside, parent.getId())).toEqual({
        withinParent: {
          warning: true,
          errorMessage: "Outside the period of Training",
        },
      });
    });

    it.each<[string, object, string | null | undefined, string?, boolean?]>([
      [
        "a period within the parent's",
        { start: new Date(2026, 2, 10), end: new Date(2026, 2, 20) },
        parent.getId(),
      ],
      ["no parent linked", outside, null],
      ["a link removed in the form", outside, null, parent.getId()],
      ["an anonymized record", outside, parent.getId(), undefined, true],
    ])(
      "returns nothing for %s",
      async (_, period, parentInForm, parentOfRecord, anonymized) => {
        expect(
          await validate(period, parentInForm, parentOfRecord, anonymized),
        ).toBeNull();
      },
    );

    it("uses the saved parent link if the form has no field for it", async () => {
      expect(await validate(outside, undefined, parent.getId())).toEqual({
        withinParent: expect.objectContaining({ warning: true }),
      });
    });
  });

  describe("selectionCondition", () => {
    const anna = TestEntity.create({ name: "Anna", other: "BERLIN" });
    const ben = TestEntity.create({ name: "Ben", other: "HAMBURG" });
    const sameLocation = { other: { $in: ["$current_record.other"] } };
    const linkField: FormFieldConfig = {
      id: "ref",
      additional: TestEntity.ENTITY_TYPE,
    };

    /**
     * @param recordInForm values of the record being edited, entered in other fields of the form
     * @param singleRecord false if the form edits several records at once (bulk edit)
     * @param field the config of the link field in the form
     * @param changed the fields of the form changed by the user (dirty), by default the link field
     * @param dropdown what the dropdown editing the field shares with the validator, if any
     */
    function validate(
      selected: string | string[],
      condition: DataFilter<TestEntity>,
      recordInForm: Partial<TestEntity> = {},
      singleRecord?: boolean,
      {
        field = linkField,
        changed = [field.id],
        dropdown,
      }: {
        field?: FormFieldConfig;
        changed?: string[];
        dropdown?: LinkedRecordsSource;
      } = {},
    ) {
      const { asyncValidators } = service.buildValidators(
        { selectionCondition: condition },
        new TestEntity(),
        field,
        singleRecord,
      );
      const form = new UntypedFormGroup({
        [field.id]: new UntypedFormControl(selected),
        ...Object.fromEntries(
          Object.entries(recordInForm).map(([id, value]) => [
            id,
            new UntypedFormControl(value),
          ]),
        ),
      });
      changed.forEach((id) => form.get(id).markAsDirty());
      if (dropdown) {
        registerLinkedRecordsSource(form.get(field.id), dropdown);
      }
      return (asyncValidators as AsyncValidatorFn[])[0](form.get(field.id));
    }

    beforeEach(() => mockedEntityMapper.addAll([anna, ben]));

    it("returns a warning naming the selected records that do not match, compared with the record being edited", async () => {
      expect(
        // a legacy id without the type prefix is found as well
        await validate([anna.getId(), ben.getId(true)], sameLocation, {
          other: "BERLIN",
        }),
      ).toEqual({
        selectionCondition: {
          warning: true,
          errorMessage:
            "Not matching the selection conditions of this field: Ben",
        },
      });
      // only the selected records, not all records of the linked type
      expect(mockedEntityMapper.load).toHaveBeenCalledTimes(2);
      expect(mockedEntityMapper.loadType).not.toHaveBeenCalled();
    });

    it("uses the record types and the records loaded by the dropdown editing the field", async () => {
      const loadedBen = Object.assign(ben.copy(), { name: "Ben (as loaded)" });
      const dropdown: LinkedRecordsSource = {
        entityTypes: () => [TestEntity.ENTITY_TYPE],
        getLoaded: (id) => (id === ben.getId() ? loadedBen : undefined),
      };
      // in the form, the field links to several types, for which the dropdown does not filter
      const field = {
        id: "ref",
        additional: [TestEntity.ENTITY_TYPE, "OtherType"],
      };

      expect(
        await validate(ben.getId(), sameLocation, { other: "BERLIN" }, true, {
          field,
          dropdown,
        }),
      ).toEqual({
        selectionCondition: expect.objectContaining({
          errorMessage: expect.stringContaining("Ben (as loaded)"),
        }),
      });
      expect(mockedEntityMapper.load).not.toHaveBeenCalled();
    });

    it("does not check records linked before while neither the field nor a field its condition refers to is changed", async () => {
      expect(
        await validate(
          ben.getId(),
          sameLocation,
          { other: "BERLIN", name: "changed" },
          true,
          { changed: ["name"] },
        ),
      ).toBeNull();
      expect(mockedEntityMapper.load).not.toHaveBeenCalled();
    });

    it("checks the records linked before once a field its condition refers to is changed", async () => {
      expect(
        await validate(ben.getId(), sameLocation, { other: "BERLIN" }, true, {
          changed: ["other"],
        }),
      ).toEqual({
        selectionCondition: expect.objectContaining({ warning: true }),
      });
    });

    it("checks the record types of the field in the form, which can differ from the schema", async () => {
      // in the schema, `refMixed` links to several types, for which a condition does not apply
      const field = { id: "refMixed", additional: TestEntity.ENTITY_TYPE };

      expect(
        await validate(ben.getId(), sameLocation, { other: "BERLIN" }, true, {
          field,
        }),
      ).toEqual({
        selectionCondition: expect.objectContaining({ warning: true }),
      });
    });

    it.each<
      [
        string,
        string | string[],
        DataFilter<TestEntity>,
        Partial<TestEntity>?,
        boolean?,
      ]
    >([
      ["matching records", [anna.getId()], { other: { $in: ["BERLIN"] } }],
      ["no selection", [], { other: { $in: ["BERLIN"] } }],
      [
        "a selected record that cannot be loaded",
        `${TestEntity.ENTITY_TYPE}:deleted`,
        { other: { $in: ["BERLIN"] } },
      ],
      [
        "a condition referring to an empty field of the record",
        ben.getId(),
        sameLocation,
        { other: null },
      ],
      [
        "a form without one single record (bulk edit)",
        ben.getId(),
        sameLocation,
        { other: "BERLIN" },
        false,
      ],
    ])(
      "returns nothing for %s",
      async (_, selected, condition, recordInForm, singleRecord) => {
        expect(
          await validate(selected, condition, recordInForm, singleRecord),
        ).toBeNull();
      },
    );

    it.each([
      [{ selectionCondition: { other: "BERLIN" } }, undefined],
      [{ uniqueId: true }, "blur"],
      [{ uniqueId: true, selectionCondition: { other: "BERLIN" } }, "blur"],
    ])(
      "checks a selection right away, but the whole field only when leaving it if another async check needs that: %o",
      async (config: FormValidatorConfig, updateOn) => {
        expect(
          service.buildValidators(config, new TestEntity(), "ref").updateOn,
        ).toBe(updateOn);
      },
    );

    it("names the fields of the record that the condition refers to as dependencies", async () => {
      const dependencies = service.getDependencies({
        withinParent: { parentReferenceField: "ref" },
        selectionCondition: {
          $or: [sameLocation, { category: "$current_record.category" }],
        },
      });

      expect(new Set(dependencies)).toEqual(
        new Set(["category", "other", "ref"]),
      );
    });
  });

  it("keeps minDate as a date validator for date-with-age fields", async () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { minDate: "2021-01-12" },
      entity,
      "dateOfBirth",
    ).asyncValidators as Check[];

    expect(validators).toHaveLength(1);

    const tooEarlyDate = new Date(2020, 0, 1);
    const result = await validators[0](new UntypedFormControl(tooEarlyDate));

    expect(result?.minDate?.minDate).toEqual(new Date(2021, 0, 12));
    expect(result?.minDate?.errorMessage).toContain("Date must be on or after");
    expect(result?.minAge).toBeUndefined();
  });

  it("keeps maxDate as a date validator for date-with-age fields", async () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { maxDate: "2010-01-01" },
      entity,
      "dateOfBirth",
    ).asyncValidators as Check[];

    expect(validators).toHaveLength(1);

    const tooLateDate = new Date(2011, 0, 1);
    const result = await validators[0](new UntypedFormControl(tooLateDate));

    expect(result?.maxDate?.maxDate).toEqual(new Date(2010, 0, 1));
    expect(result?.maxDate?.errorMessage).toContain(
      "Date must be on or before",
    );
    expect(result?.maxAge).toBeUndefined();
  });

  it("shows a between message when both age bounds are configured", async () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      {
        minAge: 10,
        maxAge: 15,
      },
      entity,
      "dateOfBirth",
    ).asyncValidators as Check[];

    const tooOldDate = new Date(2000, 2, 14);
    const result = await validators[1](new UntypedFormControl(tooOldDate));

    expect(result?.maxAge?.errorMessage).toContain("Age must be between");
    expect(result?.maxAge?.errorMessage).toContain("and");
    expect(result?.maxAge?.errorMessage).toContain("years");
  });

  it("does not convert date validators into age validators for date-with-age fields", async () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { minDate: "2021-01-12", maxDate: "2010-01-01" },
      entity,
      "dateOfBirth",
    ).asyncValidators as Check[];

    expect(validators).toHaveLength(2);
    const result = await validators[0](
      new UntypedFormControl(new Date(2020, 0, 1)),
    );
    expect(result?.minDate).toBeDefined();
    expect(result?.minAge).toBeUndefined();
  });
});

describe("patternWithMessage", () => {
  const CUSTOM_MESSAGE = "Custom error message";

  it("contains a custom error message a form field contains an invalid pattern", async () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const invalidFormControl = new UntypedFormControl("ab");
    const validationErrors = validationFn(invalidFormControl);
    expect(validationErrors.pattern).toEqual(
      expect.objectContaining({
        message: CUSTOM_MESSAGE,
      }),
    );
  });

  it("returns an empty error message when the form field is valid", async () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const validFormControl = new UntypedFormControl("098");
    const validationErrors = validationFn(validFormControl);
    expect(validationErrors).toBeNull();
  });
});
