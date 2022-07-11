import { TestBed } from "@angular/core/testing";

import {
  DynamicValidatorsService,
  patternWithMessage,
} from "./dynamic-validators.service";
import { FormValidatorConfig } from "./form-validator-config";
import { UntypedFormControl, ValidatorFn } from "@angular/forms";

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicValidatorsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  function testValidator(
    validator: ValidatorFn,
    successState: any,
    failureState: any
  ) {
    const results = [successState, failureState].map((state) => {
      const mockControl = new UntypedFormControl(state);
      return validator(mockControl);
    });
    expect(results[0])
      .withContext("Expected validator not to have errors")
      .toBeNull();
    expect(results[1])
      .withContext("Expected validator to have errors")
      .not.toBeNull();
  }

  it("should load validators from the config", () => {
    const config: FormValidatorConfig = {
      min: 9,
      pattern: "[a-z]*",
    };
    const validators = service.buildValidators(config);
    expect(validators).toHaveSize(2);
    testValidator(validators[0], 10, 8);
    testValidator(validators[1], "ab", "1");
  });

  it("generates a correct validator for correct configs", () => {
    const config: FormValidatorConfig = {
      min: 9,
      max: 10,
      required: true,
      validEmail: true,
      pattern: "foo",
    };
    const validators = service.buildValidators(config);
    [
      [10, 8],
      [8, 11],
      ["something", undefined],
      ["foo@bar.com", "I'm an email I swear"],
      ["foo", "bar"],
    ].forEach(([successState, failureState], index) => {
      testValidator(validators[index], successState, failureState);
    });
  });

  it("can generate a validator with custom message for patterns", () => {
    const validators = service.buildValidators({
      pattern: {
        message: "M",
        pattern: "[a-z]",
      },
    });
    expect(validators).toHaveSize(1);
    const invalidForm = new UntypedFormControl("09");
    const validationErrors = validators[0](invalidForm);
    expect(validationErrors.pattern).toEqual(
      jasmine.objectContaining({
        message: "M",
      })
    );
  });
});

describe("patternWithMessage", () => {
  const CUSTOM_MESSAGE = "Custom error message";

  it("contains a custom error message a form field contains an invalid pattern", () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const invalidFormControl = new UntypedFormControl("ab");
    const validationErrors = validationFn(invalidFormControl);
    expect(validationErrors.pattern).toEqual(
      jasmine.objectContaining({
        message: CUSTOM_MESSAGE,
      })
    );
  });

  it("returns an empty error message when the form field is valid", () => {
    const validationFn = patternWithMessage("[0-9]+", CUSTOM_MESSAGE);
    const validFormControl = new UntypedFormControl("098");
    const validationErrors = validationFn(validFormControl);
    expect(validationErrors).toBeNull();
  });
});
