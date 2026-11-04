import moment from "moment";

/**
 * Convert a value to a CSV/XLSX-friendly primitive, applying the same readable
 * transformations as the UI (dates as YYYY-MM-DD, enum labels, location strings).
 */
export function toExportValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return moment(value).format("YYYY-MM-DD");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toExportValue(entry)).join(",");
  }

  if (typeof value === "object") {
    if ("label" in value) {
      return value.label;
    }
    if ("locationString" in value) {
      return value.locationString;
    }
    return JSON.stringify(value);
  }

  return value;
}
