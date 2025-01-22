import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { PublicFormConfig } from "../public-form-config";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AlertService } from "app/core/alerts/alert.service";
import { ErrorHintComponent } from "app/core/common-components/error-hint/error-hint.component";

@Component({
  selector: "app-edit-publicform-route",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    FontAwesomeModule,
    MatIconButton,
    MatTooltipModule,
    ErrorHintComponent,
  ],
  templateUrl: "./edit-publicform-route.component.html",
  styleUrls: ["./edit-publicform-route.component.scss"],
})
export class EditPublicformRouteComponent
  extends EditComponent<string>
  implements OnInit
{
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
  ) {
    super();
  }

  override ngOnInit(): void {
    const publicFormConfig: PublicFormConfig = {
      route: this.formControl.getRawValue(),
    } as Partial<PublicFormConfig> as PublicFormConfig;

    this.form = this.fb.group({
      route: [publicFormConfig.route, Validators.required],
    });

    this.form.valueChanges.subscribe((value) => {
      this.formControl.setValue(value.route);
      this.formControl.markAsDirty();
    });
  }

  getPrefixValue(): string {
    const currentUrl = window.location.origin;

    return `${currentUrl}/public-form/`;
  }
  copyToClipboard(): void {
    const fullUrl =
      this.getPrefixValue() + (this.form.get("route")?.value || "");
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.alertService.addInfo("Link copied: " + fullUrl);
    });
  }
}
