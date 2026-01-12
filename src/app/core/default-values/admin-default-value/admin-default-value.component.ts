import { Component, inject, Input, OnInit } from "@angular/core";
import { DefaultValueConfig } from "../default-value-config";
import {
  MatError,
  MatFormField,
  MatFormFieldControl,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms";
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from "@angular/material/button-toggle";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../default-value-strategy.interface";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatIconButton } from "@angular/material/button";
import { EntityConstructor } from "../../entity/model/entity";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { AdminDefaultValueDynamicComponent } from "../x-dynamic-placeholder/admin-default-value-dynamic/admin-default-value-dynamic.component";
import { AdminDefaultValueStaticComponent } from "../x-static/admin-default-value-static/admin-default-value-static.component";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { AdminInheritedFieldComponent } from "../../../features/inherited-field/admin-inherited-field/admin-inherited-field.component";

/**
 * Admin UI component used in AdminEntityFieldComponent dialog
 * to let users configure different defaultValue modes for an Entity field.
 */
@Component({
  selector: "app-admin-default-value",
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    ReactiveFormsModule,
    FormsModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip,
    FaIconComponent,
    MatSuffix,
    MatIconButton,
    AdminDefaultValueDynamicComponent,
    AdminDefaultValueStaticComponent,
    AdminInheritedFieldComponent,
  ],
  templateUrl: "./admin-default-value.component.html",
  styleUrl: "./admin-default-value.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: AdminDefaultValueComponent },
  ],
})
export class AdminDefaultValueComponent
  extends CustomFormControlDirective<DefaultValueConfig>
  implements OnInit
{
  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;
  form: FormGroup;

  private defaultValueStrategies = inject(
    DefaultValueStrategy,
  ) as unknown as DefaultValueStrategy[];

  modes: AdminDefaultValueContext[];

  async ngOnInit() {
    this.initForm();
    await this.initAvailableModes();
  }

  private async initAvailableModes() {
    this.modes = await Promise.all(
      this.defaultValueStrategies.map((strategy) => strategy.getAdminUI()),
    );
  }

  private initForm() {
    this.form = new FormGroup({
      mode: new FormControl(this.value?.mode),
      config: new FormControl(this.value?.config, {
        validators: [this.requiredIfModeSelected()],
      }),
    });

    this.form
      .get("mode")
      .valueChanges.subscribe((mode) => this.form.get("config").setValue(null));

    this.form.get("config").valueChanges.subscribe((value) => {
      if (!this.form.get("mode").getRawValue() && !!value) {
        // set default mode as "static" after user started typing a value
        this.form.get("mode").setValue("static", { emitEvent: false });
      }
    });

    this.form.valueChanges.subscribe(() => this.updateValue());
  }

  private updateValue() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // TODO: make sure the admin components of each mode are correctly setting themselves as invalid
      return;
    }

    let newConfigValue: DefaultValueConfig = this.form.getRawValue();

    // output as `null` if no value is set to conform with standard form controls
    if (!newConfigValue || (!newConfigValue.mode && !newConfigValue.config)) {
      newConfigValue = null;
    }

    if (JSON.stringify(newConfigValue) !== JSON.stringify(this.value)) {
      this.value = newConfigValue;
    }
  }

  private requiredIfModeSelected(): ValidatorFn {
    return (control) => {
      if (this.form?.get("mode")?.value && !control.value) {
        return { requiredForMode: true };
      }
      return null;
    };
  }

  clearDefaultValue() {
    // TODO: this causes the config to keep a defaultValue with `config: { value: null }` instead of returning just `null` and deleting the property
    // Need to fix so that the parent form control gets reset to null (without causing errors in the component here internally)
    this.form.setValue({ mode: null, config: null });
  }
}
