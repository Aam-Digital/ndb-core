import { Component, Input, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntitySelectComponent } from "../../../common-components/entity-select/entity-select.component";
import { ArrayDatatype } from "../../array/array.datatype";
import { EntityArrayDatatype } from "../entity-array.datatype";

@DynamicComponent("EditEntityArray")
@Component({
  selector: "app-edit-entity-array",
  templateUrl: "./edit-entity-array.component.html",
  imports: [EntitySelectComponent],
  standalone: true,
})
export class EditEntityArrayComponent<T extends string[] | string>
  extends EditComponent<T>
  implements OnInit
{
  @Input() showEntities = true;
  placeholder: string;

  @Input() entityName: string;

  multi: boolean = false;

  ngOnInit() {
    super.ngOnInit();

    this.entityName = this.formFieldConfig.additional;
    if (
      this.formFieldConfig.dataType === ArrayDatatype.dataType ||
      this.formFieldConfig.dataType === EntityArrayDatatype.dataType
    ) {
      this.multi = true;
    }

    this.placeholder = $localize`:Placeholder for input to add entities|context Add User(s):Add ${this.label}`;
  }
}
