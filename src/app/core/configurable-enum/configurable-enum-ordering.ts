import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "./configurable-enum.interface";

/**
 * Support for types of configurable enums that impose a total ordering of their elements.
 * Not all configurable enums (should sensibly) be able to be ordered. For example, it does
 * not make sense to see which school / center is "greater than" another center, or which gender is above
 * which other gender.
 *
 * For other enum types it is, however, sensible to impose a total ordering such as warning levels ('OK' is
 * somewhat 'better' than 'WARNING').
 *
 * Configurable enum values that impose a total ordering can be compared, which also means that they can be sorted,
 * and thus have a notion of one element being 'greater than' or 'less than' to another element. The interpretation
 * of 'greater' or 'less' than is dependent on the concrete enum.
 */

interface HasOrdinal {
  _ordinal: number;
}

export type OrderedConfigurableEnumValue<
  T extends ConfigurableEnumValue = ConfigurableEnumValue
> = T & HasOrdinal;

export namespace EnumOrdering {
  export type Config<T extends ConfigurableEnumValue> = ConfigurableEnumConfig<
    T & HasOrdinal
  >;

  /**
   * Extends an array of configurable enum values with an ordinal value so that the
   * ordinal value of each enum value matches the position of the element in the array.
   *
   * Note that this should be used 'early' in the pipeline, i.e. when the `ConfigurableEnumConfig` is just
   * created. It is technically not incorrect to use this function on any array that contains configurable
   * enum values, but it doesn't make sense to apply this function to 'scrambled' arrays, i.e. arrays where the
   * ordering of values is _not_ the natural order of these values.
   *
   * @param values The values to impose a total ordering on
   */
  export function imposeTotalOrdering<T extends ConfigurableEnumValue>(
    values: ConfigurableEnumConfig<T>
  ): ConfigurableEnumConfig<OrderedConfigurableEnumValue<T>> {
    const orderedValues = Array(values.length);
    for (let i = 0; i < orderedValues.length; ++i) {
      orderedValues[i] = Object.assign({ _ordinal: i }, values[i]);
    }
    return orderedValues;
  }

  /**
   * Compare two elements that have an `_ordinal` property and thus are assumed to can sensibly
   * be compared.
   *
   * - When `first._ordinal` is greater than `second._ordinal`, returns `1`
   * - When `first._ordinal` is less than `second._ordinal`, returns `-1`
   * - When the two ordinal values are equal, returns `0`
   * @param first The first holder of an ordinal value
   * @param second The second holder of an ordinal value
   */
  export function compare(first: HasOrdinal, second: HasOrdinal): number {
    // Sanity-check: This should not work because of the types but configurable enums are usually
    // loaded unsafely via the config, so double-check here
    if (!("_ordinal" in first && "_ordinal" in second)) {
      throw Error(
        `Configurable enum values '${first["id"] ?? first}' and '${
          second["id"] ?? second
        }' cannot be ordered`
      );
    }
    if (first._ordinal > second._ordinal) {
      return 1;
    } else if (first._ordinal < second._ordinal) {
      return -1;
    } else {
      return 0;
    }
  }

  /**
   * Returns `true` when `first` is less than `second`
   * @param first
   * @param second
   */
  export function lt(first: HasOrdinal, second: HasOrdinal): boolean {
    return compare(first, second) < 0;
  }

  /**
   * Returns `true` when `first` is less than or equal to `second`
   * @param first
   * @param second
   */
  export function lte(first: HasOrdinal, second: HasOrdinal): boolean {
    return compare(first, second) <= 0;
  }

  /**
   * Returns `true` when `first` is greater than `second`
   * @param first
   * @param second
   */
  export function gt(first: HasOrdinal, second: HasOrdinal): boolean {
    return compare(first, second) > 0;
  }

  /**
   * Returns `true` when `first` is greater than or equal to `second`
   * @param first
   * @param second
   */
  export function gte(first: HasOrdinal, second: HasOrdinal): boolean {
    return compare(first, second) >= 0;
  }

  /**
   * Returns `true` when `first` is equal to `second`
   *
   * note: For the common use-case where the abstract `HasOrdinal` is used in
   * the context of configurable enums, the result of this should always be the
   * same as `first.id === second.id`.
   * @param first
   * @param second
   */
  export function eq(first: HasOrdinal, second: HasOrdinal): boolean {
    return compare(first, second) === 0;
  }

  /**
   * Sort an array of values where each value has an ordinal value attached to it
   * @param arr
   */
  export function sort<T extends HasOrdinal>(arr: T[]): T[] {
    return arr.sort(compare);
  }
}
