import {Entity} from '../entity/entity';


export abstract class DemoDataGenerator {
  protected _entities: Entity[];
  get entities() {
    if (!this._entities) {
      this._entities = this.generateEntities();
    }
    return this._entities;
  }

  protected abstract generateEntities(): Entity[];

  reset() {
    delete this._entities;
  }
}
