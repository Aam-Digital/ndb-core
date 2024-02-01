import { Component, Input } from "@angular/core";
import { Aser } from "../model/aser";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitiesTableComponent } from "../../../../core/common-components/entities-table/entities-table.component";

import { FormFieldConfig } from "../../../../core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponent } from "../../../../core/entity-details/related-entities/related-entities.component";

@DynamicComponent("Aser")
@Component({
  selector: "app-aser",
  templateUrl:
    "../../../../core/entity-details/related-entities/related-entities.component.html",
  standalone: true,
  imports: [EntitiesTableComponent],
})
export class AserComponent extends RelatedEntitiesComponent<Aser> {
  @Input() entity: Child;
  entityCtr = Aser;

  override _columns: FormFieldConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "math", visibleFrom: "xs" },
    { id: "english", visibleFrom: "xs" },
    { id: "hindi", visibleFrom: "md" },
    { id: "bengali", visibleFrom: "md" },
    { id: "remarks", visibleFrom: "md" },
  ];
}
