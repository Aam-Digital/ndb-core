import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
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
import { AnonymizeOptionsComponent } from "../../admin-entity-details/admin-entity-field/anonymize-options/anonymize-options.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ConfigurableEnumDatatype } from "app/core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { DateOnlyDatatype } from "app/core/basic-datatypes/date-only/date-only.datatype";
import { AdminIconComponent } from "app/admin-icon-input/admin-icon-input.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";

@Component({
  selector: "app-admin-entity-general-settings",
  templateUrl: "./admin-entity-general-settings.component.html",
  styleUrls: [
    "./admin-entity-general-settings.component.scss",
    "../admin-entity-styles.scss",
  ],
  imports: [
    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatTabsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
    MatCheckboxModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    MatTooltipModule,
    HelpButtonComponent,
    AnonymizeOptionsComponent,
    FaIconComponent,
    AdminIconComponent,
  ],
})
export class AdminEntityGeneralSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminEntityService = inject(AdminEntityService);

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

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.basicSettingsForm = this.fb.group({
      label: [this.generalSettings.label, Validators.required],
      labelPlural: [this.generalSettings.labelPlural],
      icon: [this.generalSettings.icon],
      color: [this.generalSettings.color],
      toStringAttributes: [this.generalSettings.toStringAttributes],
      hasPII: [this.generalSettings.hasPII],
      enableUserAccounts: [this.generalSettings?.enableUserAccounts],
    });
    this.showPIIDetails = this.basicSettingsForm.get("hasPII").value;
    this.fetchAnonymizationTableData();
    this.initToStringAttributesOptions();

    this.basicSettingsForm.valueChanges.subscribe((value) => {
      this.reorderedStringAttributesOptions();
      this.generalSettingsChange.emit(this.basicSettingsForm.getRawValue());
    });
  }

  private reorderedStringAttributesOptions() {
    const selectedKeys = this.basicSettingsForm.get("toStringAttributes").value;
    const allOptions = [...this.toStringAttributesOptions];

    this.toStringAttributesOptions = [
      ...selectedKeys
        .map((key) => allOptions.find((o) => o.value === key))
        .filter(Boolean),
      ...allOptions.filter((o) => !selectedKeys.includes(o.value)),
    ];
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
          [
            StringDatatype.dataType,
            ConfigurableEnumDatatype.dataType,
            DateOnlyDatatype.dataType,
          ].includes(field.dataType) &&
          field.label &&
          !selectedOptions.includes(key),
      )
      .map(([key, field]) => ({ value: key, label: field.label }));

    this.toStringAttributesOptions = [
      ...selectedOptions.map((value) => ({
        value: value,
        label: this.entityConstructor.schema.get(value)?.label,
      })),
      ...unselectedOptions,
    ];
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.value;
}
