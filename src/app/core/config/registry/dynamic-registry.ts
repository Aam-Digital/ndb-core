import { environment } from "../../../../environments/environment";

/**
 * Thrown when an item that the config refers to - a dynamic component, an entity
 * type, a route - is looked up in a {@link Registry} without having been registered.
 */
export class RegistryLookupError extends Error {
  constructor(
    readonly registryName: string,
    readonly key: string,
  ) {
    super(`Requested item is not registered in ${registryName}. Key: ${key}`);

    // Set explicitly, and to a literal: remote monitoring reads the exception
    // type as `error.name || error.constructor.name`. A subclass inherits
    // "Error" from Error.prototype, so without this the error would be reported
    // as a plain "Error" and drop out of the fingerprint-based grouping
    // (CAUSE_GROUPED_ERROR_TYPES in logging.service.ts). The constructor name is
    // no alternative either - it is minified in production builds.
    this.name = "RegistryLookupError";
  }
}

/**
 * Thrown when the same key is registered twice in a {@link Registry},
 * which usually means two modules define the same component or entity type.
 *
 * Only thrown in production builds (see {@link Registry.allowDuplicates}), where
 * it aborts bootstrap - so it reaches remote monitoring through the top-level
 * bootstrap error handler in `main.ts`.
 */
export class RegistryDuplicateError extends Error {
  constructor(
    readonly registryName: string,
    readonly key: string,
  ) {
    // the already-registered element is deliberately not interpolated here:
    // stringifying it dumps a whole class constructor or async import function
    // into the message
    super(
      `${registryName}: Duplicate definition, "${key}" is already registered`,
    );

    // set explicitly for the same reason as in RegistryLookupError above
    this.name = "RegistryDuplicateError";
  }
}

/**
 * A registry is an affordance to register dynamic objects to strings.
 * It is commonly used to dynamically load entities, views or routes from the config
 *
 * A registry cannot be instantiated directly. Instead, you should subclass from the registry
 * and register it in the {@link AppModule}
 * @see EntityRegistry for an example
 */
export abstract class Registry<T> extends Map<string, T> {
  /**
   * Name of this registry, used in error messages.
   *
   * Set explicitly by each subclass rather than read from `this.constructor.name`,
   * which is minified in production builds. That minified name is baked into the
   * message when the error is created, so - unlike the stack trace - source maps
   * cannot repair it later: remote reports permanently read "not registered in u",
   * which is neither understandable nor searchable.
   */
  protected readonly registryName: string = "Registry";

  // This controls whether the registry will throw an error when a key is added multiple times
  private failOnDuplicate = true;

  constructor(private beforeAddCheck?: (key: string, mapping: T) => void) {
    super();

    this.failOnDuplicate = environment.production;
  }

  public add(key: string, mapping: T) {
    this.beforeAddCheck?.(key, mapping);
    if (this.has(key) && this.failOnDuplicate) {
      throw new RegistryDuplicateError(this.registryName, key);
    }
    this.set(key, mapping);
  }

  public addAll(tuples: [string, T][]) {
    tuples.forEach(([name, value]) => this.add(name, value));
  }

  public override get(key: string): T {
    if (!this.has(key)) {
      // A missing registration is one problem no matter which component, pipe or
      // route hit it first. The dedicated error type lets remote monitoring group
      // it by registry and key instead of by stack trace, which otherwise opens a
      // separate issue per call site (see CAUSE_GROUPED_ERROR_TYPES).
      throw new RegistryLookupError(this.registryName, key);
      // To register a component, add @DynamicComponent("COMPONENTNAME") to the components .ts-file and implement the onInitFromDynamicConfig method, e.g. onInitFromDynamicConfig(config: any) {}
    }
    return super.get(key);
  }

  /**
   * Calling this will allow the same keys to be added multiple times without thrown errors.
   * This is useful for storybook where live-updates re-trigger the decorator while the registry is cached.
   */
  public allowDuplicates(allow: boolean = true) {
    this.failOnDuplicate = !allow;
  }
}
