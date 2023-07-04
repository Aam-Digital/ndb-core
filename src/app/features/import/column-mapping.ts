/**
 * Mapping of a column from an import dataset to define how it should be imported exactly.
 */
export interface ColumnMapping {
  column: string;
  property?: PropertyConfig;
  additional?: any;
  values: string[];
}

// TODO: ???
type PropertyConfig = {
  name: string;
  //  schema: EntitySchemaField;
  //  mappingCmp?: ComponentType<any>;
  //  mappingFn?: (val: any, cal: ColumnConfig) => any;
};
