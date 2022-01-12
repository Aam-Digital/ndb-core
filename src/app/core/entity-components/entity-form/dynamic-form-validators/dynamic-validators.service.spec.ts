import { TestBed } from "@angular/core/testing";

import { DynamicValidatorsService } from "./dynamic-validators.service";
import { FormValidatorConfig } from "./form-validator-config";
import { FormControl, ValidatorFn } from "@angular/forms";
import { LoggingService } from "../../../logging/logging.service";

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoggingService],
    });
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
      const mockControl = new FormControl(state);
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
});
