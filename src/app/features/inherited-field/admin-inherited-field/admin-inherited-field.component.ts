import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { MatTooltip } from "@angular/material/tooltip";
import { EntityRelationsService } from "app/core/entity/entity-mapper/entity-relations.service";
import { lastValueFrom } from "rxjs";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "../../automated-status-update/automated-field-mapping/automated-field-mapping.component";
import { DefaultValueConfigInheritedField } from "../inherited-field-config";

interface InheritanceOption {
  type: "inherit" | "automated";
  label: string;
  tooltip: string;
  sourceReferenceField?: string;
  sourceEntityType?: string;
  referencedEntityType?: EntityConstructor;
  availableFields?: string[];
}

@Component({
  selector: "app-admin-inherited-field",
  imports: [
    MatSelect,
    MatButton,
    ReactiveFormsModule,
    MatTooltip,
    MatOption,
    EntityFieldLabelComponent,
    FormsModule,
  ],
  templateUrl: "./admin-inherited-field.component.html",
  styleUrl: "./admin-inherited-field.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminInheritedFieldComponent,
    },
  ],
})
export class AdminInheritedFieldComponent
  extends CustomFormControlDirective<DefaultValueConfigInheritedField>
  implements OnInit, OnChanges
{
  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;

  private readonly entityRelationsService = inject(EntityRelationsService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly matDialog = inject(MatDialog);

  availableOptions: InheritanceOption[] = [];
  selectedOption: InheritanceOption | null = null;
  currentInheritanceFields: {
    sourceReferenceField: string;
    referencedEntityType: EntityConstructor;
    availableFields: string[];
  } | null = null;

  ngOnInit() {
    if (!this.value) {
      this.value = {
        sourceReferenceField: "",
        sourceValueField: "",
      };
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entityType) {
      this.updateAvailableOptions();
    }
  }

  updateAvailableOptions() {
    if (!this.entityType) return;

    this.availableOptions = [];

    const inheritanceAttributes = this.getInheritanceAttributes();

    inheritanceAttributes.forEach((attr) => {
      const fieldConfig = this.entityType.schema.get(attr);

      if (fieldConfig?.additional) {
        const referencedEntityType = this.entityRegistry.get(
          fieldConfig.additional,
        );

        if (referencedEntityType) {
          const option = {
            type: "inherit" as const,
            label: `${this.getFieldLabel(attr)} > ${this.getEntityLabel(referencedEntityType)}`,
            tooltip: `Inherit value from any "${this.getEntityLabel(referencedEntityType)}" that is linked to in this record's "${this.getFieldLabel(attr)}" field`,
            sourceReferenceField: attr,
            referencedEntityType,
            availableFields: this.getAvailableFields(referencedEntityType),
          };

          this.availableOptions.push(option);
        }
      }
    });

    const automatedOptions = this.getAutomatedOptions();

    automatedOptions.forEach((option) => {
      const automatedOption = {
        type: "automated" as const,
        label: `${option.label} > ${this.getFieldLabel(option.relatedReferenceFields[0])}`,
        tooltip: `Inherit value from any "${option.label}" that links to this record in its "${option.relatedReferenceFields[0]}" field`,
        sourceEntityType: option.entityType,
      };

      this.availableOptions.push(automatedOption);
    });

    this.updateSelectedOption();
  }

  private updateSelectedOption() {
    if (!this.value) {
      this.selectedOption = null;
      return;
    }

    // Find matching option based on current config
    // Automation has BOTH sourceEntityType AND sourceReferenceField
    if (this.value.sourceEntityType && this.value.sourceReferenceField) {
      this.selectedOption =
        this.availableOptions.find(
          (opt) =>
            opt.type === "automated" &&
            opt.sourceEntityType === this.value.sourceEntityType,
        ) || null;
    }
    // Inheritance has sourceReferenceField but NO sourceEntityType
    else if (this.value.sourceReferenceField && !this.value.sourceEntityType) {
      this.selectedOption =
        this.availableOptions.find(
          (opt) =>
            opt.type === "inherit" &&
            opt.sourceReferenceField === this.value.sourceReferenceField,
        ) || null;
    } else {
      this.selectedOption = null;
    }
  }

  onOptionSelected(option: InheritanceOption) {
    this.selectedOption = option;

    if (option.type === "inherit") {
      this.currentInheritanceFields = {
        sourceReferenceField: option.sourceReferenceField!,
        referencedEntityType: option.referencedEntityType!,
        availableFields: option.availableFields!,
      };

      this.value = {
        ...this.value,
        sourceReferenceField: option.sourceReferenceField!,
        sourceEntityType: undefined,
      };
    } else if (option.type === "automated") {
      // Open automated mapping dialog
      this.openAutomatedMappingDialog(option.sourceEntityType!);
    }
  }

  onInheritedFieldSelected(fieldId: string) {
    if (this.selectedOption?.type === "inherit") {
      this.value = {
        ...this.value,
        sourceValueField: fieldId,
      };
    }
  }

  async openAutomatedMappingDialog(selectedEntity: string) {
    const automatedOption = this.availableOptions.find(
      (opt) =>
        opt.type === "automated" && opt.sourceEntityType === selectedEntity,
    );

    if (!automatedOption) return;

    const refEntity = this.entityRegistry.get(selectedEntity);
    const dialogRef = this.matDialog.open(AutomatedFieldMappingComponent, {
      data: {
        currentEntityType: this.entityType,
        relatedEntityType: refEntity,
        currentField: this.entitySchemaField,
        relatedReferenceFields:
          this.getAutomatedOptions().find(
            (opt) => opt.entityType === selectedEntity,
          )?.relatedReferenceFields || [],
      } as AutomatedFieldMappingDialogData,
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (result) {
      this.value = {
        sourceReferenceField: result.sourceReferenceField,
        sourceEntityType: selectedEntity,
        sourceValueField: result.sourceValueField,
        valueMapping: result.valueMapping,
      };

      // Update selected option to show it's configured
      this.selectedOption = automatedOption;
    }
  }

  private getInheritanceAttributes(): string[] {
    if (!this.entityType?.schema) return [];

    const inheritanceAttrs = Array.from(this.entityType.schema.entries())
      .filter(
        ([, fieldConfig]) => fieldConfig.dataType === EntityDatatype.dataType,
      )
      .map(([fieldId]) => fieldId);

    return inheritanceAttrs;
  }

  private getAutomatedOptions(): {
    label: string;
    entityType: string;
    relatedReferenceFields: string[];
  }[] {
    const relatedEntities =
      this.entityRelationsService.getEntityTypesReferencingType(
        this.entityType.ENTITY_TYPE,
      );

    return relatedEntities
      .filter(
        (refType) =>
          !refType.entityType.isInternalEntity && !!refType.entityType.label,
      )
      .map((refType) => ({
        label: refType.entityType.label,
        entityType: refType.entityType.ENTITY_TYPE,
        relatedReferenceFields: refType.referencingProperties.map((p) => p.id),
      }));
  }

  private getAvailableFields(entityType: EntityConstructor): string[] {
    if (!entityType?.schema) return [];

    return Array.from(entityType.schema.entries())
      .filter(([, fieldConfig]) => fieldConfig.label)
      .map(([fieldId]) => fieldId);
  }

  private getFieldLabel(fieldId: string): string {
    if (!fieldId || !this.entityType?.schema) return fieldId;
    const fieldConfig = this.entityType.schema.get(fieldId);
    return fieldConfig?.label || fieldId;
  }

  private getEntityLabel(entityType: EntityConstructor): string {
    return entityType.label || entityType.ENTITY_TYPE;
  }

  getSelectedOptionLabel(): string {
    if (!this.value) return "";

    if (this.value.sourceEntityType) {
      // automated rule
      const entityType = this.entityRegistry.get(this.value.sourceEntityType);
      return `${this.getEntityLabel(entityType)} > ${this.getFieldLabel(this.entitySchemaField?.id)}`;
    } else if (this.value.sourceReferenceField) {
      // inheritance
      const fieldConfig = this.entityType.schema.get(
        this.value.sourceReferenceField,
      );
      if (fieldConfig?.additional) {
        const referencedEntityType = this.entityRegistry.get(
          fieldConfig.additional,
        );
        return `Inherit from ${this.getFieldLabel(this.value.sourceReferenceField)} > ${this.getEntityLabel(referencedEntityType)}`;
      }
    }

    return "";
  }
}
