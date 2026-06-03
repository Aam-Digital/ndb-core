import { Entity } from "../../../entity/model/entity";
import { buildReadonlyValidator } from "./readonly-after-set.validator";
import { FormControl } from "@angular/forms";

describe("buildReadonlyValidator", () => {
  it("should return a sync validator (not async) so updateOn:blur is not forced", () => {
    const validator = buildReadonlyValidator(new Entity("1"));
    expect((validator as any).async).toBeFalsy();
  });

  it("should not return errors (validator only manages disabled state)", () => {
    const entity = new Entity("new");
    const validator = buildReadonlyValidator(entity);
    const control = new FormControl("test");
    const result = (validator.fn as any)(control);
    expect(result).toBeNull();
  });

  it("should schedule disable when entity is not new", async () => {
    const entity = new Entity("existing");
    entity["_rev"] = "1-abc"; // marks entity as saved (not new)
    const validator = buildReadonlyValidator(entity);
    const control = new FormControl("test");

    (validator.fn as any)(control);

    await Promise.resolve();
    expect(control.disabled).toBe(true);
  });

  it("should not disable control when entity is new", async () => {
    const entity = new Entity("new");
    const validator = buildReadonlyValidator(entity);
    const control = new FormControl("test");

    (validator.fn as any)(control);

    await Promise.resolve();
    expect(control.disabled).toBe(false);
  });
});
