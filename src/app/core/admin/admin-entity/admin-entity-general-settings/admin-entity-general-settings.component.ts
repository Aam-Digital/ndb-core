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
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";

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
  form: FormGroup;
  basicSettingsForm: FormGroup;
  toStringAttributess: SimpleDropdownValue[] = [];
  private originalEntitySchemaFields: [string, EntitySchemaField][];
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.init();
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes.config) {
  //     console.log(changes.config)
  //     // this.init();
  //   }
  // }

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
    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );
    this.initAvailableDatatypes(this.originalEntitySchemaFields);

    this.form.valueChanges.subscribe((value) => {
      this.emitStaticDetails(); // Optionally, emit the initial value
    });
  }
  private initAvailableDatatypes(array) {
    this.toStringAttributess = array.map((entry, index) => ({
      id: index.toString(),
      key: entry[0],
      label: entry[1].label, // Assuming label is present in the second element of each entry
    }));
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;

  emitStaticDetails() {
    console.log(this.basicSettingsForm);
    // Emit the updated value
    this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue());
  }
}
interface SimpleDropdownValue {
  key: string;
  label: string;
}
