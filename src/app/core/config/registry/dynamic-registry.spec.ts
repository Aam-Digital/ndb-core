import { Registry } from "./dynamic-registry";

describe("DynamicRegistry", () => {
  let registry: Registry<string>;
  beforeEach(() => {
    class StringRegistry extends Registry<string> {}
    registry = new StringRegistry();
  });

  it("should not throw errors when allowing multiple registrations", () => {
    const key = "testKey";
    registry.add(key, "some value");
    expect(() => registry.add(key, "updated value")).toThrowError();
    expect(registry.get(key)).toBe("some value");

    registry.allowDuplicates();

    expect(() => registry.add(key, "updated value 2")).not.toThrowError();
    expect(registry.get(key)).toBe("updated value 2");
  });
});
