import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EntityConstructor } from "../../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CommonModule, NgIf } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConfig } from "../../../entity/entity-config";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { AdminEntityService } from "../../admin-entity.service";
import { StringDatatype } from "../../../basic-datatypes/string/string.datatype";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { MatSort } from "@angular/material/sort";
import { EntityFieldLabelComponent } from "../../../common-components/entity-field-label/entity-field-label.component";
import { AnonymizeOptionsComponent } from "app/core/common-components/anonymize-options/anonymize-options.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-admin-entity-general-settings",
  standalone: true,
  templateUrl: "./admin-entity-general-settings.component.html",
  styleUrl: "./admin-entity-general-settings.component.scss",
  imports: [
    MatButtonModule,
    MatInputModule,
    FormsModule,
    NgIf,
    MatTabsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
    MatCheckboxModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    CommonModule,
    MatTooltipModule,
    HelpButtonComponent,
    MatSort,
    EntityFieldLabelComponent,
    AnonymizeOptionsComponent,
    FaIconComponent,
  ],
})
export class AdminEntityGeneralSettingsComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;
  @Output() generalSettingsChange: EventEmitter<EntityConfig> =
    new EventEmitter<EntityConfig>();
  @Input() generalSettings: EntityConfig;
  allPIIFields: any[];
  @Input() showPIIDetails: boolean;
  entitySchemaField: EntitySchemaField;
  fieldAnonymizationDataSource: MatTableDataSource<any>;
  form: FormGroup;
  basicSettingsForm: FormGroup;
  toStringAttributesOptions: SimpleDropdownValue[] = [];
  constructor(
    private fb: FormBuilder,
    private adminEntityService: AdminEntityService,
  ) {}

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
      hasPII: [this.generalSettings.hasPII],
    });
    this.showPIIDetails = this.basicSettingsForm.get("hasPII").value;
    this.form = this.fb.group({
      basicSettings: this.basicSettingsForm,
    });
    this.fetchTableData();
    this.initToStringAttributesOptions();

    this.form.valueChanges.subscribe((value) => {
      this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue()); // Optionally, emit the initial value
    });
  }

  fetchTableData() {
    if (this.showPIIDetails) {
      this.allPIIFields = Array.from(this.entityConstructor.schema.entries())
        .filter(
          ([key, field]) =>
            field.dataType === StringDatatype.dataType && field.label,
        )
        .map(([key, field]) => ({
          key: key,
          anonymize: field.anonymize,
          label: field.label,
        }));

      const anonymizeData = this.allPIIFields.map((field) => {
        return { fields: field.label, anonymize: field.anonymize };
      });

      this.fieldAnonymizationDataSource = new MatTableDataSource<any>(
        anonymizeData,
      );
    }
  }

  toggleTable(event: any) {
    this.showPIIDetails = event.checked;
    this.basicSettingsForm.get("hasPII").setValue(this.showPIIDetails);
    this.fetchTableData();
  }

  changeFieldAnonymization(selectFieldData: {
    anonymize: AnonymizeOption;
    fields: string;
  }) {
    const selectedFieldDetails = this.allPIIFields.find(
      (field) => field.label === selectFieldData.fields,
    );
    const selectedFieldId = selectedFieldDetails.key;
    let selectedFielddetails =
      this.entityConstructor.schema.get(selectedFieldId);
    selectedFielddetails.anonymize = selectFieldData.anonymize;
    const updatedEntitySchemaMerged = Object.assign(
      { _isCustomizedField: true },
      this.entitySchemaField,
      selectedFielddetails,
    );

    this.adminEntityService.updateSchemaField(
      this.entityConstructor,
      selectedFieldId,
      updatedEntitySchemaMerged,
    );
  }

  private initToStringAttributesOptions() {
    if (!this.generalSettings.toStringAttributes) {
      return;
    }

    const selectedOptions = this.generalSettings.toStringAttributes;
    const unselectedOptions = Array.from(
      this.entityConstructor.schema.entries(),
    )
      .filter(
        ([key, field]) =>
          field.dataType === StringDatatype.dataType &&
          field.label &&
          !selectedOptions.includes(key),
      )
      .map(([key, field]) => ({ key: key, label: field.label }));

    this.toStringAttributesOptions = [
      ...selectedOptions.map((key) => ({
        key: key,
        label: this.entityConstructor.schema.get(key)?.label,
      })),
      ...unselectedOptions,
    ];
  }
  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;
}

type AnonymizeOption = "retain" | "retain-anonymized";
interface SimpleDropdownValue {
  key: string;
  label: string;
}
