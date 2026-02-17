import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
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
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { MatTabsModule } from "@angular/material/tabs";
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from "@angular/material/slide-toggle";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { ConfigurableEnumService } from "../../../basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { ConfigureEnumPopupComponent } from "../../../basic-datatypes/configurable-enum/configure-enum-popup/configure-enum-popup.component";
import { ConfigurableEnum } from "../../../basic-datatypes/configurable-enum/configurable-enum";
import { generateIdFromLabel } from "../../../../utils/generate-id-from-label/generate-id-from-label";
import { merge } from "rxjs";
import { filter } from "rxjs/operators";
import { uniquePropertyValidator } from "app/core/common-components/entity-form/unique-property-validator/unique-property-validator";
import { ConfigureEntityFieldValidatorComponent } from "./configure-entity-field-validator/configure-entity-field-validator.component";
import { FormValidatorConfig } from "app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { AnonymizeOptionsComponent } from "./anonymize-options/anonymize-options.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { AdminDefaultValueComponent } from "../../../default-values/admin-default-value/admin-default-value.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { AdminSearchableCheckboxComponent } from "./admin-searchable-checkbox/admin-searchable-checkbox.component";
import { SimpleDropdownValue } from "app/core/common-components/basic-autocomplete/simple-dropdown-value.interface";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { YesNoButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";

/**
 * Dialog data for AdminEntityFieldComponent
 */
export interface AdminEntityFieldData {
  /** current state of the field being edited */
  entitySchemaField: EntitySchemaField;

  /**
   * Entity type this field is part of,
   * to use as context information.
   * The entityType is not changed by this component.
   */
  entityType: EntityConstructor;

  /**
   * Whether the field is changed only for a single view instead of globally for the entity type.
   * Use to prevent changes to config that are required to be consistent across all uses of the field.
   */
  overwriteLocally: boolean;
}

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
    AdminSearchableCheckboxComponent,
  ],
})
export class AdminEntityFieldComponent implements OnInit {
  data = inject<AdminEntityFieldData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<any>>(MatDialogRef);
  private fb = inject(FormBuilder);
  private allDataTypes = inject(DefaultDatatype);
  private configurableEnumService = inject(ConfigurableEnumService);
  private entityRegistry = inject(EntityRegistry);
  private dialog = inject(MatDialog);
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  fieldId: string;
  entityType: EntityConstructor;

  form: FormGroup;
  fieldIdForm: FormControl;

  /** form group of all fields in EntitySchemaField (i.e. without fieldId) */
  schemaFieldsForm: FormGroup;
  additionalForm: FormControl;
  typeAdditionalOptions: SimpleDropdownValue[] = [];
  dataTypes: SimpleDropdownValue[] = [];
  entityAdditionalMultiSelect: WritableSignal<boolean> = signal(false);

  ngOnInit() {
    this.entityType = this.data.entityType;
    this.initSettings();

    if (this.data.overwriteLocally) {
      this.lockGlobalFields();
    }

    // Auto-generate ID if not yet set
    if (!this.data.entitySchemaField.id) {
      this.autoGenerateId();
    }
    this.initAvailableDatatypes(
      this.allDataTypes as unknown as DefaultDatatype<any, any>[],
    );
  }

  /**
   * Disable editing of those fields that have to be consistent across all uses of the field.
   * @private
   */
  private lockGlobalFields() {
    ["dataType", "additional", "isArray"].forEach((ctrlName) => {
      const control = this.schemaFieldsForm.get(ctrlName);
      if (control?.value) {
        control.disable();
      }
    });
  }

  private initSettings() {
    this.fieldIdForm = this.fb.control(this.data.entitySchemaField.id, {
      validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]*$/)],
      asyncValidators: [
        uniquePropertyValidator({
          getExistingValues: async () =>
            Array.from(this.data.entityType.schema.keys()),
          normalize: false,
          errorKey: "uniqueId",
          errorMessage: $localize`:form field validation error:id already in use`,
        }),
      ],
    });
    this.additionalForm = this.fb.control(
      this.data.entitySchemaField.additional,
    );

    const labelFormControl = this.fb.control(
      this.data.entitySchemaField.label,
      {
        validators: [Validators.required],
        asyncValidators: [
          uniquePropertyValidator({
            getExistingValues: async () => {
              const labels: string[] = [];
              for (const [
                fieldId,
                field,
              ] of this.data.entityType.schema.entries()) {
                if (field.label) {
                  labels.push(field.label);
                }
              }
              return labels;
            },
            excludeValue: this.data.entitySchemaField.id
              ? this.data.entityType.schema.get(this.data.entitySchemaField.id)
                  ?.label
              : undefined,
            normalize: true,
            errorKey: "duplicateLabel",
            errorMessage: $localize`:form field validation error:A field with this label already exists`,
          }),
        ],
      },
    );

    this.schemaFieldsForm = this.fb.group({
      id: this.fieldIdForm,
      label: labelFormControl,
      labelShort: [this.data.entitySchemaField.labelShort],
      displayFullLengthLabel: [
        this.data.entitySchemaField.displayFullLengthLabel ?? false,
      ],
      description: [this.data.entitySchemaField.description],

      dataType: [this.data.entitySchemaField.dataType, Validators.required],
      isArray: [this.data.entitySchemaField.isArray],
      additional: this.additionalForm,

      defaultValue: new FormControl(this.data.entitySchemaField.defaultValue),
      searchable: [this.data.entitySchemaField.searchable],
      anonymize: [this.data.entitySchemaField.anonymize],
      viewComponent: [this.data.entitySchemaField.viewComponent],
      editComponent: [this.data.entitySchemaField.editComponent],
      showInDetailsView: [this.data.entitySchemaField.showInDetailsView],
      generateIndex: [this.data.entitySchemaField.generateIndex],
      validators: [this.data.entitySchemaField.validators],
    });
    this.form = this.fb.group({
      id: this.fieldIdForm,
      schemaFields: this.schemaFieldsForm,
    });

    this.schemaFieldsForm.valueChanges.subscribe((formValues) =>
      this.updateSchemaFieldFromForm(formValues),
    );

    this.schemaFieldsForm
      .get("labelShort")
      .valueChanges.pipe(filter((v) => v === ""))
      .subscribe((v) => {
        // labelShort should never be empty string, in that case it has to be removed so that label works as fallback
        this.schemaFieldsForm.get("labelShort").setValue(null);
      });
    this.updateDataTypeAdditional(this.schemaFieldsForm.get("dataType").value);
    this.schemaFieldsForm.get("dataType").valueChanges.subscribe((v) => {
      this.updateDataTypeAdditional(v);
    });
    this.updateForNewOrExistingField();
  }

  private updateSchemaFieldFromForm(formValues) {
    if (
      JSON.stringify(formValues) === JSON.stringify(this.data.entitySchemaField)
    )
      return;

    for (const key of Object.keys(formValues)) {
      if (formValues[key] !== null) {
        this.data.entitySchemaField[key] = formValues[key];
      } else if (this.data.entitySchemaField.hasOwnProperty(key)) {
        // When field is cleared, delete the property
        delete this.data.entitySchemaField[key];
      }
    }
  }

  private updateForNewOrExistingField() {
    if (!!this.data.entitySchemaField.id) {
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
    newAdditional: string | string[] | undefined = this.data.entitySchemaField
      .additional,
  ) {
    this.resetAdditional();

    if (dataType === ConfigurableEnumDatatype.dataType) {
      this.initAdditionalForEnum(
        typeof newAdditional === "string" ? newAdditional : undefined,
      );
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

  private initAdditionalForEntityRef(newAdditional?: string | string[]) {
    this.typeAdditionalOptions = this.entityRegistry
      .getEntityTypes(true)
      .map((x) => ({ label: x.value.label, value: x.value.ENTITY_TYPE }));

    this.additionalForm.addValidators(Validators.required);
    this.entityAdditionalMultiSelect.set(Array.isArray(newAdditional));

    if (Array.isArray(newAdditional)) {
      const validValues = newAdditional.filter((value) =>
        this.typeAdditionalOptions.some((x) => x.value === value),
      );
      // Use setTimeout to ensure Angular processes the multi input change before setting the value
      setTimeout(() => {
        this.additionalForm.setValue(validValues);
      });
      return;
    }

    if (this.typeAdditionalOptions.some((x) => x.value === newAdditional)) {
      this.additionalForm.setValue(newAdditional);
    }
  }

  private resetAdditional() {
    this.additionalForm.removeValidators(Validators.required);
    this.additionalForm.reset(null);
    this.typeAdditionalOptions = [];
    this.createNewAdditionalOption = undefined;
    this.entityAdditionalMultiSelect.set(false);
  }

  async onEntityAdditionalSelectionModeChange(change: MatSlideToggleChange) {
    if (
      this.schemaFieldsForm.get("dataType")?.value !== EntityDatatype.dataType
    ) {
      change.source.checked = this.entityAdditionalMultiSelect();
      return;
    }

    const isMulti = change.checked;

    if (this.entityAdditionalMultiSelect() === isMulti) {
      return;
    }

    const currentValue = this.additionalForm.value;

    if (isMulti) {
      this.entityAdditionalMultiSelect.set(true);
      this.additionalForm.setValue(currentValue ? [currentValue] : []);
      return;
    }

    // Switching to single-select with 0 or 1 values - no confirmation needed
    if (!Array.isArray(currentValue) || currentValue.length <= 1) {
      this.entityAdditionalMultiSelect.set(false);
      this.additionalForm.setValue(
        Array.isArray(currentValue) ? (currentValue[0] ?? null) : null,
      );
      return;
    }

    // Switching to single-select with multiple values - ask for confirmation
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`:Entity field config switch mode title:Switch to single selection?`,
      $localize`:Entity field config switch mode body:You selected multiple target record types. Switching to single selection will clear this selection. Continue?`,
      YesNoButtons,
    );

    if (confirmed) {
      this.entityAdditionalMultiSelect.set(false);
      this.additionalForm.setValue(null);
    } else {
      // cancelled: reset the toggle and keep checked
      change.source.checked = true;
    }
  }

  async save() {
    this.form.markAllAsTouched();
    // Recalculates the value and validation status of the control, also updates the value and validity of its ancestors.
    this.schemaFieldsForm.updateValueAndValidity();
    if (this.form.invalid) return;
    this.data.entitySchemaField.id = this.fieldIdForm.getRawValue();
    this.dialogRef.close(this.data.entitySchemaField);
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
    this.dialog.open(ConfigureEnumPopupComponent, {
      data: enumEntity,
      disableClose: true,
    });
  }

  resetToBaseFieldSettings() {
    this.dialogRef.close(this.fieldIdForm.getRawValue());
  }
}
