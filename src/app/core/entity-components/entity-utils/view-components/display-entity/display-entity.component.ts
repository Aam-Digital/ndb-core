import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
})
export class DisplayEntityComponent
  extends ViewDirective<string>
  implements OnInit {
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;
  entityBlockComponent: string;
  constructor(private entityMapperService: EntityMapperService) {
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
    if (this.value) {
      const type =
        config.config || this.entity.getSchema().get(this.property).additional;
      this.entityToDisplay = await this.entityMapperService
        .load(type, this.value)
        .catch(() => undefined);
      this.ngOnInit();
    }
  }
}
