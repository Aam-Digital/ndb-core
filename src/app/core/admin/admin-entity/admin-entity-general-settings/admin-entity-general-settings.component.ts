import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  ViewChild,
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
import { CommonModule, NgIf } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConfig } from "../../../entity/entity-config";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { AdminEntityService } from "../../admin-entity.service";

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
    MatCheckboxModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    MatPaginatorModule,
    CommonModule,
  ],
})
export class AdminEntityGeneralSettingsComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;
  @Output() generalSettingsChange: EventEmitter<EntityConfig> =
    new EventEmitter<EntityConfig>();
  @Input() config: EntityConfig;
  @Input() usedFields: any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatPaginator,  {static: false}) set matPaginator(paginator: MatPaginator) {
    if (this.showTable) {
      this.dataSource.paginator = paginator;
    }
  }
  entitySchemaField: EntitySchemaField;
  schemaFieldsForm:FormGroup;
  dataSource: MatTableDataSource<any>;
  anonymizOptionList: string[] = ["Retain", "Partially Anonymize", "Remove"];

  showTable = false;
  form: FormGroup;
  basicSettingsForm: FormGroup;
  toStringAttributesOptions: SimpleDropdownValue[] = [];
    
    constructor(private fb: FormBuilder,private adminEntityService: AdminEntityService ) {
    
  }

  ngOnInit(): void {
    this.init();
  }
  toggleTable(event: any) {
    this.showTable = event.checked;
    if (this.showTable) {
      const data = [];
      this.entityConstructor.schema.forEach((field) => {
        if (field.label) {
          const fields = field.label;
          let anonymize = "Remove";

          if (field.anonymize === "retain") {
            anonymize = "Retain";
          } else if (field.anonymize === "retain-anonymized") {
            anonymize = "Partially Anonymize";
          } else if (field.anonymize) {
            anonymize = field.anonymize;
          }
          
          data.push({ fields, anonymize });
        }
      });
      this.dataSource = new MatTableDataSource<any>(data);
      this.dataSource.paginator = this.paginator; 
    }
  }

  selectionOnChange(value: any, element: any) {
    const formValues = this.schemaFieldsForm.getRawValue();
    const updatedEntitySchema = Object.assign(
      { _isCustomizedField: true },
      this.entitySchemaField, // TODO: remove this merge once all schema fields are in the form (then only form values should apply)
      formValues,
    );
    const fieldId = 'projectNumber';
    this.adminEntityService.updateSchemaField(
      this.entityConstructor,
      fieldId,
      updatedEntitySchema.anonymize = 'retain-anonymized',
    );

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
    this.schemaFieldsForm = this.fb.group({
      dataType: ['string', Validators.required],
      anonymize: ['retain-anonymized'],
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
