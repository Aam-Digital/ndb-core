import * as originalFaker_IND from 'faker/locale/en_IND';
import {Faker} from './faker.types';
import FakerStatic = Faker.FakerStatic;


/**
 * Extension of faker.js implementing additional data generation methods.
 */
class CustomFaker {

  constructor(
    // @ts-ignore
    private baseFaker: Faker.FakerStatic
  ) {
    // make baseFaker methods available from instances of this class
    Object.assign(this, baseFaker);
  }

  public dateOfBirth(minAge: number, maxAge: number): Date {
    const currentYear = (new Date()).getFullYear();
    const latest = new Date();
    latest.setFullYear(currentYear - minAge);
    const earliest = new Date();
    earliest.setFullYear(currentYear - maxAge);
    return this.baseFaker.date.between(earliest, latest);
  }
}


export type Faker = (FakerStatic & CustomFaker);

originalFaker_IND.seed(1);
export const faker = new CustomFaker(originalFaker_IND) as Faker;
