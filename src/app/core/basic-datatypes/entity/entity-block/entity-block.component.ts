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
import { MatTooltipModule } from "@angular/material/tooltip";
import { validate as isGeneratedId } from "uuid";

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
    MatTooltipModule,
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

  /**
   * Show the raw entity id instead of the generic "not available" when the
   * referenced record cannot be loaded. Opt-in, for lists where the reader needs
   * to identify *which* record is gone (e.g. an audit log of deletions) rather
   * than only that one is missing.
   */
  showEntityId = input(false);

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
    const id = this.entityId();
    if (typeof id !== "string") {
      // `entityId` is typed as string, but nothing enforces that at runtime for a
      // block that is rendered from user config. A non-string id makes the resource
      // loader below fail and swallow the error, which in turn makes notFound() true
      // and brings us here — so extractTypeFromId() would throw on every change
      // detection pass, inside a computed the template reads. Degrade to the generic
      // not-found display instead.
      return undefined;
    }
    const type = Entity.extractTypeFromId(id);
    return type && this.registry.has(type)
      ? this.registry.get(type)
      : undefined;
  });

  /**
   * Icon for the not-found block: the referenced entity's *type* icon (e.g. the
   * Child icon for a deleted child), since the entity itself is gone. Falls back
   * to the generic block icon for unknown types.
   */
  readonly notFoundIcon = computed(
    () => this.missingEntityType()?.icon || "diamond",
  );

  /**
   * Whether the record has nothing to display but a generated id.
   *
   * A type that configures no `toStringAttributes` keeps the default
   * `["entityId"]`, so `toString()` returns the bare id. That alone is not a
   * problem: an id chosen deliberately is usually the best name a record has
   * (a `User`'s id is their username). Only a generated one says nothing, so
   * the id must also be a uuid, as `Entity`'s constructor defaults to.
   */
  readonly showsOnlyId = computed(() => {
    const entity = this.entityResource.value();
    if (!entity) {
      return false;
    }
    const id = entity.getId(true);
    // `isGeneratedId` from the same package `Entity` generates ids with, so the
    // two can never drift apart
    return entity.toString() === id && isGeneratedId(id);
  });

  /**
   * What to show instead of that bare uuid: the kind of record it is, which is
   * the one thing actually known about it. The full id stays on the element's
   * `title`, and callers with room for a second line (e.g. the change log) show
   * it themselves; this block is a single-line inline element everywhere else.
   */
  readonly idOnlyLabel = computed(() => {
    const type = this.entityResource.value()?.getConstructor();
    // an unlabelled config-defined type still names itself through its key
    const typeName = type?.label || type?.ENTITY_TYPE;
    return $localize`:Entity block label for a record with no display value:${typeName}:type: Record`;
  });

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
