import { fakerEN_IN as originalFaker } from "@faker-js/faker";
import { GeoResult } from "../../features/location/geo.service";
/**
 * Extension of faker.js implementing additional data generation methods.
 */
class CustomFaker {
  /**
   * Merge the created CustomFaker's implementation with a given faker's standard methods.
   * @param baseFaker A standard faker.js
   */
  constructor(
    // @ts-ignore
    private baseFaker: Faker.FakerStatic,
  ) {
    // make baseFaker methods available from instances of this class
    Object.assign(this, baseFaker);
  }

  /**
   * Generate a date that works as a date of birth in the given age range.
   * @param minAge The minimum age (today) of a person with the generated random birthdate.
   * @param maxAge The maximum age (today) of a person with the generated random birthdate.
   */
  public dateOfBirth(minAge: number, maxAge: number): Date {
    const currentYear = new Date().getFullYear();
    const latest = new Date();
    latest.setFullYear(currentYear - minAge);
    const earliest = new Date();
    earliest.setFullYear(currentYear - maxAge);
    return this.baseFaker.date.between({ from: earliest, to: latest });
  }

  /**
   * Return the given date if it is defined and earlier than today's date
   * otherwise return a Date representing today.
   * @param date The date to be compared
   */
  getEarlierDateOrToday(date: Date): Date {
    const today = new Date();

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
 * Typing for faker including extended functionality.
 */
export type Faker = typeof originalFaker & CustomFaker;

originalFaker.seed(1);

/**
 * (Extended) faker module
 */
export const faker = new CustomFaker(originalFaker) as Faker;
