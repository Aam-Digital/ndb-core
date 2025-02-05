import { ConfigurableEnumValue, HasOrdinal , } from "./configurable-enum.types";
import { isObject } from "lodash-es";

export namespace Ordering {
  export function hasOrdinalValue(value: any): value is HasOrdinal {
    return isObject(value) && "_ordinal" in value;
  }

  export type EnumValue<T extends ConfigurableEnumValue = ConfigurableEnumValue> = T & HasOrdinal;

  export type Config<T extends ConfigurableEnumValue> = Array<T & HasOrdinal>;

  export function imposeTotalOrdering<T extends ConfigurableEnumValue>(
    values: Array<T>,
  ): Array<EnumValue<T>> {
    return values.map((val, i) => Object.assign({ _ordinal: i }, val));
  }
}
