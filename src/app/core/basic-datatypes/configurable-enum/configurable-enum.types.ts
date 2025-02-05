

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
  