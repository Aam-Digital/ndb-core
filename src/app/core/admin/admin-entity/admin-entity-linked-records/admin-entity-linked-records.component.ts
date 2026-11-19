import { Component, computed, input } from "@angular/core";
import { HintBoxComponent } from "../../../common-components/hint-box/hint-box.component";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { RelatedEntitiesComponent } from "../../../entity-details/related-entities/related-entities.component";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { AdminEntitySection } from "../admin-entity-sections.service";

/**
 * Lists the config records of a section (e.g. the Public Forms) that belong to the given entity type.
 */
@Component({
  selector: "app-admin-entity-linked-records",
  imports: [ViewTitleComponent, RelatedEntitiesComponent, HintBoxComponent],
  template: `
    @if (section().description; as description) {
      <app-hint-box>{{ description }}</app-hint-box>
    }

    <app-view-title [disableBackButton]="true" [displayInPlace]="true">
      {{ section().label }}
    </app-view-title>

    <app-related-entities
      [entityType]="section().entityType"
      [property]="section().property"
      [columns]="section().columns"
      [entity]="entityTypeAsRecord()"
      clickMode="popup-details"
    ></app-related-entities>

    @if (section().footnote; as footnote) {
      <div class="padding-regular">{{ footnote }}</div>
    }
  `,
})
export class AdminEntityLinkedRecordsComponent {
  entityConstructor = input.required<EntityConstructor>();
  section = input.required<AdminEntitySection>();

  /**
   * The config records reference the name of an entity type and not a record.
   * This stands in for a record with that name as its ID,
   * so that the standard related-entities component can filter and link them.
   */
  protected readonly entityTypeAsRecord = computed(
    () =>
      ({
        getId: () => this.entityConstructor().ENTITY_TYPE,
        getType: () => this.entityConstructor().ENTITY_TYPE,
      }) as Entity,
  );
}
