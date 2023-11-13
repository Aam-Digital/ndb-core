import {
  Component,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
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
  Validators,
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
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { uniqueIdValidator } from "../../common-components/entity-form/unique-id-validator";

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
export class ConfigFieldComponent implements OnChanges {
  @Input() entitySchemaField: EntitySchemaField & { id?: string }; // TODO: add id / key to EntitySchemaField for easier handling?
  @Input() entitySchema: EntitySchema;

  form: FormGroup;
  formId: FormControl;
  formAdditional: FormControl;
  typeAdditionalOptions: SimpleDropdownValue[];
  dataTypes: SimpleDropdownValue[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    data: {
      entitySchemaField: EntitySchemaField;
      entitySchema: EntitySchema;
    },
    private dialogRef: MatDialogRef<any>,
    private fb: FormBuilder,
    @Inject(DefaultDatatype) allDataTypes: DefaultDatatype[],
    private configurableEnumService: ConfigurableEnumService,
    private entityRegistry: EntityRegistry,
  ) {
    this.entitySchemaField = data.entitySchemaField;
    this.entitySchema = data.entitySchema;

    this.initSettings();
    this.initAvailableDatatypes(allDataTypes);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entitySchemaField) {
      this.initSettings();
    }
  }

  private initSettings() {
    this.formId = this.fb.control(this.entitySchemaField.id, [
      Validators.required,
      uniqueIdValidator(Array.from(this.entitySchema.keys())),
    ]);
    this.formAdditional = this.fb.control(this.entitySchemaField.additional);

    this.form = this.fb.group({
      label: [this.entitySchemaField.label, Validators.required],
      labelShort: [this.entitySchemaField.labelShort],
      description: [this.entitySchemaField.description],

      id: this.formId,
      dataType: [this.entitySchemaField.dataType, Validators.required],
      additional: this.formAdditional,

      // TODO: remove "innerDataType" completely - the UI can only support very specific multi-valued types anyway
      // TODO add a datatype "alias" for enum-array
      innerDataType: [this.entitySchemaField.innerDataType],

      defaultValue: [this.entitySchemaField.defaultValue],
      searchable: [this.entitySchemaField.searchable],
      anonymize: [this.entitySchemaField.anonymize],
      //viewComponent: [],
      //editComponent: [],
      //showInDetailsView: [],
      //generateIndex: [],
      validators: [this.entitySchemaField.validators],
    });

    this.updateDataTypeAdditional(this.form.get("dataType").value);
    this.form
      .get("dataType")
      .valueChanges.subscribe((v) => this.updateDataTypeAdditional(v));
    this.updateForNewOrExistingField();
  }

  private updateForNewOrExistingField() {
    if (!!this.entitySchemaField.id) {
      // existing fields' id is readonly
      this.formId.disable();
    } else {
      const autoGenerateSubscr = this.form
        .get("label")
        .valueChanges.subscribe((v) => this.autoGenerateId(v));
      // stop updating id when user manually edits
      this.formId.valueChanges.subscribe(() =>
        autoGenerateSubscr.unsubscribe(),
      );
    }
  }
  private autoGenerateId(updatedLabel: string) {
    const generatedId = generateSimplifiedId(updatedLabel);
    this.formId.setValue(generatedId, { emitEvent: false });
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

  private updateDataTypeAdditional(dataType: string) {
    this.resetAdditional();

    if (dataType === ConfigurableEnumDatatype.dataType) {
      this.initAdditionalForEnum();
    } else if (
      dataType === EntityDatatype.dataType ||
      dataType === EntityArrayDatatype.dataType
    ) {
      this.initAdditionalForEntityRef();
    }

    // hasInnerType: [ArrayDatatype.dataType].includes(d.dataType),

    // TODO: this mapping of having an "additional" schema should probably become part of Datatype classes
  }

  private initAdditionalForEnum() {
    this.typeAdditionalOptions = this.configurableEnumService
      .listEnums()
      .map((x) => ({
        label: Entity.extractEntityIdFromId(x),
        value: Entity.extractEntityIdFromId(x),
      }));
    this.formAdditional.addValidators(Validators.required);

    this.createNewAdditionalOption = (text) => {
      const newOption = {
        value: text,
        label: $localize`[new options set]: "${text}"`,
        isNew: true,
      };

      setTimeout(() => {
        // only offer one newly created configurable-enum id
        this.typeAdditionalOptions = [
          newOption,
          ...this.typeAdditionalOptions,
        ].filter(
          (o: SimpleDropdownValue & { isNew: boolean }) =>
            !o.isNew || o === newOption,
        );
        this.formAdditional.setValue(newOption.value);
      });

      return newOption;
    };
    if (this.form.get("label").value) {
      this.createNewAdditionalOption(this.form.get("label").value);
    }
    this.form
      .get("label")
      .valueChanges.subscribe((v) => this.createNewAdditionalOption(v));

    // TODO preview the options within the selected enum (and allow to edit the enum options?)
  }

  private initAdditionalForEntityRef() {
    this.typeAdditionalOptions = this.entityRegistry
      .getEntityTypes(true)
      .map((x) => ({ label: x.value.label, value: x.value.ENTITY_TYPE }));
    this.formAdditional.addValidators(Validators.required);
  }

  private resetAdditional() {
    this.formAdditional.removeValidators(Validators.required);
    this.formAdditional.setValue(undefined);
    this.typeAdditionalOptions = undefined;
    this.createNewAdditionalOption = undefined;
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const updatedEntitySchema = Object.assign(
      {},
      this.entitySchemaField,
      this.form.getRawValue(),
    );

    this.dialogRef.close(updatedEntitySchema);
  }
}

type SimpleDropdownValue = { label: string; value: string };

export function generateSimplifiedId(label: string) {
  return label
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/\s/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_*/, "")
    .replace(/_*$/, "");
}
