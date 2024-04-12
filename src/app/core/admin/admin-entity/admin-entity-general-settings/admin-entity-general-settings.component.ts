import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
} from "@angular/core";
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
  @Input() config: EntityConfig;
  @Input() usedFields: any;
  form: FormGroup;
  basicSettingsForm: FormGroup;
  toStringAttributesOptions: any[] = [];
  allUsedFields: any;
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.basicSettingsForm = this.fb.group({
      label: [this.config.label, Validators.required],
      labelPlural: [this.config.labelPlural],
      icon: [this.config.icon, Validators.required],
      toStringAttributes: [this.config.toStringAttributes, Validators.required],
    });
    this.form = this.fb.group({
      basicSettings: this.basicSettingsForm,
    });
    this.initAvailableDatatypes();

    this.form.valueChanges.subscribe((value) => {
      this.emitStaticDetails(); // Optionally, emit the initial value
    });
  }
  private initAvailableDatatypes() {
    const allFields = Array.from(this.entityConstructor.schema.entries())
      .filter((entry) => entry[1].dataType === "string" && entry[1].label)
      .map((entry) => ({ name: entry[0], label: entry[1].label }));

    this.toStringAttributesOptions = allFields.map((field) => ({
      key: field.name,
      label: field.name,
    }));
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;

  emitStaticDetails() {
    // Emit the updated value
    this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue());
  }
}
interface SimpleDropdownValue {
  key: string;
  label: string;
}
