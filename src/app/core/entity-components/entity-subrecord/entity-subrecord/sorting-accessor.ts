/**
 * An enhanced sortingDataAccessor function that can be set for a MatTableDataSource
 * in order to support sorting by ConfigurableEnum columns and other Entity specific values.
 *
 * @param data The object (table row); passed in by the data source
 * @param key The active sorting header key; passed in by the data source
 */
export function entityListSortingAccessor(data: Object, key: any): any {
  if (isConfigurableEnum(data, key)) {
    return data[key].label;
  } else {
    return data[key];
  }
}

function isConfigurableEnum(data: Object, key: string): boolean {
  return typeof data[key] === "object" && data[key] && "label" in data[key];
}
