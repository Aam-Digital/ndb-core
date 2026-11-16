import { TestBed } from "@angular/core/testing";
import { ConfigValidationService } from "./config-validation.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { AlertService } from "../../alerts/alert.service";

describe("ConfigValidationService", () => {
  let service: ConfigValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    service = TestBed.inject(ConfigValidationService);
  });

  it("should not find problems in a valid config", () => {
    const problems = service.validate({
      "entity:TestEntity": {
        icon: "child",
        attributes: {
          name: { dataType: "string", validators: { required: true } },
          school: { dataType: "entity", additional: "TestEntity" },
          start: { dataType: "date", defaultValue: { mode: "static" } },
        },
      },
      navigationMenu: { items: [{ label: "Home", icon: "home" }] },
    });

    expect(problems).toEqual([]);
  });

  it("should report an unknown dataType, with a hint if an entity type was meant", () => {
    const problems = service.validate({
      "entity:School": { attributes: {} },
      "entity:TestEntity": {
        attributes: {
          school: { dataType: "School" },
          other: { dataType: "doesNotExist" },
        },
      },
    });

    expect(problems).toEqual([
      expect.objectContaining({
        configId: "entity:TestEntity",
        field: "school",
        message: expect.stringContaining('"entity"'),
      }),
      expect.objectContaining({ field: "other" }),
    ]);
  });

  it("should report unknown validators and suggest 'pattern' for 'regex'", () => {
    const problems = service.validate({
      "entity:TestEntity": {
        attributes: { phone: { validators: { regex: "[0-9]*" } } },
      },
    });

    expect(problems).toEqual([
      expect.objectContaining({
        field: "phone",
        message: expect.stringContaining('"pattern"'),
      }),
    ]);
  });

  it("should report validators not fitting the type of the field", () => {
    const problems = service.validate({
      "entity:TestEntity": {
        attributes: {
          count: { dataType: "number", validators: { pattern: "[0-9]+" } },
          mail: { dataType: "email", validators: { pattern: "@x\\.org$" } },
          overridden: { validators: { pattern: "[0-9]+" } },
        },
      },
    });

    expect(problems).toEqual([
      expect.objectContaining({
        field: "count",
        message: expect.stringContaining('"pattern"'),
      }),
    ]);
  });

  it.each([
    [{ max: 10, _warningOnly: ["max"] }, []],
    [{ required: true, _warningOnly: ["required"] }, ['"required"']],
    [{ max: 10, _warningOnly: ["min"] }, ['"min"']],
  ])(
    "reports validators in _warningOnly that are not set or cannot be a warning: %o",
    (validators, problemsAbout) => {
      const problems = service.validate({
        "entity:TestEntity": {
          attributes: { other: { dataType: "number", validators } },
        },
      });

      expect(problems).toEqual(
        problemsAbout.map((about) =>
          expect.objectContaining({ message: expect.stringContaining(about) }),
        ),
      );
    },
  );

  it.each([
    ["a field not linking to records", { dataType: "string" }, "linking"],
    [
      "a field linking to several record types",
      { dataType: "entity", additional: ["TestEntity", "User"] },
      "one record type",
    ],
    [
      "a field of embedded entries (instead of its inner field)",
      { dataType: "attendance" },
      "additional.participant.validators",
    ],
  ])(
    "should report a selectionCondition on %s, where it is ignored",
    (_, field, hint) => {
      const problems = service.validate({
        "entity:TestEntity": {
          attributes: {
            ref: { ...field, validators: { selectionCondition: { a: 1 } } },
            // applies: a link to one record type
            single: {
              dataType: "entity",
              additional: ["TestEntity"],
              validators: { selectionCondition: { a: 1 } },
            },
          },
        },
      });

      expect(problems).toEqual([
        expect.objectContaining({
          field: "ref",
          message: expect.stringContaining(hint),
        }),
      ]);
    },
  );

  describe("selectionCondition referring to a field of a linked record", () => {
    /** check a link field whose selection filter compares with the given placeholder */
    function validatePlaceholder(placeholder: string) {
      return service.validate({
        "entity:OnlyInConfig": { attributes: { city: { dataType: "string" } } },
        "entity:Extended": {
          extends: "TestEntity",
          attributes: { extra: { dataType: "string" } },
        },
        "entity:TestEntity": {
          attributes: {
            configLink: { dataType: "entity", additional: "OnlyInConfig" },
            extendedLink: { dataType: "entity", additional: "Extended" },
            // replaces the link field of the code, like the app does with a field of the config
            refMixed: { label: "Renamed" },
            single: {
              dataType: "entity",
              additional: "TestEntity",
              validators: { selectionCondition: { other: placeholder } },
            },
          },
        },
      });
    }

    it.each([
      ["more than one linked record", "ref.ref.other", "more than one"],
      ["a field that does not link to records", "other.name", '"other"'],
      ["a field that the record type does not have", "typo.name", '"typo"'],
      ["a field that the linked records do not have", "ref.typo", '"typo"'],
      [
        "a field that the config redefines without linking to records",
        "refMixed.subject",
        '"refMixed"',
      ],
    ])("should report a placeholder going through %s", (_, path, hint) => {
      expect(validatePlaceholder("$current_record." + path)).toEqual([
        expect.objectContaining({
          field: "single",
          message: expect.stringContaining(hint),
        }),
      ]);
    });

    it.each([
      ["a field of the record itself", "other"],
      ["a field of the linked record", "ref.other"],
      ["the linked record itself", "ref._id"],
      ["a field that only the config defines", "configLink.city"],
      ["a general field of a record type of the config", "configLink.inactive"],
      [
        "a field that a new record type of the config takes from the type it extends",
        "extendedLink.other",
      ],
    ])("should accept a placeholder referring to %s", (_, path) => {
      expect(validatePlaceholder("$current_record." + path)).toEqual([]);
    });
  });

  it("should report a default value without a valid mode", () => {
    const problems = service.validate({
      "entity:TestEntity": {
        attributes: { status: { defaultValue: { mode: null } } },
      },
    });

    expect(problems).toEqual([expect.objectContaining({ field: "status" })]);
    // an empty mode is not printed literally
    expect(problems[0].message).not.toMatch(/null|undefined/);
  });

  it("should report unknown icons of entity types and menu items", () => {
    const problems = service.validate({
      "entity:TestEntity": { icon: "medium" },
      navigationMenu: {
        items: [{ label: "Main", subMenu: [{ label: "Sub", icon: "nope" }] }],
      },
    });

    expect(problems.map((p) => p.configId)).toEqual([
      "entity:TestEntity",
      "navigationMenu",
    ]);
  });

  it("should warn admins about problems, but not other users", () => {
    const alertService = TestBed.inject(AlertService);
    vi.spyOn(alertService, "addWarning");
    const ability = TestBed.inject(EntityAbility);
    const invalidConfig = {
      "entity:TestEntity": { attributes: { x: { dataType: "doesNotExist" } } },
    };

    vi.spyOn(ability, "cannot").mockReturnValue(true);
    service.warnAdminAboutProblems(invalidConfig);
    expect(alertService.addWarning).not.toHaveBeenCalled();

    vi.spyOn(ability, "cannot").mockReturnValue(false);
    service.warnAdminAboutProblems(invalidConfig);
    expect(alertService.addWarning).toHaveBeenCalledWith(
      expect.stringContaining("doesNotExist"),
    );
  });

  it("should list all problems in the warning", () => {
    const alertService = TestBed.inject(AlertService);
    vi.spyOn(alertService, "addWarning");
    vi.spyOn(TestBed.inject(EntityAbility), "cannot").mockReturnValue(false);
    const attributes = Object.fromEntries(
      [1, 2, 3, 4, 5].map((i) => [`field${i}`, { dataType: `unknown${i}` }]),
    );

    service.warnAdminAboutProblems({ "entity:TestEntity": { attributes } });

    const message = vi.mocked(alertService.addWarning).mock.calls[0][0];
    for (const i of [1, 2, 3, 4, 5]) {
      expect(message).toContain(`unknown${i}`);
    }
  });
});
