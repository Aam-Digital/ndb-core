import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { Router } from "@angular/router";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DisplayImgComponent } from "../../../../features/file/display-img/display-img.component";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { TemplateTooltipDirective } from "../../../common-components/template-tooltip/template-tooltip.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityFieldViewComponent } from "../../../entity/entity-field-view/entity-field-view.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { getEntityRuntimeRoute } from "../../../entity/entity-config.service";
import { Entity } from "../../../entity/model/entity";
import { Logging } from "../../../logging/logging.service";
import { resourceWithRetention } from "../../../../utils/resourceWithRetention";

/**
 * Display an inline block representing an entity.
 */
@DynamicComponent("EntityBlock")
@Component({
  selector: "app-entity-block",
  templateUrl: "./entity-block.component.html",
  styleUrls: ["./entity-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FaDynamicIconComponent,
    TemplateTooltipDirective,
    DisplayImgComponent,
    EntityFieldViewComponent,
    MatProgressSpinnerModule,
  ],
})
export class EntityBlockComponent {
  private entityMapper = inject(EntityMapperService);
  private router = inject(Router);
  // optional + module-singleton fallback so this widely-reused block never
  // crashes a host/test that didn't explicitly provide EntityRegistry
  private readonly registry =
    inject(EntityRegistry, { optional: true }) ?? entityRegistry;
  /** The entity to display directly. Takes precedence over entityId. */
  entity = input<Entity>();

  /** If entity is not set, entityId (with prefix) is used to load the entity. */
  entityId = input<string>();

  linkDisabled = input(false);

  entityResource = resourceWithRetention({
    params: () => ({ entity: this.entity(), entityId: this.entityId() }),
    loader: async ({ params: { entity, entityId } }) => {
      if (entity) return entity;
      if (!entityId) return undefined;
      try {
        return await this.entityMapper.load(
          Entity.extractTypeFromId(entityId),
          entityId,
        );
      } catch (e) {
        Logging.debug("[DISPLAY_ENTITY] Could not find entity.", entityId, e);
        return undefined;
      }
    },
  });

  /**
   * True during initial loading when no entity value is available yet.
   * Otherwise, we want to use the previous value through the resource's retention.
   */
  initialLoading = computed(
    () => this.entityResource.isLoading() && !this.entityResource.value(),
  );

  /**
   * True when an id was given but no entity could be resolved (and loading has
   * settled) — e.g. the referenced record was deleted.
   */
  notFound = computed(
    () =>
      !!this.entityId() &&
      !this.entityResource.isLoading() &&
      !this.entityResource.value(),
  );

  /** The constructor for the id's type prefix, if registered (used for the not-found display). */
  readonly missingEntityType = computed(() => {
    if (!this.notFound()) {
      return undefined;
    }
    const type = Entity.extractTypeFromId(this.entityId());
    return type && this.registry.has(type)
      ? this.registry.get(type)
      : undefined;
  });

  /**
   * Icon for the not-found block: the referenced entity's *type* icon (e.g. the
   * Child icon for a deleted child), since the entity itself is gone. Falls back
   * to the generic block icon for unknown types.
   */
  readonly notFoundIcon = computed(() => this.missingEntityType()?.icon || "diamond");

  readonly entityBlockConfig = computed(() => {
    return this.entityResource.value()?.getConstructor()
      ?.toBlockDetailsAttributes;
  });

  readonly entityIcon = computed(() => {
    return this.entityResource.value()?.getConstructor()?.icon || "diamond";
  });

  readonly entityColor = computed(() => {
    const entity = this.entityResource.value();
    if (!entity) return undefined;
    const colorConfig = entity.getConstructor().color;
    if (!colorConfig) return undefined;
    return Entity.getColorWithConditions(entity);
  });

  showDetailsPage() {
    const entity = this.entityResource.value();
    if (this.linkDisabled() || !entity) {
      return;
    }

    this.router.navigate([
      getEntityRuntimeRoute(entity.getConstructor()),
      entity.getId(true),
    ]);
  }
}
