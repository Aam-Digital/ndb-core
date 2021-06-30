import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Entity } from "../../../../entity/model/entity";

@Component({
  selector: "app-edit-entity-array",
  templateUrl: "./edit-entity-array.component.html",
  styleUrls: ["./edit-entity-array.component.scss"],
})
export class EditEntityArrayComponent extends EditComponent<
  (string | Entity)[]
> {
  entityName: string;
  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.entityName =
      config.formFieldConfig.additional || config.propertySchema.additional;
  }
}
