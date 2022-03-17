/**
 * A registry is an affordance to register dynamic objects to strings.
 * It is commonly used to dynamically load entities, views or routes from the config
 *
 * A registry cannot be instantiated directly. Instead, you should subclass from the registry
 * and register it in the {@link AppModule}
 * @see EntityRegistry for an example
 */
export abstract class Registry<T> extends Map<string, T> {
  constructor(private beforeAddCheck?: (key: string, mapping: T) => void) {
    super();
  }

  public add(key: string, mapping: T) {
    this.beforeAddCheck?.(key, mapping);
    if (this.has(key)) {
      throw Error(
        `Duplicate entity definition: ${key} is already registered with constructor ${this.get(
          key
        )}`
      );
    }
    this.set(key, mapping);
  }

  public addAliases(keys: string[], mapping: T) {
    keys.forEach((key) => {
      this.add(key, mapping);
    });
  }

  public get(key: string): T | undefined {
    if (!this.has(key)) {
      console.warn(`Requested item is not registered`);
    }
    return super.get(key);
  }
}
