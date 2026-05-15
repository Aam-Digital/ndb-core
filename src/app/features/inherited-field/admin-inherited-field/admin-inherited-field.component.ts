import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
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
import { asArray } from "#src/app/utils/asArray";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AdminInheritedFieldComponent extends CustomFormControlDirective<DefaultValueConfigInheritedField> {
  entityType = input<EntityConstructor>();
  entitySchemaField = input<EntitySchemaField>();

  private readonly entityRelationsService = inject(EntityRelationsService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly matDialog = inject(MatDialog);

  availableOptions = computed<InheritanceOption[]>(() => {
    const entityType = this.entityType();
    if (!entityType) return [];

    const options: InheritanceOption[] = [];

    this.getInheritanceAttributes(entityType).forEach((attr) => {
      const fieldConfig = entityType.schema.get(attr);
      if (fieldConfig?.additional) {
        for (const typeId of asArray(fieldConfig.additional)) {
          const referencedEntityType = this.entityRegistry.get(typeId);
          if (!referencedEntityType) continue;
          const refFieldLabel = this.getFieldLabel(attr, entityType);
          options.push({
            type: "inherit",
            label: `${refFieldLabel} > ${this.getEntityLabel(referencedEntityType)}`,
            labelParts: {
              entityName: this.getEntityLabel(referencedEntityType),
              fieldName: refFieldLabel,
            },
            tooltip: $localize`Inherit value from any "${this.getEntityLabel(referencedEntityType)}" that is linked to in this record's "${refFieldLabel}" field`,
            sourceReferenceField: attr,
            sourceReferenceEntity: undefined,
            referencedEntityType,
          });
        }
      }
    });

    this.getAutomatedOptions().forEach((option) => {
      option.relatedReferenceFields.forEach((refField) => {
        const refFieldLabel = this.getFieldLabel(refField, option.entityType);
        const refEntityType = this.entityRegistry.get(option.entityType);
        options.push({
          type: "automated",
          label: `${option.label} > ${refFieldLabel}`,
          labelParts: {
            entityName: option.label,
            fieldName: refFieldLabel,
          },
          tooltip: $localize`Inherit value from any "${this.getEntityLabel(refEntityType)}" that links to this record in its "${refFieldLabel}" field`,
          sourceReferenceEntity: option.entityType,
          sourceReferenceField: refField,
          referencedEntityType: refEntityType,
        });
      });
    });

    return options;
  });

  selectedOption = linkedSignal<InheritanceOption | null>(
    () =>
      this.availableOptions().find(
        (o) =>
          o.sourceReferenceField === this.value?.sourceReferenceField &&
          o.sourceReferenceEntity === this.value?.sourceReferenceEntity,
      ) ?? null,
  );

  constructor() {
    super();
    effect(() => {
      this.entityType();
      if (!this.value) {
        this.value = {
          sourceReferenceField: "",
          sourceValueField: "",
        };
      }
    });
  }

  onOptionSelected(option: InheritanceOption) {
    const previousOption = this.selectedOption();
    this.selectedOption.set(option);

    this.openConfigDetailsDialog(option).then((confirmed) => {
      if (!confirmed) {
        // revert selection
        this.selectedOption.set(previousOption);
      }
    });
  }

  async openConfigDetailsDialog(
    option: InheritanceOption = this.selectedOption(),
  ): Promise<boolean> {
    if (!option?.sourceReferenceField) return false;

    const dialogRef = this.matDialog.open<
      AutomatedFieldMappingComponent,
      AutomatedFieldMappingDialogData,
      DefaultValueConfigInheritedField
    >(AutomatedFieldMappingComponent, {
      data: {
        currentEntityType: this.entityType(),
        currentField: this.entitySchemaField(),
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

  private getInheritanceAttributes(entityType: EntityConstructor): string[] {
    if (!entityType?.schema) return [];

    const inheritanceAttrs = Array.from(entityType.schema.entries())
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
    const entityType = this.entityType();
    if (!entityType) {
      return [];
    }
    const relatedEntities =
      this.entityRelationsService.getEntityTypesReferencingType(
        entityType.ENTITY_TYPE,
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
