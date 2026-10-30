import { TestBed } from "@angular/core/testing";

import {
  DynamicValidatorsService,
  patternWithMessage,
} from "./dynamic-validators.service";
import { FormValidatorConfig } from "./form-validator-config";
import {
  AsyncValidatorFn,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
} from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  let mockedEntityMapper: any;

  beforeEach(() => {
    mockedEntityMapper = {
      loadType: vi.fn().mockName("EntityMapperService.loadType"),
      load: vi.fn().mockName("EntityMapperService.load"),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
      ],
    });
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

  it("should load validators from the config", () => {
    const config: FormValidatorConfig = {
      min: 9,
      pattern: "[a-z]*",
    };
    const validators = service.buildValidators(
      config,
      new TestEntity(),
    ).validators;
    expect(validators).toHaveLength(2);
    testValidator(validators[0], 10, 8);
    testValidator(validators[1], "ab", "1");
  });

  it("generates a correct validator for correct configs", () => {
    const config: FormValidatorConfig = {
      min: 9,
      max: 10,
      required: true,
      pattern: "foo",
    };
    const validators = service.buildValidators(
      config,
      new TestEntity(),
    ).validators;
    [
      [10, 8],
      [8, 11],
      ["something", undefined],
      ["foo", "bar"],
    ].forEach(([successState, failureState], index) => {
      testValidator(validators[index], successState, failureState);
    });
  });

  it("can generate a validator with custom message for patterns", () => {
    const validators = service.buildValidators(
      {
        pattern: {
          message: "M",
          pattern: "[a-z]",
        },
      },
      new TestEntity(),
    ).validators;
    expect(validators).toHaveLength(1);
    const invalidForm = new UntypedFormControl("09");
    const validationErrors = validators[0](invalidForm);
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

    const validators = service.buildValidators(
      config,
      new TestEntity(),
    ).validators;

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
    const validationErrors = validators[0](invalidDateControl);
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

      const validators = service.buildValidators(
        config,
        new TestEntity(),
      ).validators;

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
      const validationErrors = validators[1](invalidAgeControl);
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

  it("keeps minDate as a date validator for date-with-age fields", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { minDate: "2021-01-12" },
      entity,
      "dateOfBirth",
    ).validators;

    expect(validators).toHaveLength(1);

    const tooEarlyDate = new Date(2020, 0, 1);
    const result = validators[0](new UntypedFormControl(tooEarlyDate));

    expect(result?.minDate?.minDate).toEqual(new Date(2021, 0, 12));
    expect(result?.minDate?.errorMessage).toContain("Date must be on or after");
    expect(result?.minAge).toBeUndefined();
  });

  it("keeps maxDate as a date validator for date-with-age fields", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { maxDate: "2010-01-01" },
      entity,
      "dateOfBirth",
    ).validators;

    expect(validators).toHaveLength(1);

    const tooLateDate = new Date(2011, 0, 1);
    const result = validators[0](new UntypedFormControl(tooLateDate));

    expect(result?.maxDate?.maxDate).toEqual(new Date(2010, 0, 1));
    expect(result?.maxDate?.errorMessage).toContain(
      "Date must be on or before",
    );
    expect(result?.maxAge).toBeUndefined();
  });

  it("shows a between message when both age bounds are configured", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      {
        minAge: 10,
        maxAge: 15,
      },
      entity,
      "dateOfBirth",
    ).validators;

    const tooOldDate = new Date(2000, 2, 14);
    const result = validators[1](new UntypedFormControl(tooOldDate));

    expect(result?.maxAge?.errorMessage).toContain("Age must be between");
    expect(result?.maxAge?.errorMessage).toContain("and");
    expect(result?.maxAge?.errorMessage).toContain("years");
  });

  it("does not convert date validators into age validators for date-with-age fields", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { minDate: "2021-01-12", maxDate: "2010-01-01" },
      entity,
      "dateOfBirth",
    ).validators;

    expect(validators).toHaveLength(2);
    const result = validators[0](new UntypedFormControl(new Date(2020, 0, 1)));
    expect(result?.minDate).toBeDefined();
    expect(result?.minAge).toBeUndefined();
  });
});

describe("patternWithMessage", () => {
  const CUSTOM_MESSAGE = "Custom error message";

  it("contains a custom error message a form field contains an invalid pattern", () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const invalidFormControl = new UntypedFormControl("ab");
    const validationErrors = validationFn(invalidFormControl);
    expect(validationErrors.pattern).toEqual(
      expect.objectContaining({
        message: CUSTOM_MESSAGE,
      }),
    );
  });

  it("returns an empty error message when the form field is valid", () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const validFormControl = new UntypedFormControl("098");
    const validationErrors = validationFn(validFormControl);
    expect(validationErrors).toBeNull();
  });
});
