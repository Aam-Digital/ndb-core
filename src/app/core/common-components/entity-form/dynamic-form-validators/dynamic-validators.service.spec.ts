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
import { Entity } from "../../../entity/model/entity";

describe("DynamicValidatorsService", () => {
  let service: DynamicValidatorsService;

  let mockedEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockedEntityMapper = jasmine.createSpyObj("EntityMapperService", [
      "loadType",
    ]);

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
    expect(resultSuccess)
      .withContext("Expected validator not to have errors")
      .toBeNull();

    const resultFailure = await validator(dummyFormControl(failureState));
    expect(resultFailure)
      .withContext("Expected validator to have errors")
      .toEqual(jasmine.any(Object));
  }

  it("should load validators from the config", () => {
    const config: FormValidatorConfig = {
      min: 9,
      pattern: "[a-z]*",
    };
    const validators = service.buildValidators(config).validators;
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
    const validators = service.buildValidators(config).validators;
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
    }).validators;
    expect(validators).toHaveSize(1);
    const invalidForm = new UntypedFormControl("09");
    const validationErrors = validators[0](invalidForm);
    expect(validationErrors.pattern).toEqual(
      jasmine.objectContaining({
        message: "M",
      }),
    );
  });

  it("should build uniqueId async validator", async () => {
    const config: FormValidatorConfig = {
      uniqueId: "Entity",
    };
    mockedEntityMapper.loadType.and.resolveTo([new Entity("existing id")]);

    const validators = service.buildValidators(config).asyncValidators;
    await testValidator(validators[0], "Entity:new id", "Entity:existing id");
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
