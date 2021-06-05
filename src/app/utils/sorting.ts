import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";

const options: Intl.CollatorOptions = {
  numeric: true,
  sensitivity: "base",
};

export const collator = new Intl.Collator(undefined, options);

export function sortDataSourceNumerically<T>(
  dataSource: MatTableDataSource<any>
) {
  dataSource.sortData = (data: T[], sort: MatSort) => {
    const active = sort.active;
    const direction = sort.direction;
    if (!active || direction === "") {
      return data;
    }

    return data.sort((a, b) => {
      let valueA = dataSource.sortingDataAccessor(a, active);
      let valueB = dataSource.sortingDataAccessor(b, active);

      // If there are data in the column that can be converted to a number,
      // it must be ensured that the rest of the data
      // is of the same type so as not to order incorrectly.
      const valueAType = typeof valueA;
      const valueBType = typeof valueB;

      if (valueAType !== valueBType) {
        if (valueAType === "number") {
          valueA += "";
        }
        if (valueBType === "number") {
          valueB += "";
        }
      }

      let comparatorResult = 0;

      if (valueAType === "string" && valueBType === "string") {
        comparatorResult = collator.compare(valueA as string, valueB as string);
      } else {
        // If both valueA and valueB exist (truthy), then compare the two. Otherwise, check if
        // one value exists while the other doesn't. In this case, existing value should come last.
        // This avoids inconsistent results when comparing values to undefined/null.
        // If neither value exists, return 0 (equal).
        if (valueA != null && valueB != null) {
          // Check if one value is greater than the other; if equal, comparatorResult should remain 0.
          if (valueA > valueB) {
            comparatorResult = 1;
          } else if (valueA < valueB) {
            comparatorResult = -1;
          }
        } else if (valueA != null) {
          comparatorResult = 1;
        } else if (valueB != null) {
          comparatorResult = -1;
        }
      }

      return comparatorResult * (direction === "asc" ? 1 : -1);
    });
  };
}
