import { ConfigurableEnumValue, HasOrdinal } from "./configurable-enum.types";
import { isObject } from "lodash-es";

export namespace Ordering {
  export function hasOrdinalValue(value: any): value is HasOrdinal {
    return isObject(value) && "_ordinal" in value;
  }

  export type EnumValue<
    T extends ConfigurableEnumValue = ConfigurableEnumValue,
  > = T & HasOrdinal;

  export type Config<T extends ConfigurableEnumValue> = Array<T & HasOrdinal>;

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
    values: Array<T>,
  ): Array<EnumValue<T>> {
    return values.map((val, i) => Object.assign({ _ordinal: i }, val));
  }
}
