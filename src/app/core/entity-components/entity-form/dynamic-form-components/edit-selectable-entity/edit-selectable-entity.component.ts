import { Component } from "@angular/core";
import { EditComponent, EditComponentConfig } from "../edit-component";
import { Entity } from "../../../../entity/entity";

@Component({
  selector: "app-edit-selectable-entity",
  templateUrl: "./edit-selectable-entity.component.html",
  styleUrls: ["./edit-selectable-entity.component.scss"],
})
export class EditSelectableEntityComponent extends EditComponent<
  (string | Entity)[]
> {
  entityName: string;
  onInitFromDynamicConfig(config: EditComponentConfig) {
    super.onInitFromDynamicConfig(config);
    this.entityName = config.formFieldConfig.additional || config.propertySchema.ext;
  }
}
