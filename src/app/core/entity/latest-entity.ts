import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { LoggingService } from "../logging/logging.service";
import { filter } from "rxjs/operators";
import { Entity, EntityConstructor } from "./model/entity";
import { HttpStatusCode } from "@angular/common/http";
import { Subject } from "rxjs";

export abstract class LatestEntity<T extends Entity> {
  entityUpdated = new Subject<T>();
  protected constructor(
    private entityCtor: EntityConstructor<T>,
    private entityID: string,
    protected entityMapper: EntityMapperService,
    protected logger: LoggingService,
  ) {}

  startLoading() {
    this.loadOnce();
    this.entityMapper
      .receiveUpdates(this.entityCtor)
      .pipe(filter(({ entity }) => entity.getId() === this.entityID))
      .subscribe(({ entity }) => this.entityUpdated.next(entity));
  }

  loadOnce() {
    return this.entityMapper
      .load(this.entityCtor, this.entityID)
      .then((entity) => this.entityUpdated.next(entity))
      .catch((err) => {
        if (err?.status !== HttpStatusCode.NotFound) {
          this.logger.error(
            `Loading entity "${this.entityCtor.ENTITY_TYPE}:${this.entityID}" failed: ${err} `,
          );
        }
      });
  }
}
