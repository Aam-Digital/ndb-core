import {
  ChangeDetectorRef,
  Directive,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subscription } from "rxjs";
import { UnsavedChangesService } from "../form/unsaved-changes.service";
import { Logging } from "../../logging/logging.service";

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
  protected readonly cdr = inject(ChangeDetectorRef);

  readonly isLoading = signal(false);
  private changesSubscription: Subscription;

  entityType = input<string>();
  readonly entityConstructor = signal<EntityConstructor | undefined>(undefined);

  id = input<string>();
  readonly entity = signal<Entity | null>(null);

  constructor() {
    effect((onCleanup) => {
      const entityType = this.entityType();
      const id = this.id();
      if (!entityType || !id) {
        return;
      }
      this.entityConstructor.set(this.entities.get(entityType));
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
        this.cdr.markForCheck();
      });
  }

  protected async loadEntity(
    id: string,
    isCancelled: () => boolean = () => false,
  ) {
    const ctor = this.entityConstructor();
    if (!ctor) return;

    this.isLoading.set(true);

    if (id === "new") {
      if (this.ability.cannot("create", ctor)) {
        this.router.navigate([""]);
        return;
      }
      this.entity.set(new ctor());
      this.isLoading.set(false);
      return;
    }

    try {
      const loaded = await this.entityMapperService.load(ctor, id);
      if (isCancelled()) return;
      this.entity.set(loaded);
    } catch (error) {
      if (isCancelled()) return;
      if (error?.status !== 404) {
        Logging.warn("Error loading record", error);
      }
      this.entity.set(null);
    }

    if (!this.entity()) {
      await this.router.navigate(["/404"]);
    }
    this.isLoading.set(false);
    this.cdr.markForCheck();
  }
}
