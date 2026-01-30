import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from "@angular/core";
import { MatSelect } from "@angular/material/select";
import { MatOption } from "@angular/material/core";
import { EntityConstructor } from "../core/entity/model/entity";
import { EntitySchemaField } from "../core/entity/schema/entity-schema-field";
import { EntityRegistry } from "../core/entity/database-entity.decorator";
import { EntityRelationsService } from "../core/entity/entity-mapper/entity-relations.service";
import { EntityTypeLabelPipe } from "../core/common-components/entity-type-label/entity-type-label.pipe";
import { EntityFieldLabelComponent } from "../core/entity/entity-field-label/entity-field-label.component";

export interface InheritanceOption {
  type: "inherit" | "automated";
  label: string;
  labelParts: { entityName: string; fieldName: string };
  tooltip: string;
  sourceReferenceField?: string;
  sourceReferenceEntity?: string;
  referencedEntityType?: EntityConstructor;
}

@Component({
  selector: "app-entity-reference-field-selector",
  imports: [
    MatSelect,
    MatOption,
    EntityTypeLabelPipe,
    EntityFieldLabelComponent,
  ],
  templateUrl: "./entity-reference-field-selector.component.html",
  styleUrl: "./entity-reference-field-selector.component.scss",
})
export class EntityReferenceFieldSelectorComponent implements OnChanges {
  private readonly entityRelationsService = inject(EntityRelationsService);
  private readonly entityRegistry = inject(EntityRegistry);

  @Input() entityType: EntityConstructor;
  @Input() entitySchemaField: EntitySchemaField;
  @Input() value?: Partial<InheritanceOption>;
  @Output() optionSelected = new EventEmitter<InheritanceOption>();

  availableOptions: InheritanceOption[] = [];
  selectedOption: InheritanceOption | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entityType) {
      this.updateAvailableOptions();
      this.initSelectedOption();
    }
  }

  /**
   * Updates the list of available inheritance options by combining direct
   * inheritance from entity reference fields and automated inheritance from
   * related entities that reference the current entity type.
   */
  updateAvailableOptions() {
    if (!this.entityType) return;
    this.availableOptions = [
      ...this.buildInheritanceOptions(),
      ...this.buildAutomatedOptions(),
    ];
  }

  /**
   * Builds options for direct inheritance from entity reference fields.
   * These represent fields on the current entity type that reference other entities,
   * from which values can be inherited.
   * @returns Array of inheritance options for direct field references
   */
  private buildInheritanceOptions(): InheritanceOption[] {
    const inheritanceAttributes = this.getInheritanceAttributes();
    return inheritanceAttributes
      .map((attr) => this.buildInheritanceOption(attr))
      .filter((opt): opt is InheritanceOption => !!opt);
  }

  /**
   * Builds a single inheritance option from an entity reference field.
   * Resolves the referenced entity type and constructs the option with
   * appropriate labels and tooltips.
   * @param attr The attribute/field ID to build the option for
   * @returns An InheritanceOption if the referenced entity exists, null otherwise
   */
  private buildInheritanceOption(attr: string): InheritanceOption | null {
    const fieldConfig = this.entityType.schema.get(attr);
    if (!fieldConfig?.additional) return null;
    const referencedEntityType = this.entityRegistry.get(
      fieldConfig.additional,
    );
    if (!referencedEntityType) return null;
    const refFieldLabel = this.getFieldLabel(attr, this.entityType);
    return {
      type: "inherit",
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
  }

  /**
   * Builds options for automated inheritance from related entities.
   * Finds all entity types that reference the current entity and creates options
   * for inheriting values from those related entities based on their reference fields.
   * @returns Array of automated inheritance options
   */
  private buildAutomatedOptions(): InheritanceOption[] {
    const automatedOptions = this.getAutomatedOptions();
    return automatedOptions
      .flatMap((option) =>
        option.relatedReferenceFields.map((refField) =>
          this.buildAutomatedOption(option, refField),
        ),
      )
      .filter((opt): opt is InheritanceOption => !!opt);
  }

  /**
   * Builds a single automated inheritance option from a related entity and its reference field.
   * Used to allow inheriting values from entities that reference the current entity type.
   * @param option The related entity option containing label and entityType
   * @param refField The reference field ID on the related entity
   * @returns An InheritanceOption if the related entity exists, null otherwise
   */
  private buildAutomatedOption(
    option: {
      label: string;
      entityType: string;
      relatedReferenceFields: string[];
    },
    refField: string,
  ): InheritanceOption | null {
    const refFieldLabel = this.getFieldLabel(refField, option.entityType);
    const refEntityType = this.entityRegistry.get(option.entityType);
    if (!refEntityType) return null;
    return {
      type: "automated",
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
  }

  /**
   * Initializes the selected option by matching the current value against available options.
   * Matches based on sourceReferenceField and sourceReferenceEntity properties.
   * Sets selectedOption to null if no match is found or value is not provided.
   */
  private initSelectedOption(): void {
    if (!this.value) {
      this.selectedOption = null;
      return;
    }
    this.selectedOption =
      this.availableOptions.find(
        (o) =>
          o.sourceReferenceField === this.value.sourceReferenceField &&
          o.sourceReferenceEntity === this.value.sourceReferenceEntity,
      ) || null;
  }

  onOptionSelected(event: { value: InheritanceOption }) {
    const option = event.value;
    this.selectedOption = option;
    this.optionSelected.emit(option);
  }

  /**
   * Retrieves all entity reference field IDs from the current entity's schema.
   * Filters for fields with dataType "entity" that can be used for inheritance.
   * @returns Array of field IDs that reference other entities
   */
  private getInheritanceAttributes(): string[] {
    if (!this.entityType?.schema) return [];
    const inheritanceAttrs = Array.from(this.entityType.schema.entries())
      .filter(([, fieldConfig]) => fieldConfig.dataType === "entity")
      .map(([fieldId]) => fieldId);
    return inheritanceAttrs;
  }

  /**
   * Retrieves all entity types that reference the current entity type.
   * Filters out internal entities and entities without labels, then maps
   * them to automated option objects with their reference fields.
   * @returns Array of related entity options with their reference field mappings
   */
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
