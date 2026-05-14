import {
  ChangeDetectorRef,
  Directive,
  effect,
  inject,
  input,
  model,
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

  isLoading: boolean;
  private changesSubscription: Subscription;

  entityType = input<string>();
  entityConstructor: EntityConstructor;

  id = input<string>();
  entity = model<Entity | null>(null);

  constructor() {
    effect(() => {
      const entityType = this.entityType();
      const id = this.id();
      if (!entityType || !id) {
        return;
      }
      this.entityConstructor = this.entities.get(entityType);
      void this.loadEntity(id).then(() => this.subscribeToEntityChanges());
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
    if (!entityType || !id || !this.entityConstructor) {
      return;
    }
    const fullId = Entity.createPrefixedId(entityType, id);
    this.changesSubscription?.unsubscribe();
    this.changesSubscription = this.entityMapperService
      .receiveUpdates(this.entityConstructor)
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

  protected async loadEntity(id: string) {
    this.isLoading = true;

    if (id === "new") {
      if (this.ability.cannot("create", this.entityConstructor)) {
        this.router.navigate([""]);
        return;
      }
      this.entity.set(new this.entityConstructor());
      this.isLoading = false;
      return;
    }

    try {
      this.entity.set(
        await this.entityMapperService.load(this.entityConstructor, id),
      );
    } catch (error) {
      if (error?.status !== 404) {
        Logging.warn("Error loading record", error);
      }
      this.entity.set(null);
    }

    if (!this.entity()) {
      await this.router.navigate(["/404"]);
    }
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}
