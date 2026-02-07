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
import { EntityConstructor } from "../../../core/entity/model/entity";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import {
  AutomatedFieldMappingComponent,
  AutomatedFieldMappingDialogData,
} from "#src/app/features/inherited-field/automated-field-update/automated-field-mapping/automated-field-mapping.component";
import { DefaultValueConfigInheritedField } from "../inherited-field-config";

interface InheritanceOption {
  type: "inherit" | "automated";
  label: string;
  labelParts: { entityName: string; fieldName: string };
  tooltip: string;
  sourceReferenceField?: string;
  sourceReferenceEntity?: string;
  referencedEntityType?: EntityConstructor;
}

@Component({
  selector: "app-admin-inherited-field",
  imports: [
    MatSelect,
    MatButton,
    ReactiveFormsModule,
    MatTooltip,
    MatOption,
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
      this.initSelectedOption();
    }
  }

  updateAvailableOptions() {
    if (!this.entityType) return;

    this.availableOptions = [];

    const inheritanceAttributes = this.getInheritanceAttributes();
    inheritanceAttributes.forEach((attr) => {
      const fieldConfig = this.entityType.schema.get(attr);

      if (fieldConfig?.additional) {
        const referencedTypeIds = Array.isArray(fieldConfig.additional)
          ? [...new Set(fieldConfig.additional)]
          : [fieldConfig.additional];

        referencedTypeIds.forEach((typeId) => {
          const referencedEntityType = this.entityRegistry.get(typeId);
          if (!referencedEntityType) {
            return;
          }

          const refFieldLabel = this.getFieldLabel(attr, this.entityType);

          const option: InheritanceOption = {
            type: "inherit" as const,
            label: `${refFieldLabel} > ${this.getEntityLabel(referencedEntityType)}`,
            labelParts: {
              entityName: this.getEntityLabel(referencedEntityType),
              fieldName: refFieldLabel,
            },
            tooltip: $localize`Inherit value from any "${this.getEntityLabel(referencedEntityType)}" that is linked to in this record's "${refFieldLabel}" field`,
            sourceReferenceField: attr,
            sourceReferenceEntity: undefined,
            referencedEntityType,
          };

          this.availableOptions.push(option);
        });
      }
    });

    const automatedOptions = this.getAutomatedOptions();
    automatedOptions.forEach((option) => {
      option.relatedReferenceFields.forEach((refField) => {
        const refFieldLabel = this.getFieldLabel(refField, option.entityType);
        const refEntityType = this.entityRegistry.get(option.entityType);

        const automatedOption: InheritanceOption = {
          type: "automated" as const,
          label: `${option.label} > ${refFieldLabel}`,
          labelParts: {
            entityName: option.label,
            fieldName: refFieldLabel,
          },
          tooltip: $localize`Inherit value from any "${this.getEntityLabel(refEntityType)}" that links to this record in its "${refFieldLabel}" field`,
          sourceReferenceEntity: option.entityType,
          sourceReferenceField: refField,
          referencedEntityType: refEntityType,
        };

        this.availableOptions.push(automatedOption);
      });
    });
  }

  /**
   * Update the selectedOption to the matching object from availableOptions based on the `value`
   */
  private initSelectedOption(): void {
    if (!this.value) {
      this.selectedOption = null;
      return;
    }

    this.selectedOption = this.availableOptions.find(
      (o) =>
        o.sourceReferenceField === this.value.sourceReferenceField &&
        o.sourceReferenceEntity === this.value.sourceReferenceEntity,
    );
  }

  onOptionSelected(option: InheritanceOption) {
    const previousOption = this.selectedOption;
    this.selectedOption = option;

    this.openConfigDetailsDialog().then((confirmed) => {
      if (!confirmed) {
        // revert selection
        this.selectedOption = previousOption;
      }
    });
  }

  async openConfigDetailsDialog(
    option: InheritanceOption = this.selectedOption,
  ): Promise<boolean> {
    if (!option?.sourceReferenceField) return false;

    const dialogRef = this.matDialog.open<
      AutomatedFieldMappingComponent,
      AutomatedFieldMappingDialogData,
      DefaultValueConfigInheritedField
    >(AutomatedFieldMappingComponent, {
      data: {
        currentEntityType: this.entityType,
        currentField: this.entitySchemaField,
        sourceValueEntityType: option.referencedEntityType,
        value: {
          ...this.value,
          sourceReferenceField: option.sourceReferenceField,
          sourceReferenceEntity: option.sourceReferenceEntity,
        },
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (result?.sourceValueField) {
      // successfully confirmed the dialog
      this.value = result;
      return true;
    } else {
      // dialog was cancelled
      return false;
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
      ) ?? [];

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

  private getFieldLabel(
    fieldId: string,
    entityType: EntityConstructor | string,
  ): string {
    if (typeof entityType === "string") {
      entityType = this.entityRegistry.get(entityType);
    }

    if (!fieldId || !entityType?.schema) return fieldId;
    const fieldConfig = entityType.schema.get(fieldId);
    return fieldConfig?.label || fieldId;
  }

  private getEntityLabel(entityType: EntityConstructor): string {
    return entityType.label || entityType.ENTITY_TYPE;
  }
}
