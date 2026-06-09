import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigDynamic } from "../default-value-config-dynamic";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltip } from "@angular/material/tooltip";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  internalControl: FormControl<string>;

  ngOnInit() {
    this.internalControl = new FormControl(this.value?.value);
    this.internalControl.valueChanges.subscribe((v) => (this.value = { value: v }));
  }
}
