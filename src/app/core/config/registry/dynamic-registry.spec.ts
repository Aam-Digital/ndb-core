import {
  Registry,
  RegistryDuplicateError,
  RegistryLookupError,
} from "./dynamic-registry";
import { entityRegistry } from "../../entity/database-entity.decorator";

describe("DynamicRegistry", () => {
  let registry: Registry<string>;

  beforeEach(() => {
    class StringRegistry extends Registry<string> {}
    registry = new StringRegistry();
  });

  it("should not throw errors when allowing multiple registrations", () => {
    registry.allowDuplicates(false);

    const key = "testKey";
    registry.add(key, "some value");
    expect(() => registry.add(key, "updated value")).toThrowError();
    expect(registry.get(key)).toBe("some value");

    registry.allowDuplicates();

    expect(() => registry.add(key, "updated value 2")).not.toThrowError();
    expect(registry.get(key)).toBe("updated value 2");
  });

  it("should name the concrete registry in errors, not the minifiable class name", () => {
    // subclasses have to set registryName explicitly: `this.constructor.name` is
    // minified in production, which makes remote error reports unusable
    expect(() => entityRegistry.get("NoSuchEntityType")).toThrowError(
      "Requested item is not registered in EntityRegistry. Key: NoSuchEntityType",
    );
  });

  it("should throw a RegistryLookupError carrying registry and key", () => {
    let thrown: unknown;
    try {
      entityRegistry.get("NoSuchEntityType");
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(RegistryLookupError);
    expect(thrown).toMatchObject({
      registryName: "EntityRegistry",
      key: "NoSuchEntityType",
    });
  });

  it("should report the error type as RegistryLookupError to remote monitoring", () => {
    // remote monitoring reads `error.name || error.constructor.name`, and a
    // subclass inherits "Error" unless `name` is set - without it this error
    // would silently drop out of fingerprint-based grouping in production,
    // where the constructor name is minified too
    const error = new RegistryLookupError("EntityRegistry", "SomeKey");

    expect(error.name).toBe("RegistryLookupError");
  });

  it("should throw a RegistryDuplicateError without dumping the registered element", () => {
    class ElementRegistry extends Registry<string> {
      protected override readonly registryName = "ElementRegistry";
    }
    const elementRegistry = new ElementRegistry();
    elementRegistry.allowDuplicates(false);
    elementRegistry.add("key", "a very long registered element");

    let thrown: unknown;
    try {
      elementRegistry.add("key", "other");
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(RegistryDuplicateError);
    // reaches monitoring via the bootstrap error handler, so the type has to
    // survive minification the same way RegistryLookupError's does
    expect((thrown as Error).name).toBe("RegistryDuplicateError");
    expect((thrown as Error).message).toBe(
      'ElementRegistry: Duplicate definition, "key" is already registered',
    );
  });
});
