import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  AutomatedConfigRule,
  DefaultValueConfig,
  DefaultValueMode,
} from "../../../../entity/schema/default-value-config";
import {
  MatError,
  MatFormField,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms";
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from "@angular/material/button-toggle";
import { MatTooltip } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { MatOption, MatSelect } from "@angular/material/select";
import { asArray } from "app/utils/asArray";
import { EntityFieldLabelComponent } from "../../../../common-components/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../../../entity/model/entity";
import { EntityRegistry } from "../../../../entity/database-entity.decorator";
import { EntityDatatype } from "../../../../basic-datatypes/entity/entity.datatype";
import { filter } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { AutomatedFieldMappingComponent } from "app/features/automated-status-update/automated-field-mapping/automated-field-mapping.component";
import { lastValueFrom } from "rxjs";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";

@Component({
  selector: "app-default-value-options",
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    ReactiveFormsModule,
    FormsModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip,
    FaIconComponent,
    MatSuffix,
    MatIconButton,
    MatSelect,
    MatOption,
    EntityFieldLabelComponent,
    MatButtonModule,
  ],
  templateUrl: "./default-value-options.component.html",
  styleUrl: "./default-value-options.component.scss",
})
export class DefaultValueOptionsComponent implements OnChanges {
  @Input() value: DefaultValueConfig;
  @Output() valueChange = new EventEmitter<DefaultValueConfig>();
  @Input() field?: string;
  @Input() entitySchemaField: EntitySchemaField;

  @Input() entityType: EntityConstructor;

  form: FormGroup;
  mode: DefaultValueMode;

  @ViewChild("inputElement") inputElement: ElementRef;
  @ViewChild("inheritedFieldSelect") inheritedFieldSelectElement: MatSelect;

  currentAutomatedConfig: AutomatedConfigRule;
  availableInheritanceAttributes: string[];
  currentInheritanceFields: {
    localAttribute: string;
    referencedEntityType: EntityConstructor;
    availableFields: string[];
  };
  relatedEntity: { label: string; entity: string; mappedField: string }[];

  constructor(
    private entityRegistry: EntityRegistry,
    private matDialog: MatDialog,
    private entityRelationsService: EntityRelationsService,
  ) {
    this.initForm();
  }

  private initForm() {
    this.form = new FormGroup(
      {
        mode: new FormControl(this.value?.mode),
        value: new FormControl(this.value?.value, {
          validators: [this.requiredForMode(["static", "dynamic"])],
        }),
        localAttribute: new FormControl(this.value?.localAttribute, {
          validators: [this.requiredForMode("inherited")],
        }),
        field: new FormControl(this.value?.field, {
          validators: [this.requiredForMode("inherited")],
        }),
        relatedEntity: new FormControl(
          this.value?.automatedConfigRule?.[0]?.relatedEntity,
        ),
      },
      { updateOn: "blur" },
    );

    this.form
      .get("mode")
      .valueChanges.subscribe((mode) => this.switchMode(mode));

    this.form.get("value").valueChanges.subscribe((value) => {
      if (!this.mode && !!value) {
        // set default mode as "static" after user started typing a value
        this.mode = "static";
        this.form.get("mode").setValue(this.mode, { emitEvent: false });
      }
    });
    this.form
      .get("localAttribute")
      .valueChanges.subscribe((v) => this.updateCurrentInheritanceFields(v));
    this.form.valueChanges
      .pipe(
        filter((v) => {
          this.form
            .get("localAttribute")
            .updateValueAndValidity({ emitEvent: false });
          this.form.get("field").updateValueAndValidity({ emitEvent: false });
          this.form.get("value").updateValueAndValidity({ emitEvent: false });

          return this.form.valid;
        }),
      )
      .subscribe(() => this.emitValue());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      this.currentAutomatedConfig = this.value?.automatedConfigRule[0];

      this.updateForm(this.value);
    }
    if (changes.entityType) {
      this.updateAvailableInheritanceAttributes();
      this.updateAvilableRelatedEntity();
    }
  }

  private updateForm(newValue: DefaultValueConfig) {
    this.form.get("mode").setValue(newValue?.mode);
    this.form.get("value").setValue(newValue?.value);
    this.form.get("localAttribute").setValue(newValue?.localAttribute);
    this.form.get("field").setValue(newValue?.field);
    if (newValue?.automatedConfigRule.length) {
      const automatedRule = newValue?.automatedConfigRule[0];
      this.form.get("relatedEntity").setValue(automatedRule?.relatedEntity);
    }

    this.mode = newValue?.mode;
  }

  private switchMode(mode: DefaultValueMode) {
    this.mode = mode;

    this.form.get("value").setValue(null);
    this.form.get("localAttribute").setValue(null);
    this.form.get("field").setValue(null);
  }

  private emitValue() {
    let newConfigValue: DefaultValueConfig | undefined = undefined;

    switch (this.mode) {
      case "static":
      case "dynamic":
        newConfigValue = {
          mode: this.mode,
          value: this.form.get("value").value,
        };
        break;
      case "inherited":
        newConfigValue = {
          mode: this.mode,
          localAttribute: this.form.get("localAttribute").value,
          field: this.form.get("field").value,
        };
        break;
    }

    if (JSON.stringify(newConfigValue) !== JSON.stringify(this.value)) {
      this.value = newConfigValue;
      this.valueChange.emit(newConfigValue);
    }
  }
  async openAutomatedMappingDialog(selectedEntity: string) {
    const relatedEntity = this.relatedEntity.find(
      (r) => r.entity === selectedEntity,
    );
    const refEntity = this.entityRegistry.get(selectedEntity);
    const dialogRef = this.matDialog.open(AutomatedFieldMappingComponent, {
      maxHeight: "90vh",
      data: {
        currentEntity: this.entityType,
        refEntity: refEntity,
        currentField: this.field,
        currentAutomatedMapping: this.currentAutomatedConfig,
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      const updatedConfig = {
        automatedConfigRule: [
          {
            mappedProperty: relatedEntity.mappedField,
            relatedEntity: selectedEntity,
            relatedField: result.relatedField,
            automatedMapping: result.automatedMapping,
          },
        ],
      };

      this.value = {
        ...updatedConfig,
        mode: this.mode,
      };
      this.valueChange.emit({
        ...updatedConfig,
        mode: this.mode,
      });
    }
  }

  private requiredForMode(
    mode: DefaultValueMode | DefaultValueMode[],
  ): ValidatorFn {
    const modes = asArray(mode);
    return (control) => {
      if (modes.includes(this.form?.get("mode")?.value) && !control.value) {
        return { requiredForMode: true };
      }
      return null;
    };
  }

  private updateAvailableInheritanceAttributes() {
    this.availableInheritanceAttributes = Array.from(
      this.entityType.schema.entries(),
    )
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id]) => id);
  }

  private updateAvilableRelatedEntity() {
    const relatedEntities =
      this.entityRelationsService.getEntityTypesReferencingType(
        this.entityType.ENTITY_TYPE,
      );
    this.relatedEntity = relatedEntities
      .filter((refType) => !!refType.entityType.label)
      .map((refType) => ({
        label: refType.entityType.label,
        entity: refType.entityType.ENTITY_TYPE,
        mappedField: refType.referencingProperties[0].id,
      }));
  }

  private updateCurrentInheritanceFields(localAttribute: string) {
    this.form.get("field").setValue(null);

    if (!localAttribute) {
      this.currentInheritanceFields = undefined;
      return;
    }

    const fieldSchema = this.entityType.schema.get(localAttribute);
    const referencedEntityType: EntityConstructor = !!fieldSchema
      ? this.entityRegistry.get(fieldSchema?.additional)
      : undefined;
    if (!referencedEntityType) {
      return;
    }

    const availableFields = Array.from(referencedEntityType.schema.entries())
      .filter(([_, schema]) => !!schema.label) // only "user-facing" fields (i.e. with label)
      .map(([id]) => id);

    this.currentInheritanceFields = {
      localAttribute,
      referencedEntityType,
      availableFields,
    };

    setTimeout(() => this.inheritedFieldSelectElement.open());
  }

  clearDefaultValue() {
    this.updateForm(undefined);
    setTimeout(() => this.inputElement.nativeElement.blur(), 100);
  }
}
