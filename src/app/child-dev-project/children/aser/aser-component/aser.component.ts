import { Component, Input } from "@angular/core";
import { Aser } from "../model/aser";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitiesTableComponent } from "../../../../core/common-components/entities-table/entities-table.component";

import { FormFieldConfig } from "../../../../core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponent } from "../../../../core/entity-details/related-entities/related-entities.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../../utils/media/screen-size-observer.service";

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
  property = "child";
  entityCtr = Aser;

  override _columns: FormFieldConfig[] = [
    { id: "date", visibleFrom: "xs" },
    { id: "math", visibleFrom: "xs" },
    { id: "english", visibleFrom: "xs" },
    { id: "hindi", visibleFrom: "md" },
    { id: "bengali", visibleFrom: "md" },
    { id: "remarks", visibleFrom: "md" },
  ];

  constructor(
    private childrenService: ChildrenService,
    entityMapper: EntityMapperService,
    entityRegistry: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
  ) {
    super(entityMapper, entityRegistry, screenWidthObserver);
  }

  override getData() {
    return this.childrenService
      .getAserResultsOfChild(this.entity.getId())
      .then((data) =>
        data.sort(
          (a, b) =>
            (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0),
        ),
      );
  }
}
