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

  it("should report a default value without a valid mode", () => {
    const problems = service.validate({
      "entity:TestEntity": {
        attributes: { status: { defaultValue: { mode: null } } },
      },
    });

    expect(problems).toEqual([expect.objectContaining({ field: "status" })]);
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
});
