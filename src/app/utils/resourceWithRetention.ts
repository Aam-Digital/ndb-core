import {
  linkedSignal,
  resource,
  ResourceOptions,
  ResourceRef,
} from "@angular/core";

/**
 * Creates a resource that retains its previous value when reloading.
 *
 * This function is similar to {@link resource} except while reloading. When
 * `isLoading()` is true, `value()` holds the previously loaded value instead of
 * `undefined` or `defaultValue`.
 */
export function resourceWithRetention<T, R>(
  options: ResourceOptions<T, R>,
): ResourceRef<T | undefined> {
  const r = resource(options);
  const retainedValue = linkedSignal<{ value: T; isLoading: boolean }, T>({
    source: () => ({ value: r.value(), isLoading: r.isLoading() }),
    computation: (newValue, previous) =>
      newValue.isLoading && previous ? previous.value : newValue.value,
  });

  return new Proxy(r, {
    get(target, prop, receiver) {
      if (prop === "value") {
        return retainedValue.asReadonly();
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}
