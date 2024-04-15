import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
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
  @Input() generalSettings: EntityConfig;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  allFields: any[];
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
      this.allFields.forEach((field) => {
        if (field.label) {
          const fields = field.name;
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

  selectionOnChange(value: any, data: any) {
    console.log(data)
    switch (value) {
      case 'Partially Anonymize':
        data.anonymize = 'retain-anonymized';
        break;
      case 'Retain':
        data.anonymize = 'retain';
        break;
      case 'Remove':
        data.anonymize = '';
        break;
      default:
        // Handle other cases if needed
    }

    const updatedEntitySchema = {
      label: data.fieldlabel || '',
      labelShort: data.labelShort || '',
      description: data.description || '',
    
      dataType: data.dataType || '',
    
      innerDataType: data.innerDataType || '', 
    
      defaultValue: data.defaultValue || '', 
      searchable: data.searchable !== undefined ? data.searchable : true, 
    
      anonymize: data.anonymize || '',
    
      validators: data.validators || [],
    };
    
    const updatedEntitySchemaMerged = Object.assign(
      { _isCustomizedField: true },
      this.entitySchemaField,
      updatedEntitySchema
    );
    console.log(updatedEntitySchemaMerged)

    
    const fieldId = data.fields;
    this.adminEntityService.updateSchemaField(
      this.entityConstructor,
      fieldId,
      updatedEntitySchemaMerged,
    );
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
    this.schemaFieldsForm = this.fb.group({
      dataType: ['string', Validators.required],
      anonymize: ['retain-anonymized'],
    });
  }

  private initToStringAttributesOptions() {
    this.toStringAttributesOptions = Array.from(
      this.entityConstructor.schema.entries(),
    )
      .filter(
        ([key, field]) =>
          field.dataType === StringDatatype.dataType && field.label,
      )
      .map(([key, field]) => ({ key: key, label: field.label }));
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;
}

interface SimpleDropdownValue {
  key: string;
  label: string;
}
