import { Component, Inject, Input } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../common-components/error-hint/error-hint.component";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { NgIf } from "@angular/common";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { EntityArrayDatatype } from "../../basic-datatypes/entity-array/entity-array.datatype";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { ArrayDatatype } from "../../basic-datatypes/array/array.datatype";
import { SchemaEmbedDatatype } from "../../basic-datatypes/schema-embed/schema-embed.datatype";
import { MapDatatype } from "../../basic-datatypes/map/map.datatype";

/**
 * Allows configuration of the schema of a single Entity field, like its dataType and labels.
 */
@Component({
  selector: "app-config-field",
  templateUrl: "./config-field.component.html",
  styleUrls: [
    "./config-field.component.scss",
    "../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  standalone: true,
  imports: [
    MatDialogModule,
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
export class ConfigFieldComponent {
  @Input() entityType: EntityConstructor;
  @Input() formFieldConfig: FormFieldConfig;
  field: string;

  schemaFieldConfig: EntitySchemaField & { id?: string }; // TODO: add id / key to EntitySchemaField for easier handling?

  form: FormGroup;
  formLabelShort: FormControl;
  useShortLabel: boolean;
  formAdditional: FormControl;
  formAdditionalOptions: any[] = null;
  dataTypes = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entityType: EntityConstructor;
      formFieldConfig: FormFieldConfig;
    },
    private fb: FormBuilder,
    @Inject(DefaultDatatype) dataTypes: DefaultDatatype[],
    private configurableEnumService: ConfigurableEnumService,
  ) {
    this.entityType = data.entityType;
    this.formFieldConfig = data.formFieldConfig;
    // TODO: merge formField and schemaField config interfaces to be exactly matching, simply enabling direct overwrites?
    this.schemaFieldConfig = {
      ...this.entityType.schema.get(this.formFieldConfig.id),
      id: this.formFieldConfig.id,
    };

    this.initSettings();
    this.initAvailableDatatypes(dataTypes);
  }

  private initSettings() {
    this.formLabelShort = this.fb.control(this.schemaFieldConfig.labelShort);
    this.formAdditional = this.fb.control(this.schemaFieldConfig.additional);

    this.form = this.fb.group({
      label: [this.schemaFieldConfig.label],
      labelShort: this.formLabelShort,
      description: [this.schemaFieldConfig.description],

      id: this.fb.control({ value: this.schemaFieldConfig.id, disabled: true }),
      dataType: [this.schemaFieldConfig.dataType],
      additional: [this.schemaFieldConfig.additional],

      // TODO: remove "innerDataType" completely - the UI can only support very specific multi-valued types anyway
      // TODO add a datatype "alias" for enum-array
      innerDataType: [this.schemaFieldConfig.innerDataType],

      defaultValue: [this.schemaFieldConfig.defaultValue],
      searchable: [this.schemaFieldConfig.searchable],
      anonymize: [this.schemaFieldConfig.anonymize],
      //viewComponent: [],
      //editComponent: [],
      //showInDetailsView: [],
      //generateIndex: [],
      validators: [this.schemaFieldConfig.validators],
    });

    this.updateShortLabelToggle(!!this.formLabelShort.value);
    this.updateDataTypeAdditional(this.form.get("dataType").value);
    this.form
      .get("dataType")
      .valueChanges.subscribe((v) => this.updateDataTypeAdditional(v));
  }

  updateShortLabelToggle(useShortLabel: boolean) {
    this.useShortLabel = useShortLabel;

    if (!this.useShortLabel) {
      this.formLabelShort.setValue(null);
      this.formLabelShort.disable();
    }

    if (
      this.useShortLabel &&
      this.formLabelShort.disabled &&
      this.form.enabled
    ) {
      this.formLabelShort.setValue(this.form.get("label").value);
      this.formLabelShort.enable();
    }
  }

  private initAvailableDatatypes(dataTypes: DefaultDatatype[]) {
    this.dataTypes = dataTypes
      .filter(
        (d) =>
          d.dataType !== ArrayDatatype.dataType &&
          d.dataType !== SchemaEmbedDatatype.dataType &&
          d.dataType !== MapDatatype.dataType,
      )
      .map((d) => ({
        label: d.dataType,
        value: d.dataType,
      }));
    // TODO: human-readable names for data types
  }
  objectToLabel = (v: { label: string }) => v?.label;
  objectToValue = (v: { value: string }) => v?.value;

  private updateDataTypeAdditional(dataType: string) {
    if (dataType === ConfigurableEnumDatatype.dataType) {
      this.formAdditionalOptions = this.configurableEnumService
        .listEnums()
        .map((x) => Entity.extractEntityIdFromId(x));
      // TODO allow new enum creation
      // TODO preview the options within the selected enum (and allow to edit the enum options?)
    } else if (
      dataType === EntityDatatype.dataType ||
      dataType === EntityArrayDatatype.dataType
    ) {
      // TODO reuse and generalize ImportEntityTypeComponent.loadEntityTypes()
      this.formAdditionalOptions = [];
    } else {
      this.form.get("additional").setValue(null);
      this.formAdditionalOptions = null;
    }

    // hasInnerType: [ArrayDatatype.dataType].includes(d.dataType),

    // TODO: this mapping of having an "additional" schema should probably become part of Datatype classes
  }
}
