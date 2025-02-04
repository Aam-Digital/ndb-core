import { ConfigurableEnumConfig, ConfigurableEnumValue, HasOrdinal } from "./configurable-enum-types";
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
  export function hasOrdinalValue(value: any): value is HasOrdinal {
    return isObject(value) && "_ordinal" in value;
  }

  /**
   * Extends ConfigurableEnumValue with HasOrdinal for ordering.
   */
  export type EnumValue<T extends ConfigurableEnumValue = ConfigurableEnumValue> = T & HasOrdinal;

  /**
   * Configuration type for ordered enums.
   */
  export type Config<T extends ConfigurableEnumValue> = ConfigurableEnumConfig<T & HasOrdinal>;

  /**
   * Assigns ordinal values to an array of configurable enum values.
   * 
   * @param values The values to impose a total ordering on.
   */
  export function imposeTotalOrdering<T extends ConfigurableEnumValue>(
    values: ConfigurableEnumConfig<T>,
  ): ConfigurableEnumConfig<EnumValue<T>> {
    return values.map((val, i) => Object.assign({ _ordinal: i }, val));
  }
}
