import { ConfigurableEnumValue } from "./configurable-enum.types";

export type ConfigurableEnumConfig<
  T extends ConfigurableEnumValue = ConfigurableEnumValue,
> = Array<T>;

export const EMPTY: ConfigurableEnumValue = {
  id: "",
  label: "",
};
