import { Component, Inject, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatInputModule } from "@angular/material/input";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NgIf } from "@angular/common";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { ConfigurableEnumService } from "../../../basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { AdminEntityService } from "../../admin-entity.service";
import { ConfigureEnumPopupComponent } from "../../../basic-datatypes/configurable-enum/configure-enum-popup/configure-enum-popup.component";
import { ConfigurableEnum } from "../../../basic-datatypes/configurable-enum/configurable-enum";
import { generateIdFromLabel } from "../../../../utils/generate-id-from-label/generate-id-from-label";
import { merge } from "rxjs";
import { filter } from "rxjs/operators";
import { uniqueIdValidator } from "app/core/common-components/entity-form/unique-id-validator/unique-id-validator";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator/configure-entity-field-validator.component";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { AnonymizeOptionsComponent } from "./anonymize-options/anonymize-options.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { AdminDefaultValueComponent } from "../../../default-values/admin-default-value/admin-default-value.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { PublicFormConfig } from "app/features/public-form/public-form-config";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { PublicFormsService } from "app/features/public-form/public-forms.service";

/**
 * Allows configuration of the schema of a single Entity field, like its dataType and labels.
 */
@Component({
  selector: "app-admin-entity-field",
  templateUrl: "./admin-entity-field.component.html",
  styleUrls: [
    "./admin-entity-field.component.scss",
    "../../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  imports: [
    MatDialogModule,
    MatButtonModule,
    DialogCloseComponent,
    MatInputModule,
    FormsModule,
    NgIf,
    MatTabsModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
    ConfigureEntityFieldValidatorComponent,
    AnonymizeOptionsComponent,
    MatCheckbox,
    AdminDefaultValueComponent,
    EntityTypeSelectComponent,
  ],
})
export class AdminEntityFieldComponent implements OnInit {
  fieldId: string;
  entityType: EntityConstructor;

  /** current state of the field being edited */
  entitySchemaField: EntitySchemaField;

  form: FormGroup;
  fieldIdForm: FormControl;

  /** form group of all fields in EntitySchemaField (i.e. without fieldId) */
  schemaFieldsForm: FormGroup;

  publicFormConfigEntity: PublicFormConfig;

  additionalForm: FormControl;
  typeAdditionalOptions: SimpleDropdownValue[] = [];
  dataTypes: SimpleDropdownValue[] = [];
  isFormOverride: boolean; // whether this is a form override field
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      fieldId: string;
      entityType: EntityConstructor;
      isFormOverride: boolean;
      entity: Entity;
    },
    private dialogRef: MatDialogRef<any>,
    private fb: FormBuilder,
    @Inject(DefaultDatatype) private allDataTypes: DefaultDatatype[],
    private configurableEnumService: ConfigurableEnumService,
    private entityRegistry: EntityRegistry,
    private adminEntityService: AdminEntityService,
    private dialog: MatDialog,
    private entityMapper: EntityMapperService,
    private publicFormService: PublicFormsService,
  ) {
    this.fieldId = data.fieldId;
    this.entityType = data.entityType;
    this.isFormOverride = data.isFormOverride ?? false;
  }

  async ngOnInit() {
    this.entitySchemaField = {
      ...(this.entityType.schema.get(this.fieldId) ?? {}),
    };

    this.initSettings();

    if (this.isFormOverride) {
      if (this.schemaFieldsForm.get("dataType")?.value) {
        this.schemaFieldsForm.get("dataType")?.disable();
      }
      this.publicFormConfigEntity = await this.entityMapper.load(
        PublicFormConfig.ENTITY_TYPE,
        this.data.entity.getId(),
      );
    }
    this.initAvailableDatatypes(this.allDataTypes);
  }

  private initSettings() {
    this.fieldIdForm = this.fb.control(this.fieldId, {
      validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]*$/)],
      asyncValidators: [
        uniqueIdValidator(Array.from(this.entityType.schema.keys())),
      ],
    });
    this.additionalForm = this.fb.control(this.entitySchemaField.additional);

    this.schemaFieldsForm = this.fb.group({
      label: [this.entitySchemaField.label, Validators.required],
      labelShort: [this.entitySchemaField.labelShort],
      description: [this.entitySchemaField.description],

      dataType: [this.entitySchemaField.dataType, Validators.required],
      isArray: [this.entitySchemaField.isArray],
      additional: this.additionalForm,

      defaultValue: [this.entitySchemaField.defaultValue],
      searchable: [this.entitySchemaField.searchable],
      anonymize: [this.entitySchemaField.anonymize],
      viewComponent: [this.entitySchemaField.viewComponent],
      editComponent: [this.entitySchemaField.editComponent],
      showInDetailsView: [this.entitySchemaField.showInDetailsView],
      generateIndex: [this.entitySchemaField.generateIndex],
      validators: [this.entitySchemaField.validators],
    });
    this.form = this.fb.group({
      id: this.fieldIdForm,
      schemaFields: this.schemaFieldsForm,
    });

    this.schemaFieldsForm.valueChanges.subscribe((v) => {
      if (JSON.stringify(v) === JSON.stringify(this.entitySchemaField)) return;
      this.entitySchemaField = { ...this.getUpdatedSchemaField(v) };
    });

    this.schemaFieldsForm
      .get("labelShort")
      .valueChanges.pipe(filter((v) => v === ""))
      .subscribe((v) => {
        // labelShort should never be empty string, in that case it has to be removed so that label works as fallback
        this.schemaFieldsForm.get("labelShort").setValue(null);
      });
    this.updateDataTypeAdditional(this.schemaFieldsForm.get("dataType").value);
    this.schemaFieldsForm
      .get("dataType")
      .valueChanges.subscribe((v) => this.updateDataTypeAdditional(v));
    this.updateForNewOrExistingField();
  }

  private updateForNewOrExistingField() {
    if (!!this.fieldId) {
      // existing fields' id is readonly
      this.fieldIdForm.disable();
    } else {
      const autoGenerateSubscr = merge(
        this.schemaFieldsForm.get("label").valueChanges,
        this.schemaFieldsForm.get("labelShort").valueChanges,
      ).subscribe(() => this.autoGenerateId());
      // stop updating id when user manually edits
      this.fieldIdForm.valueChanges.subscribe(() =>
        autoGenerateSubscr.unsubscribe(),
      );
    }
  }

  entityFieldValidatorChanges(validatorData: FormValidatorConfig) {
    this.schemaFieldsForm.get("validators").setValue(validatorData);
  }

  private autoGenerateId() {
    // prefer labelShort if it exists, as this makes less verbose IDs
    const label =
      this.schemaFieldsForm.get("labelShort").value ??
      this.schemaFieldsForm.get("label").value;
    const generatedId = generateIdFromLabel(label);
    this.fieldIdForm.setValue(generatedId, { emitEvent: false });
  }

  private initAvailableDatatypes(dataTypes: DefaultDatatype[]) {
    this.dataTypes = dataTypes
      .filter((d) => d.label !== DefaultDatatype.label) // hide "internal" technical dataTypes that did not define a human-readable label
      .map((d) => ({
        label: d.label,
        value: d.dataType,
      }));
  }

  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.value;
  createNewAdditionalOption: (input: string) => SimpleDropdownValue;
  createNewAdditionalOptionAsync = async (input) =>
    this.createNewAdditionalOption(input);

  private updateDataTypeAdditional(
    dataType: string,
    newAdditional: string = this.entitySchemaField.additional,
  ) {
    this.resetAdditional();

    if (dataType === ConfigurableEnumDatatype.dataType) {
      this.initAdditionalForEnum(newAdditional);
    } else if (dataType === EntityDatatype.dataType) {
      this.initAdditionalForEntityRef(newAdditional);
    }

    // hasInnerType: [ArrayDatatype.dataType].includes(d.dataType),

    // TODO: this mapping of having an "additional" schema should probably become part of Datatype classes
  }

  private initAdditionalForEnum(newAdditional?: string) {
    this.typeAdditionalOptions = this.configurableEnumService
      .listEnums()
      .map((x) => ({
        label: Entity.extractEntityIdFromId(x), // TODO: add human-readable label to configurable-enum entities
        value: Entity.extractEntityIdFromId(x),
      }));
    this.additionalForm.addValidators(Validators.required);

    this.createNewAdditionalOption = (text) => ({
      value: generateIdFromLabel(text),
      label: text,
    });

    if (newAdditional) {
      this.additionalForm.setValue(newAdditional);
    } else if (this.schemaFieldsForm.get("label").value) {
      // when switching to enum datatype in the form, if unset generate a suggested enum-id immediately
      const newOption = this.createNewAdditionalOption(
        this.schemaFieldsForm.get("label").value,
      );
      this.typeAdditionalOptions.push(newOption);
      this.additionalForm.setValue(newOption.value);
    }
  }

  private initAdditionalForEntityRef(newAdditional?: string) {
    this.typeAdditionalOptions = this.entityRegistry
      .getEntityTypes(true)
      .map((x) => ({ label: x.value.label, value: x.value.ENTITY_TYPE }));

    this.additionalForm.addValidators(Validators.required);
    if (this.typeAdditionalOptions.some((x) => x.value === newAdditional)) {
      this.additionalForm.setValue(newAdditional);
    }
  }

  private resetAdditional() {
    this.additionalForm.removeValidators(Validators.required);
    this.additionalForm.reset(null);
    this.typeAdditionalOptions = [];
    this.createNewAdditionalOption = undefined;
  }

  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const fieldId = this.fieldIdForm.getRawValue();

    if (this.isFormOverride) {
      await this.publicFormService.updateFieldInPublicFormConfig(
        this.publicFormConfigEntity,
        fieldId,
        this.entitySchemaField,
        this.entityType,
      );

      console.log(this.publicFormConfigEntity, "test");
      this.dialogRef.close(fieldId);
      return;
    }

    this.adminEntityService.updateSchemaField(
      this.entityType,
      fieldId,
      this.entitySchemaField,
    );

    this.dialogRef.close(fieldId);
  }

  private getUpdatedSchemaField(formValues): EntitySchemaField {
    const updatedEntitySchema = {};
    for (const key of Object.keys(formValues)) {
      if (formValues[key] !== null) {
        updatedEntitySchema[key] = formValues[key];
      }
    }
    return updatedEntitySchema;
  }

  openEnumOptions(event: Event) {
    event.stopPropagation(); // do not open the autocomplete dropdown when clicking the settings icon

    let enumEntity = this.configurableEnumService.getEnum(
      this.additionalForm.value,
    );
    if (!enumEntity) {
      // if the user makes changes, the dialog component itself is saving the new entity to the database already
      enumEntity = new ConfigurableEnum(this.additionalForm.value);
    }
    this.dialog.open(ConfigureEnumPopupComponent, { data: enumEntity });
  }
}

interface SimpleDropdownValue {
  label: string;
  value: string;
}
