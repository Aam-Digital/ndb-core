
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';

import { EntityConstructor } from '../core/entity/model/entity';
import { EntitySchemaField } from '../core/entity/schema/entity-schema-field';
import { EntityRegistry } from '../core/entity/database-entity.decorator';
import { EntityRelationsService } from '../core/entity/entity-mapper/entity-relations.service';

export interface InheritanceOption {
  type: 'inherit' | 'automated';
  label: string;
  labelParts: { entityName: string; fieldName: string };
  tooltip: string;
  sourceReferenceField?: string;
  sourceReferenceEntity?: string;
  referencedEntityType?: EntityConstructor;
}

@Component({
  selector: 'app-entity-reference-field-selector',
  imports: [MatSelect, MatOption, MatTooltip,],
  templateUrl: './entity-reference-field-selector.component.html',
  styleUrl: './entity-reference-field-selector.component.scss',
})
export class EntityReferenceFieldSelectorComponent implements OnChanges {
  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;
  @Input() value: any;
  @Output() optionSelected = new EventEmitter<InheritanceOption>();

  private readonly entityRelationsService = inject(EntityRelationsService);
  private readonly entityRegistry = inject(EntityRegistry);

  availableOptions: InheritanceOption[] = [];
  selectedOption: InheritanceOption | null = null;

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
        const referencedEntityType = this.entityRegistry.get(fieldConfig.additional);
        if (referencedEntityType) {
          const refFieldLabel = this.getFieldLabel(attr, this.entityType);
          const option: InheritanceOption = {
            type: 'inherit',
            label: `${refFieldLabel} > ${this.getEntityLabel(referencedEntityType)}`,
            labelParts: {
              entityName: this.getEntityLabel(referencedEntityType),
              fieldName: refFieldLabel,
            },
            tooltip: `Inherit value from any "${this.getEntityLabel(referencedEntityType)}" that is linked to in this record's "${refFieldLabel}" field`,
            sourceReferenceField: attr,
            sourceReferenceEntity: undefined,
            referencedEntityType,
          };
          this.availableOptions.push(option);
        }
      }
    });
    const automatedOptions = this.getAutomatedOptions();
    automatedOptions.forEach((option) => {
      option.relatedReferenceFields.forEach((refField) => {
        const refFieldLabel = this.getFieldLabel(refField, option.entityType);
        const refEntityType = this.entityRegistry.get(option.entityType);
        const automatedOption: InheritanceOption = {
          type: 'automated',
          label: `${option.label} > ${refFieldLabel}`,
          labelParts: {
            entityName: option.label,
            fieldName: refFieldLabel,
          },
          tooltip: `Inherit value from any "${this.getEntityLabel(refEntityType)}" that links to this record in its "${refFieldLabel}" field`,
          sourceReferenceEntity: option.entityType,
          sourceReferenceField: refField,
          referencedEntityType: refEntityType,
        };
        this.availableOptions.push(automatedOption);
      });
    });
  }

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

  onOptionSelected(event: any) {
    const option = event.value;
    this.selectedOption = option;
    this.optionSelected.emit(option);
  }

  private getInheritanceAttributes(): string[] {
    if (!this.entityType?.schema) return [];
    const inheritanceAttrs = Array.from(this.entityType.schema.entries())
      .filter(([, fieldConfig]) => fieldConfig.dataType === 'entity')
      .map(([fieldId]) => fieldId);
    return inheritanceAttrs;
  }

  private getAutomatedOptions(): {
    label: string;
    entityType: string;
    relatedReferenceFields: string[];
  }[] {
    const relatedEntities = this.entityRelationsService.getEntityTypesReferencingType(
      this.entityType.ENTITY_TYPE,
    );
    return relatedEntities
      .filter((refType) => !refType.entityType.isInternalEntity && !!refType.entityType.label)
      .map((refType) => ({
        label: refType.entityType.label,
        entityType: refType.entityType.ENTITY_TYPE,
        relatedReferenceFields: refType.referencingProperties.map((p) => p.id),
      }));
  }

  private getFieldLabel(fieldId: string, entityType: EntityConstructor | string): string {
    if (typeof entityType === 'string') {
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
