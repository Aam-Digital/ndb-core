import { en, en_IN, Faker } from "@faker-js/faker";
import { GeoResult } from "../../features/location/geo.service";
/**
 * Extension of faker.js implementing additional data generation methods.
 */
class CustomFaker extends Faker {
  /**
   * Return the given date if it is defined and earlier than today's date
   * otherwise return a Date representing today.
   * @param date The date to be compared
   */
  getEarlierDateOrToday(date: Date): Date {
    const today = this.defaultRefDate();

    if (!date || date > today) {
      return today;
    } else {
      return date;
    }
  }

  geoAddress(): GeoResult {
    const coordinates = faker.location.nearbyGPSCoordinate({
      origin: [52.4790412, 13.4319106],
    });
    return {
      lat: Number.parseFloat(coordinates[0].toString()),
      lon: Number.parseFloat(coordinates[1].toString()),
      display_name: faker.location.streetAddress(true),
    } as GeoResult;
  }
}

/**
 * (Extended) faker module
 */
export const faker = new CustomFaker({ locale: [en_IN, en], seed: 1 });
if ("NDB_E2E_REF_DATE" in globalThis) {
  faker.setDefaultRefDate(globalThis.NDB_E2E_REF_DATE);
}
