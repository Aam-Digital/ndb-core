import { Component, OnInit } from "@angular/core";
import { MatInput } from "@angular/material/input";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigStatic } from "../default-value-config-static";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  selector: "app-admin-default-value-static",
  imports: [MatInput, ReactiveFormsModule],
  templateUrl: "./admin-default-value-static.component.html",
  styleUrl: "./admin-default-value-static.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueStaticComponent,
    },
  ],
})
export class AdminDefaultValueStaticComponent
  extends CustomFormControlDirective<DefaultValueConfigStatic>
  implements OnInit
{
  formControl: FormControl<string>;

  ngOnInit() {
    this.formControl = new FormControl(this.value?.value);
    this.formControl.valueChanges.subscribe((v) => (this.value = { value: v }));
  }
}
