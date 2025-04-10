import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";

import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { EnumDropdownComponent } from "../enum-dropdown/enum-dropdown.component";
import { ConfigurableEnumValue } from "../configurable-enum.types";

@DynamicComponent("EditConfigurableEnum")
@Component({
  selector: "app-edit-configurable-enum",
  templateUrl: "./edit-configurable-enum.component.html",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    EnumDropdownComponent,
  ],
})
export class EditConfigurableEnumComponent
  extends EditComponent<ConfigurableEnumValue>
  implements OnInit
{
  enumId: string;
  multi = false;

  override ngOnInit() {
    super.ngOnInit();
    this.multi = this.formFieldConfig.isArray;
    this.enumId = this.formFieldConfig.additional;
  }
}
