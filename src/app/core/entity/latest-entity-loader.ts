import { EntityMapperService } from "./entity-mapper/entity-mapper.service";
import { filter } from "rxjs/operators";
import { Entity, EntityConstructor } from "./model/entity";
import { HttpStatusCode } from "@angular/common/http";
import { Subject } from "rxjs";
import { DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

/**
 * Implement an Angular Service extending this base class
 * when you need to work with continuous updates of a specific entity from the database.
 * (e.g. SiteSettings & SiteSettingsService)
 */
export abstract class LatestEntityLoader<T extends Entity> {
  /** subscribe to this and execute any actions required when the entity changes */
  entityUpdated = new Subject<T>();

  /**
   * Stops the live-updates subscription once this service's injector is destroyed.
   * Without this, every instance created by a fresh injector (e.g. a new TestBed
   * per test) keeps reacting to entity updates forever, accumulating across the
   * process's lifetime.
   */
  protected readonly destroyRef = inject(DestroyRef);

  protected constructor(
    private entityCtor: EntityConstructor<T>,
    private entityID: string,
    protected entityMapper: EntityMapperService,
    /**
     * Whether a deletion of the entity is emitted through `entityUpdated` as well.
     *
     * A deleted document holds no data, so the emitted entity is empty apart from its id.
     * Set this to false if the subscriber cannot handle that (and instead should simply
     * keep the last known state until the app is reloaded).
     */
    private readonly emitDeletions: boolean = true,
  ) {
    this.onInit();
  }

  /**
   * Override this to trigger actions upon initialization of the service
   */
  protected onInit() {}

  /**
   * Initialize the loader to make the entity available and emit continuous updates
   * through the `entityUpdated` property
   */
  async startLoading() {
    // Set up the live-updates subscription first, so it is always active
    // regardless of whether the initial load below succeeds or fails.
    this.entityMapper
      .receiveUpdates(this.entityCtor)
      .pipe(
        filter(({ type }) => this.emitDeletions || type !== "remove"),
        filter(({ entity }) => entity.getId(true) === this.entityID),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ entity }) => this.entityUpdated.next(entity));

    return this.loadOnce();
  }

  /**
   * Do an initial load of the entity to be available through the `entityUpdated` property
   * (without watching for continuous updates).
   *
   * Returns `undefined` if the entity does not exist (HTTP 404).
   * Other errors are propagated and should be handled by the subclass with
   * a domain-specific error so that monitoring tools (e.g. Sentry) can group them properly.
   */
  async loadOnce(): Promise<T | undefined> {
    try {
      const entity = await this.entityMapper.load(
        this.entityCtor,
        this.entityID,
      );
      this.entityUpdated.next(entity);
      return entity;
    } catch (err) {
      if (err?.status === HttpStatusCode.NotFound) {
        return undefined;
      }
      throw err;
    }
  }
}
