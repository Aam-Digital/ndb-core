import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { PublicFormConfig } from "../public-form-config";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: "app-edit-publicform-route",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: "./edit-publicform-route.component.html",
  styleUrls: ["./edit-publicform-route.component.scss"],
})
export class EditPublicformRouteComponent
  extends EditComponent<string>
  implements OnInit
{
  form: FormGroup;
  constructor(private fb: FormBuilder) {
    super();
  }

  override ngOnInit(): void {
    const publicFormConfig: PublicFormConfig = {
      route: this.formControl.getRawValue(),
    } as Partial<PublicFormConfig> as PublicFormConfig;

    this.form = this.fb.group({
      route: [publicFormConfig.route || ""],
    });

    this.form.valueChanges.subscribe((value) => {
      this.formControl.setValue(value.route);
      this.formControl.markAsDirty();
    });
  }

  getPrefixValue(): string {
    const currentUrl = window.location.host;

    return `${currentUrl}/public-form/`;
  }
}
