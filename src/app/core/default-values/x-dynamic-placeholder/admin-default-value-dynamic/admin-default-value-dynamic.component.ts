import { Component, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigDynamic } from "../default-value-config-dynamic";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltip } from "@angular/material/tooltip";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  selector: "app-admin-default-value-dynamic",
  imports: [MatOption, MatSelect, MatTooltip, ReactiveFormsModule],
  templateUrl: "./admin-default-value-dynamic.component.html",
  styleUrl: "./admin-default-value-dynamic.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueDynamicComponent,
    },
  ],
})
export class AdminDefaultValueDynamicComponent
  extends CustomFormControlDirective<DefaultValueConfigDynamic>
  implements OnInit
{
  formControl: FormControl<string>;

  ngOnInit() {
    this.formControl = new FormControl(this.value?.value);
    this.formControl.valueChanges.subscribe((v) => (this.value = { value: v }));
  }
}
