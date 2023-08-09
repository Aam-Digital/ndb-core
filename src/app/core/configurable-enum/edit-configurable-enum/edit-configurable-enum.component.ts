import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { ArrayDatatype } from "../../entity/schema-datatypes/datatype-array";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumDirective } from "../configurable-enum-directive/configurable-enum.directive";
import { NgIf } from "@angular/common";
import { EnumDropdownComponent } from "../enum-dropdown/enum-dropdown.component";

@DynamicComponent("EditConfigurableEnum")
@Component({
  selector: "app-edit-configurable-enum",
  templateUrl: "./edit-configurable-enum.component.html",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    ConfigurableEnumDirective,
    NgIf,
    EnumDropdownComponent,
  ],
  standalone: true,
})
export class EditConfigurableEnumComponent
  extends EditComponent<ConfigurableEnumValue>
  implements OnInit
{
  enumId: string;
  multi = false;

  ngOnInit() {
    super.ngOnInit();
    if (this.propertySchema.dataType === ArrayDatatype.dataType) {
      this.multi = true;
    }
    this.enumId =
      this.formFieldConfig.additional ||
      this.propertySchema.additional ||
      this.propertySchema.innerDataType;
  }
}
