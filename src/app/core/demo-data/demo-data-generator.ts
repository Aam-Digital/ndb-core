import { Entity } from "../entity/model/entity";

/**
 * Abstract base class for demo data generator backup.
 *
 * For usage refer to the How-To Guides:
 * - [How to Generate Demo Data]{@link /additional-documentation/how-to-guides/generate-demo-data.html}
 */
export abstract class DemoDataGenerator<T extends Entity> {
  /** internally used array of the generated entities */
  protected _entities: T[];

  /**
   * generated demo entities
   */
  get entities() {
    if (!this._entities) {
      this._entities = this.generateEntities();
    }
    return this._entities;
  }

  /**
   * Generate new demo entities.
   */
  protected abstract generateEntities(): T[];

  /**
   * Remove all previously generated entities.
   */
  reset() {
    delete this._entities;
  }
}
