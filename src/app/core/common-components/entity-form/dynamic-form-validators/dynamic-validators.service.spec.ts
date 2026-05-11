import { TestBed } from "@angular/core/testing";

import {
  DynamicValidatorsService,
  patternWithMessage,
} from "./dynamic-validators.service";
import { FormValidatorConfig } from "./form-validator-config";
import {
  AsyncValidatorFn,
  UntypedFormControl,
  ValidatorFn,
} from "@angular/forms";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { calculateAge } from "../../../../utils/utils";

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  let mockedEntityMapper: any;

  beforeEach(() => {
    mockedEntityMapper = {
      loadType: vi.fn().mockName("EntityMapperService.loadType"),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockedEntityMapper },
      ],
    });
    service = TestBed.inject(DynamicValidatorsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
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
      expect(validationErrors.maxAge.errorMessage).toContain("at most");
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

  it("maps minDate to minAge validation for date-with-age fields", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { minDate: "2021-01-12" },
      entity,
      "dateOfBirth",
    ).validators;

    expect(validators).toHaveLength(1);

    const tooYoungDate = new Date(2023, 0, 1);
    const result = validators[0](new UntypedFormControl(tooYoungDate));

    const expectedMinAge = calculateAge(new Date(2021, 0, 12));
    expect(result?.minAge?.minAge).toBe(expectedMinAge);
    expect(result?.minAge?.errorMessage).toContain("Age must be at least");
    expect(result?.minDate).toBeUndefined();
  });

  it("maps maxDate to maxAge validation for date-with-age fields", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      { maxDate: "2010-01-01" },
      entity,
      "dateOfBirth",
    ).validators;

    expect(validators).toHaveLength(1);

    const tooOldDate = new Date(1990, 2, 14);
    const result = validators[0](new UntypedFormControl(tooOldDate));

    const expectedMaxAge = calculateAge(new Date(2010, 0, 1));
    expect(result?.maxAge?.maxAge).toBe(expectedMaxAge);
    expect(result?.maxAge?.errorMessage).toContain("Age must be at most");
    expect(result?.maxDate).toBeUndefined();
  });

  it("shows a between message when both age bounds are configured", () => {
    const entity = new TestEntity();
    const validators = service.buildValidators(
      {
        minDate: "2021-01-12",
        maxDate: "2010-01-01",
      },
      entity,
      "dateOfBirth",
    ).validators;

    const tooOldDate = new Date(1990, 2, 14);
    const result = validators[1](new UntypedFormControl(tooOldDate));

    expect(result?.maxAge?.errorMessage).toContain("Age must be between");
    expect(result?.maxAge?.errorMessage).toContain("and");
    expect(result?.maxAge?.errorMessage).toContain("years");
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
