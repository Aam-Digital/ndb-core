import { Entity } from "../entity/model/entity";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { Logging } from "../logging/logging.service";
import { inject, Injectable } from "@angular/core";

/**
 * Abstract base class for demo data generator backup.
 *
 * For usage refer to the How-To Guides:
 * - [How to Generate Demo Data]{@link /additional-documentation/how-to-guides/generate-demo-data.html}
 */
@Injectable()
export abstract class DemoDataGenerator<T extends Entity> {
  /** internally used array of the generated entities */
  protected _entities: T[];

  /**
   * Override this property to specify the entity types that are required for this generator.
   * If some of the required entity types are not available, the generator will not run.
   * @protected
   */
  protected requiredEntityTypes: string[] = [];

  protected readonly entityRegistry = inject(EntityRegistry);

  /**
   * generated demo entities
   */
  get entities() {
    if (this.requiredEntityTypes.some((e) => !this.entityRegistry.has(e))) {
      Logging.debug(
        "Skipping demo data generation because required entity types are not configured",
        this.requiredEntityTypes,
      );
      return [];
    }

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
