import moment from "moment/moment";
import { GeoLocation } from "app/features/location/GeoLocation";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";

/**
 * Transform a whole object into a readable format.
 * This also transforms date objects to `YYYY-MM-DD` format.
 * @param obj
 */
export function transformToReadableFormat(obj: any) {
  const readableObj = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof Date) {
      // Export data according to local timezone offset - data is loaded through Entity Schema system and thereby has the correct date in the current device's timezone
      // TODO: make this output format configurable or use the different date schema types [GITHUB #1185]
      readableObj[key] = moment(value).format("YYYY-MM-DD");
    } else {
      readableObj[key] = getReadableValue(value);
    }
  });
  return readableObj;
}

/**
 * An enhanced sortingDataAccessor function that can be set for a MatTableDataSource
 * in order to support sorting by ConfigurableEnum columns and other Entity specific values.
 *
 * @param value the object for which a readable string should be returned
 */
export function getReadableValue(value: any): any {
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((val) => value.indexOf(val) === 0)) {
      // only return a single value if all elements in array are same
      return getReadableValue(value[0]);
    } else {
      return value.map((v) => getReadableValue(v));
    }
  }

  // TODO: refactor this into an extendable system where each Datatype defines their transformation instead of implementing it here

  if (isConfigurableEnum(value)) {
    return value.label;
  }
  if (isGeoLocation(value)) {
    return value.locationString;
  }

  return value;
}

export function isConfigurableEnum(value: any): value is ConfigurableEnumValue {
  return typeof value === "object" && value && "label" in value;
}

function isGeoLocation(value: any): value is GeoLocation {
  return typeof value === "object" && value && "locationString" in value;
}
