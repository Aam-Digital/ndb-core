import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EntityConstructor } from "../../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NgIf } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConfig } from "../../../entity/entity-config";

@Component({
  selector: "app-admin-entity-general-settings",
  standalone: true,
  templateUrl: "./admin-entity-general-settings.component.html",
  styleUrl: "./admin-entity-general-settings.component.scss",
  imports: [
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    ErrorHintComponent,
    FormsModule,
    NgIf,
    MatTabsModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
  ],
})
export class AdminEntityGeneralSettingsComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;
  @Output() generalSettingsChange: EventEmitter<EntityConfig> =
    new EventEmitter<EntityConfig>();

  form: FormGroup;
  basicSettingsForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.basicSettingsForm = this.fb.group({
      label: [this.entityConstructor.label, Validators.required],
      labelPlural: [this.entityConstructor.labelPlural],
      icon: [this.entityConstructor.icon, Validators.required],
      toStringAttributes: [
        this.entityConstructor.toStringAttributes,
        Validators.required,
      ],
    });
    this.form = this.fb.group({
      basicSettings: this.basicSettingsForm,
    });

    this.form.valueChanges.subscribe((value) => {
      this.emitStaticDetails(); // Optionally, emit the initial value
    });
  }

  emitStaticDetails() {
    const toStringAttributesControl =
      this.basicSettingsForm.get("toStringAttributes");
    let toStringAttributesValue = toStringAttributesControl.value;
    // Convert toStringAttributesValue to an array if it's a string
    if (typeof toStringAttributesValue === "string") {
      toStringAttributesValue = [toStringAttributesValue];
    }
    // Update the form control with the modified value
    toStringAttributesControl.setValue(toStringAttributesValue, {
      emitEvent: false,
    }); // Avoid triggering value change event

    const value = this.basicSettingsForm.getRawValue();
    this.generalSettingsChange.emit(value);
  }
}
