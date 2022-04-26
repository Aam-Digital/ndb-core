/**
 * A registry is an affordance to register dynamic objects to strings.
 * It is commonly used to dynamically load entities, views or routes from the config
 *
 * A registry cannot be instantiated directly. Instead, you should subclass from the registry
 * and register it in the {@link AppModule}
 * @see EntityRegistry for an example
 */
export abstract class Registry<T> extends Map<string, T> {
  // This controls whether the registry will throw an error when a key is added multiple times
  private failOnDuplicate = true;

  constructor(private beforeAddCheck?: (key: string, mapping: T) => void) {
    super();
  }

  public add(key: string, mapping: T) {
    this.beforeAddCheck?.(key, mapping);
    if (this.has(key) && this.failOnDuplicate) {
      throw Error(
        `${
          this.constructor.name
        }: Duplicate entity definition: ${key} is already registered with element ${this.get(
          key
        )}`
      );
    }
    this.set(key, mapping);
  }

  public get(key: string): T {
    if (!this.has(key)) {
      throw Error(
        `${this.constructor.name}: Requested item ${key} is not registered`
      );
    }
    return super.get(key);
  }

  /**
   * Calling this will allow the same keys to be added multiple times without thrown errors.
   * This is useful for storybook where live-updates re-trigger the decorator while the registry is cached.
   */
  public allowDuplicates() {
    this.failOnDuplicate = false;
  }
}
