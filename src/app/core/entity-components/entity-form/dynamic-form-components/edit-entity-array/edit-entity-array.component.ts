import { Component } from "@angular/core";
import { EditComponent, EditComponentConfig } from "../edit-component";
import { Entity } from "../../../../entity/entity";

@Component({
  selector: "app-edit-selectable-entity",
  templateUrl: "./edit-entity-array.component.html",
  styleUrls: ["./edit-entity-array.component.scss"],
})
export class EditEntityArrayComponent extends EditComponent<
  (string | Entity)[]
> {
  entityName: string;
  onInitFromDynamicConfig(config: EditComponentConfig) {
    super.onInitFromDynamicConfig(config);
    this.entityName =
      config.formFieldConfig.additional || config.propertySchema.ext;
  }
}
