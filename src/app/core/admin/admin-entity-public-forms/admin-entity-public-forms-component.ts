import { Component, Input } from "@angular/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { RelatedEntitiesComponent } from "../../entity-details/related-entities/related-entities.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

@Component({
  selector: "app-admin-entity-public-forms-component",
  templateUrl: "./admin-entity-public-forms-component.html",
  styleUrls: ["./admin-entity-public-forms-component.scss"],
  imports: [ViewTitleComponent, RelatedEntitiesComponent, HintBoxComponent],
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
