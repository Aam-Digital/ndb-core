import {
  Directive,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { Logging } from "../../logging/logging.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { UnsavedChangesService } from "../form/unsaved-changes.service";

/**
 * This component can be used to display an entity in more detail.
 * As an abstract base component, this provides functionality to load an entity
 * and leaves the UI and special functionality to components that extend this class, like EntityDetailsComponent.
 */
@UntilDestroy()
@Directive()
export abstract class AbstractEntityDetailsComponent {
  protected readonly entityMapperService = inject(EntityMapperService);
  protected readonly entities = inject(EntityRegistry);
  protected readonly ability = inject(EntityAbility);
  protected readonly router = inject(Router);
  protected readonly unsavedChanges = inject(UnsavedChangesService);

  readonly isLoading = signal(false);
  private changesSubscription: Subscription;
  private loadedForId: string | undefined;

  entityType = input<string>();
  readonly entityConstructor = computed<EntityConstructor | undefined>(() =>
    this.entityType() ? this.entities.get(this.entityType()) : undefined,
  );

  id = input<string>();
  readonly entity = model<Entity | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      if (!this.entityType() || !id) {
        return;
      }

      if (this.entity() && this.loadedForId === id) {
        return;
      }

      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.loadEntity(id, () => cancelled).then(() => {
        if (!cancelled) this.subscribeToEntityChanges();
      });
    });
  }

  /**
   * Hook called whenever the entity is updated via the live subscription (e.g. after save or anonymize).
   * Subclasses can override this to react to entity changes beyond what markForCheck() provides.
   */
  protected onEntityUpdated() {}

  protected subscribeToEntityChanges() {
    const entityType = this.entityType();
    const id = this.id();
    const ctor = this.entityConstructor();
    if (!entityType || !id || !ctor) {
      return;
    }
    const fullId = Entity.createPrefixedId(entityType, id);
    this.changesSubscription?.unsubscribe();
    this.changesSubscription = this.entityMapperService
      .receiveUpdates(ctor)
      .pipe(
        filter(({ entity }) => entity.getId() === fullId),
        filter(({ type }) => type !== "remove"),
        untilDestroyed(this),
      )
      .subscribe(({ entity }) => {
        this.entity.set(entity);
        this.onEntityUpdated();
      });
  }

  protected async loadEntity(
    id: string,
    isCancelled: () => boolean = () => false,
  ) {
    const ctor = this.entityConstructor();
    if (!ctor) return;

    this.loadedForId = id;
    this.isLoading.set(true);
    try {
      if (id === "new") {
        if (this.ability.cannot("create", ctor)) {
          await this.router.navigate([""]);
          return;
        }
        this.entity.set(new ctor());
        return;
      }

      const cancelledLoad = Symbol("cancelledLoad");
      const loaded: Entity | null | typeof cancelledLoad =
        await this.entityMapperService.load(ctor, id).catch((error) => {
          if (isCancelled()) {
            return cancelledLoad;
          }
          if (error?.status !== 404) {
            Logging.warn("Error loading record", error);
          }
          return null;
        });

      if (isCancelled() || loaded === cancelledLoad) return;
      this.entity.set(loaded);

      if (!this.entity()) {
        await this.router.navigate(["/404"]);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
