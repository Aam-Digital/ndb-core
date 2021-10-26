import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewDirective } from "../view.directive";
import { DynamicEntityService } from "app/core/entity/dynamic-entity.service";

@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
})
export class DisplayEntityComponent extends ViewDirective implements OnInit {
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;
  entityBlockComponent: string;
  constructor(private dynamicEntityService: DynamicEntityService) {
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
      this.entityToDisplay = await this.dynamicEntityService
        .loadEntity(type, this.entity[this.property])
        .catch(() => undefined);
      this.ngOnInit();
    }
  }
}
