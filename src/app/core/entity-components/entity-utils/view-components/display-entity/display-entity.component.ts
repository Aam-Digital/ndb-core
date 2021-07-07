import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ENTITY_MAP } from "../../../entity-details/entity-details.component";
import { ViewComponent } from "../view-component";

@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
})
export class DisplayEntityComponent extends ViewComponent implements OnInit {
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;
  entityBlockComponent: string;
  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  ngOnInit(): void {
    if (this.entityToDisplay) {
      this.entityBlockComponent = this.entityToDisplay
        .getConstructor()
        .getBlockComponent();
    }
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (this.entity[this.property]) {
      const type =
        config.config || this.entity.getSchema().get(this.property).additional;
      const entityConstructor = ENTITY_MAP.get(type);
      if (!entityConstructor) {
        throw new Error(`Could not find type ${type} in ENTITY_MAP`);
      }
      this.entityToDisplay = await this.entityMapper
        .load(entityConstructor, this.entity[this.property])
        .catch(() => undefined);
      this.ngOnInit();
    }
  }
}
