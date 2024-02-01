import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { LoggingService } from "../logging/logging.service";
import { filter } from "rxjs/operators";
import { Entity, EntityConstructor } from "./model/entity";
import { HttpStatusCode } from "@angular/common/http";
import { Subject } from "rxjs";

/**
 * Implement an Angular Service extending this base class
 * when you need to work with continuous updates of a specific entity from the database.
 * (e.g. SiteSettings & SiteSettingsService)
 */
export abstract class LatestEntityLoader<T extends Entity> {
  /** subscribe to this and execute any actions required when the entity changes */
  entityUpdated = new Subject<T>();

  protected constructor(
    private entityCtor: EntityConstructor<T>,
    private entityID: string,
    protected entityMapper: EntityMapperService,
    protected logger: LoggingService,
  ) {}

  /**
   * Initialize the loader to make the entity available and emit continuous updates
   * through the `entityUpdated` property
   */
  async startLoading() {
    const initialValue = await this.loadOnce();
    this.entityMapper
      .receiveUpdates(this.entityCtor)
      .pipe(filter(({ entity }) => entity.getId(true) === this.entityID))
      .subscribe(({ entity }) => this.entityUpdated.next(entity));
    return initialValue;
  }

  /**
   * Do an initial load of the entity to be available through the `entityUpdated` property
   * (without watching for continuous updates).
   */
  loadOnce(): Promise<T | undefined> {
    return this.entityMapper
      .load(this.entityCtor, this.entityID)
      .then((entity) => {
        this.entityUpdated.next(entity);
        return entity;
      })
      .catch((err) => {
        if (err?.status !== HttpStatusCode.NotFound) {
          this.logger.error(
            `Loading entity "${this.entityCtor.ENTITY_TYPE}:${this.entityID}" failed: ${err} `,
          );
        }
        return undefined;
      });
  }
}
