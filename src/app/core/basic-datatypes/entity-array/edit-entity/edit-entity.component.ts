import { Component, Input, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntitySelectComponent } from "../../../common-components/entity-select/entity-select.component";
import { isArrayDataType } from "../../datatype-utils";

/**
 * A form field to select among the entities of the given type(s).
 * Can be configured as single or multi select.
 */
@DynamicComponent("EditEntity")
@Component({
  selector: "app-edit-entity",
  templateUrl: "./edit-entity.component.html",
  imports: [EntitySelectComponent],
  standalone: true,
})
export class EditEntityComponent<T extends string[] | string = string[]>
  extends EditComponent<T>
  implements OnInit
{
  @Input() showEntities = true;
  placeholder: string;

  @Input() entityName: string;

  multi: boolean = false;

  ngOnInit() {
    super.ngOnInit();

    this.entityName = this.entityName ?? this.formFieldConfig.additional;

    this.multi = isArrayDataType(this.formFieldConfig.dataType);

    this.placeholder = $localize`:Placeholder for input to add entities|context Add User(s):Add ${this.label}`;
  }
}
