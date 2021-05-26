import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../../entity/entity";
import { OnInitDynamicComponent } from "../../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ENTITY_MAP } from "../../../entity-details/entity-details.component";

@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
})
export class DisplayEntityComponent implements OnInit, OnInitDynamicComponent {
  @Input() entity: Entity;
  @Input() linkDisabled = false;
  entityBlockComponent: string;
  constructor(private entityMapper: EntityMapperService) {}

  ngOnInit(): void {
    if (this.entity) {
      this.entityBlockComponent = this.entity
        .getConstructor()
        .getBlockComponent();
    }
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    const type = config.config || config.entity.getSchema().get(config.id).ext;
    const entityConstructor = ENTITY_MAP.get(type);
    if (!entityConstructor) {
      throw new Error(`Could not find type ${type} in ENTITY_MAP`);
    }
    this.entity = await this.entityMapper
      .load(entityConstructor, config.entity[config.id])
      .catch(() => null);
    this.ngOnInit();
  }
}
