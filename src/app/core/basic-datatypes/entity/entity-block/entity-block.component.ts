import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { Router } from "@angular/router";
import { DisplayImgComponent } from "../../../../features/file/display-img/display-img.component";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { TemplateTooltipDirective } from "../../../common-components/template-tooltip/template-tooltip.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityFieldViewComponent } from "../../../entity/entity-field-view/entity-field-view.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
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
  ],
})
export class EntityBlockComponent {
  private entityMapper = inject(EntityMapperService);
  private router = inject(Router);

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

  entityBlockConfig = computed(() => {
    return this.entityResource.value()?.getConstructor()
      ?.toBlockDetailsAttributes;
  });

  entityIcon = computed(() => {
    return this.entityResource.value()?.getConstructor()?.icon || "diamond";
  });

  showDetailsPage() {
    const entity = this.entityResource.value();
    if (this.linkDisabled() || !entity) {
      return;
    }

    this.router.navigate([entity.getConstructor().route, entity.getId(true)]);
  }
}
