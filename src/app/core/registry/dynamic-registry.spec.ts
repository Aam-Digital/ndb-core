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

  it("should allow to register callbacks that are executed on every registered element", () => {
    const callback = jasmine.createSpy();

    registry.add("first", "1");
    registry.add("second", "2");

    registry.registerCallback(callback);

    expect(callback).toHaveBeenCalledWith("first", "1");
    expect(callback).toHaveBeenCalledWith("second", "2");

    registry.add("third", "3");

    expect(callback).toHaveBeenCalledWith("third", "3");

    const callback2 = jasmine.createSpy();
    registry.registerCallback(callback2);

    expect(callback2).toHaveBeenCalledWith("first", "1");
    expect(callback2).toHaveBeenCalledWith("second", "2");
    expect(callback2).toHaveBeenCalledWith("third", "3");

    registry.add("fourth", "4");

    expect(callback2).toHaveBeenCalledWith("fourth", "4");
    expect(callback).toHaveBeenCalledWith("fourth", "4");
  });
});
