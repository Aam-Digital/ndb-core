import {
  Directive,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
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
export abstract class AbstractEntityDetailsComponent implements OnChanges {
  protected readonly entityMapperService = inject(EntityMapperService);
  protected readonly entities = inject(EntityRegistry);
  protected readonly ability = inject(EntityAbility);
  protected readonly router = inject(Router);
  protected readonly unsavedChanges = inject(UnsavedChangesService);

  isLoading: boolean;
  private changesSubscription: Subscription;

  @Input() entityType: string;
  entityConstructor: EntityConstructor;

  @Input() id: string;
  @Input() entity: Entity;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.entityType) {
      this.entityConstructor = this.entities.get(this.entityType);
    }

    if (changes.id) {
      await this.loadEntity();
      this.subscribeToEntityChanges();
    }
  }

  protected subscribeToEntityChanges() {
    const fullId = Entity.createPrefixedId(this.entityType, this.id);
    this.changesSubscription?.unsubscribe();
    this.changesSubscription = this.entityMapperService
      .receiveUpdates(this.entityConstructor)
      .pipe(
        filter(({ entity }) => entity.getId() === fullId),
        filter(({ type }) => type !== "remove"),
        untilDestroyed(this),
      )
      .subscribe(({ entity }) => (this.entity = entity));
  }

  protected async loadEntity() {
    this.isLoading = true;

    if (this.id === "new") {
      if (this.ability.cannot("create", this.entityConstructor)) {
        this.router.navigate([""]);
        return;
      }
      this.entity = new this.entityConstructor();
      this.isLoading = false;
      return;
    }

    try {
      this.entity = await this.entityMapperService.load(
        this.entityConstructor,
        this.id,
      );
    } catch (error) {
      if (error?.status !== 404) {
        Logging.warn("Error loading entity", error);
      }
      this.entity = null;
    }

    if (!this.entity) {
      await this.router.navigate(["/404"]);
    }
    this.isLoading = false;
  }
}
