import { calculateAge } from "../../../utils/utils";

/**
 * Subclass of Date which provides the getter `age`.
 * This age is calculated based on the date that this object represents.
 */
export class DateWithAge extends Date {
  static DATA_TYPE = "date-with-age";

  get age() {
    return calculateAge(this);
  }
}
