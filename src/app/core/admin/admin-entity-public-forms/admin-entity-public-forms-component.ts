import { Component, Input } from "@angular/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { RelatedEntitiesComponent } from "../../entity-details/related-entities/related-entities.component";

@Component({
  selector: "app-admin-entity-public-forms-component",
  standalone: true,
  templateUrl: "./admin-entity-public-forms-component.html",
  styleUrls: [
    "./admin-entity-public-forms-component.scss",
    "../admin-entity/admin-entity-styles.scss",
  ],
  imports: [ViewTitleComponent, RelatedEntitiesComponent],
})
export class AdminEntityPublicFormsComponent {
  /**
   * The entity type for which to display public forms for.
   */
  @Input() entityConstructor: EntityConstructor;

  /**
   * Fake entity instance to correctly filter/link related PublicFormConfigs
   * using the standard related-entities component.
   */
  protected dummyEntity: any = {
    getId: () => this.entityConstructor.ENTITY_TYPE,
  };
}
