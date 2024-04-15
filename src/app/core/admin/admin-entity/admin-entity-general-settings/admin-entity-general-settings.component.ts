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
import { StringDatatype } from "../../../basic-datatypes/string/string.datatype";

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
  @Input() generalSettings: EntityConfig;

  form: FormGroup;
  basicSettingsForm: FormGroup;
  toStringAttributesOptions: SimpleDropdownValue[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.basicSettingsForm = this.fb.group({
      label: [this.generalSettings.label, Validators.required],
      labelPlural: [this.generalSettings.labelPlural],
      icon: [this.generalSettings.icon, Validators.required],
      toStringAttributes: [
        this.generalSettings.toStringAttributes,
        Validators.required,
      ],
    });
    this.form = this.fb.group({
      basicSettings: this.basicSettingsForm,
    });
    this.initToStringAttributesOptions();

    this.form.valueChanges.subscribe((value) => {
      // Emit the updated value
      this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue()); // Optionally, emit the initial value
    });
  }

  private initToStringAttributesOptions() {
    const toStringAttributesSelectedOptions =
      this.generalSettings.toStringAttributes;
    if (toStringAttributesSelectedOptions) {
      const filteredStringAttributesOptions = Array.from(
        this.entityConstructor.schema.entries(),
      )
        .filter(
          ([key, field]) =>
            field.dataType === StringDatatype.dataType &&
            field.label &&
            !toStringAttributesSelectedOptions.includes(key),
        )
        .map(([key, field]) => ({ key: key, label: field.label }));
      this.toStringAttributesOptions = [
        ...toStringAttributesSelectedOptions.map((key) => ({
          key: key,
          label: this.entityConstructor.schema.get(key)?.label,
        })),
        ...filteredStringAttributesOptions,
      ];
    }
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;
}

interface SimpleDropdownValue {
  key: string;
  label: string;
}
