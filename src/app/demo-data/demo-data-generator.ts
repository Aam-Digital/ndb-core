import {Entity} from '../entity/entity';


export abstract class DemoDataGenerator<T extends Entity> {
  protected _entities: T[];
  get entities() {
    if (!this._entities) {
      this._entities = this.generateEntities();
    }
    return this._entities;
  }

  protected abstract generateEntities(): T[];

  reset() {
    delete this._entities;
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
}
