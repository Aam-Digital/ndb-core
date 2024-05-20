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
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from "@angular/material/checkbox";
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
  styleUrls: [
    "./admin-entity-general-settings.component.scss",
    "../admin-entity-styles.scss",
  ],
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

  @Input() showPIIDetails: boolean;
  fieldAnonymizationDataSource: MatTableDataSource<{
    key: string;
    label: string;
    field: EntitySchemaField;
  }>;

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
      icon: [this.generalSettings.icon],
      toStringAttributes: [this.generalSettings.toStringAttributes],
      hasPII: [this.generalSettings.hasPII],
    });
    this.showPIIDetails = this.basicSettingsForm.get("hasPII").value;
    this.fetchAnonymizationTableData();
    this.initToStringAttributesOptions();

    this.basicSettingsForm.valueChanges.subscribe((value) => {
      this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue()); // Optionally, emit the initial value
    });
  }

  fetchAnonymizationTableData() {
    if (this.showPIIDetails) {
      const fields = Array.from(this.entityConstructor.schema.entries())
        .filter(([key, field]) => field.label)
        .map(([key, field]) => ({
          key: key,
          label: field.label,
          field: field,
        }));
      this.fieldAnonymizationDataSource = new MatTableDataSource(fields);
    }
  }

  toggleAnonymizationTable(event: MatCheckboxChange) {
    this.showPIIDetails = event.checked;
    this.basicSettingsForm.get("hasPII").setValue(this.showPIIDetails);
    this.fetchAnonymizationTableData();
  }

  changeFieldAnonymization(
    fieldSchema: EntitySchemaField,
    newAnonymizationValue,
  ) {
    fieldSchema.anonymize = newAnonymizationValue;
    fieldSchema._isCustomizedField = true;

    this.adminEntityService.updateSchemaField(
      this.entityConstructor,
      this.fieldAnonymizationDataSource.data.find(
        (v) => v.field === fieldSchema,
      ).key,
      fieldSchema,
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

interface SimpleDropdownValue {
  key: string;
  label: string;
}
