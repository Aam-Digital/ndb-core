export interface HasOrdinal {
  _ordinal?: number;
}

export interface ConfigurableEnumValue extends HasOrdinal {
  id: string;
  label: string;
  color?: string;
  isInvalidOption?: boolean;
  style?: string;
}

export const EMPTY: ConfigurableEnumValue = {
  id: "",
  label: "",
};

export type ConfigurableEnumConfig<
  T extends ConfigurableEnumValue = ConfigurableEnumValue,
> = Array<T>;
