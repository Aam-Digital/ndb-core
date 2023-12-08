import { HasPermissionPipe } from "./has-permission.pipe";
import { EntityAbility } from "../ability/entity-ability";
import { EntityAction, EntitySubject } from "../permission-types";

describe("HasPermissionPipe", () => {
  let pipe: HasPermissionPipe;

  let mockAbility: jasmine.SpyObj<EntityAbility>;
  let testInput: { operation: EntityAction; entity: EntitySubject };

  beforeEach(() => {
    mockAbility = jasmine.createSpyObj(["can"]);
    pipe = new HasPermissionPipe(mockAbility);

    testInput = {
      operation: "create",
      entity: "test",
    };
  });

  it("returns true if user has permission", () => {
    mockAbility.can.and.returnValue(true);
    expect(pipe.transform(testInput)).toBeTrue();
  });

  it("returns false if user does not have permission", () => {
    mockAbility.can.and.returnValue(false);
    expect(pipe.transform(testInput)).toBeFalse();
  });

  it("returns false if input is not valid", () => {
    mockAbility.can.and.returnValue(true);
    expect(pipe.transform("something else" as any)).toBeFalse();
  });
});
