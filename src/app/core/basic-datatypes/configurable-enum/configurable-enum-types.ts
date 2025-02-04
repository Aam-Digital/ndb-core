/**
 * Defines an ordinal property for enums that require ordering.
 */
export interface HasOrdinal {
    _ordinal?: number;
  }
  
  /**
   * Interface specifying overall object representing an enum with all its options
   * as stored in the config database.
   */
  export type ConfigurableEnumConfig<T extends ConfigurableEnumValue = ConfigurableEnumValue> = Array<T>;
  
  /**
   * Mandatory properties of each configurable enum value.
   */
  export interface ConfigurableEnumValue extends HasOrdinal {
    id: string;
    label: string;
    color?: string;
    isInvalidOption?: boolean;
    style?: string;
  }
  
  /**
   * An empty configurable enum value (used as a placeholder).
   */
  export const EMPTY: ConfigurableEnumValue = {
    id: "",
    label: "",
  };
  