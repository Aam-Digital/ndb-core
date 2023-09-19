import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "./configurable-enum.interface";
import { isObject } from "lodash-es";

export namespace Ordering {
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
  export interface HasOrdinal {
    _ordinal?: number;
  }

  export function hasOrdinalValue(value: any): value is HasOrdinal {
    return isObject(value) && "_ordinal" in value;
  }

  export type EnumValue<
    T extends ConfigurableEnumValue = ConfigurableEnumValue,
  > = T & HasOrdinal;

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
    values: ConfigurableEnumConfig<T>,
  ): ConfigurableEnumConfig<EnumValue<T>> {
    return values.map((val, i) => Object.assign({ _ordinal: i }, val));
  }
}
