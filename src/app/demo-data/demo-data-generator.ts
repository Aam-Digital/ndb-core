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
}
