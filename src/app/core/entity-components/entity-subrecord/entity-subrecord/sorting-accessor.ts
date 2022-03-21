/**
 * An enhanced sortingDataAccessor function that can be set for a MatTableDataSource
 * in order to support sorting by ConfigurableEnum columns and other Entity specific values.
 *
 * @param data The object (table row); passed in by the data source
 * @param sortingHeader The active sorting header key; passed in by the data source
 */
export function entityListSortingAccessor(data: Object, sortingHeader: string) {
  if (isConfigurableEnum(data, sortingHeader)) {
    return data[sortingHeader].label;
  } else if (typeof data[sortingHeader] === "string") {
    return tryNumber(data[sortingHeader]);
  } else {
    return data[sortingHeader];
  }
}

function isConfigurableEnum(data: Object, sortingHeader: string) {
  return (
    typeof data[sortingHeader] === "object" &&
    data[sortingHeader] &&
    "label" in data[sortingHeader]
  );
}

function tryNumber(input?: any): any {
  return Number(input) || input;
}
