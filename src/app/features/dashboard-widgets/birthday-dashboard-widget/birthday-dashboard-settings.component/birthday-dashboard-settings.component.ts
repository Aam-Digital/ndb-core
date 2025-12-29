import { Component, Input, OnInit, inject } from "@angular/core";
import { FormControl, FormsModule } from "@angular/forms";

import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { getEntitySchema } from "#src/app/core/entity/database-field.decorator";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

export interface BirthdayDashboardSettingsConfig {
  /**
   * How many days in advance an upcoming birthday/anniversary should be displayed.
   */
  threshold?: number;

  /**
   * Map of entity type(s) and the "date-with-age" field(s) within the type
   * that should be scanned for upcoming anniversaries.
   * Can be a string for single field or array for multiple fields.
   * e.g. `{ "Child": "dateOfBirth", "School": ["foundingDate", "establishedDate"] }`
   */
  entities?: { [entityType: string]: string | string[] };
}

interface EntityPropertyPair {
  entityType: string;
  property: string;
}

@Component({
  selector: "app-birthday-dashboard-settings",
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    EntityTypeSelectComponent,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"],
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<BirthdayDashboardSettingsConfig>;

  availableEntityTypes: EntityConstructor[] = [];
  /** Map of entity types to their available date-with-age fields */
  dateFieldsByEntityType: { [entityType: string]: string[] } = {};
  /** Available entity type options for each row, filtered to prevent duplicates */
  entityTypeOptionsPerRow: EntityConstructor[][] = [];

  entityPropertyPairs: EntityPropertyPair[] = [];

  localConfig: BirthdayDashboardSettingsConfig = {
    threshold: 32,
    entities: { Child: "dateOfBirth" },
  };

  private entityRegistry = inject(EntityRegistry);

  ngOnInit() {
    // Get all entity types and filter for those with a date-with-age field
    const allEntityTypes = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);

    this.availableEntityTypes = allEntityTypes.filter(
      (ctor: EntityConstructor) => {
        const schema = getEntitySchema(ctor);
        return Array.from(schema.values()).some(
          (field: any) => field.dataType === "date-with-age",
        );
      },
    );

    this.buildAvailablePropertiesMap();

    // Initialize pairs from config or create a single default pair
    const entities = this.formControl.value?.entities;

    if (entities && Object.keys(entities).length > 0) {
      // Use existing valid entities, filtering out invalid ones
      this.entityPropertyPairs = [];

      Object.entries(entities).forEach(([entityType, properties]) => {
        const isValidEntityType = this.availableEntityTypes.some(
          (ctor) => ctor.ENTITY_TYPE === entityType,
        );

        if (!isValidEntityType) return;

        // Handle both string and array properties
        const propertyList = Array.isArray(properties)
          ? properties
          : [properties];

        propertyList.forEach((property) => {
          const isValidProperty =
            this.dateFieldsByEntityType[entityType]?.includes(property);
          if (isValidProperty) {
            this.entityPropertyPairs.push({
              entityType,
              property,
            });
          }
        });
      });
    } else {
      this.entityPropertyPairs = [];
    }

    // If no valid pairs exist, create one default pair
    if (this.entityPropertyPairs.length === 0) {
      const defaultEntityType = this.availableEntityTypes[0]?.ENTITY_TYPE;
      const defaultProperty = defaultEntityType
        ? this.dateFieldsByEntityType[defaultEntityType]?.[0]
        : "";

      if (defaultEntityType && defaultProperty) {
        this.entityPropertyPairs = [
          {
            entityType: defaultEntityType,
            property: defaultProperty,
          },
        ];
      }
      // If no valid entity types available, leave array empty
      // The form validation will handle this case
    }

    this.localConfig.threshold = this.formControl.value?.threshold ?? 32;
    this.updateLocalConfig();
    this.updateEntityTypeOptionsPerRow();
  }

  private buildAvailablePropertiesMap() {
    for (const ctor of this.availableEntityTypes) {
      const schema = getEntitySchema(ctor);
      this.dateFieldsByEntityType[ctor.ENTITY_TYPE] = Array.from(
        schema.entries(),
      )
        .filter(([_, field]: any) => field.dataType === "date-with-age")
        .map(([key]) => key);
    }
  }

  availablePropertiesFor(entityType: string): string[] {
    return this.dateFieldsByEntityType[entityType] ?? [];
  }

  private getUsedCombinations(excludeIndex?: number): Set<string> {
    return new Set(
      this.entityPropertyPairs
        .filter((_, i) => i !== excludeIndex)
        .map((p) => `${p.entityType}:${p.property}`),
    );
  }

  updateEntityTypeOptionsPerRow() {
    this.entityTypeOptionsPerRow = this.entityPropertyPairs.map(
      (pair, index) => {
        const usedCombinations = this.getUsedCombinations(index);

        return this.availableEntityTypes.filter((ctor) => {
          const entityType = ctor.ENTITY_TYPE;
          const availableFields = this.availablePropertiesFor(entityType);

          return availableFields.some(
            (field) =>
              !usedCombinations.has(`${entityType}:${field}`) ||
              (entityType === pair.entityType && field === pair.property),
          );
        });
      },
    );
  }

  get canAddMorePairs(): boolean {
    const usedCombinations = this.getUsedCombinations();

    return this.availableEntityTypes.some((ctor) => {
      const entityType = ctor.ENTITY_TYPE;
      const availableFields = this.availablePropertiesFor(entityType);
      return availableFields.some(
        (field) => !usedCombinations.has(`${entityType}:${field}`),
      );
    });
  }

  get isFormValid(): boolean {
    return this.entityPropertyPairs.every(
      (pair) => pair.entityType && pair.property,
    );
  }

  onEntityTypeChange(entityType: string, index: number) {
    this.entityPropertyPairs[index].entityType = entityType;

    // Auto-select first available property that's not already used
    const usedCombinations = this.getUsedCombinations(index);
    const availableProperties = this.availablePropertiesFor(entityType);
    const unusedProperty = availableProperties.find(
      (prop) => !usedCombinations.has(`${entityType}:${prop}`),
    );

    this.entityPropertyPairs[index].property = unusedProperty ?? "";
    this.updateEntityTypeOptionsPerRow();
    this.updateAndEmitConfig();
  }

  onPropertyChange(property: string, index: number) {
    this.entityPropertyPairs[index].property = property;
    this.updateAndEmitConfig();
  }

  onThresholdChange() {
    this.updateAndEmitConfig();
  }

  addPair() {
    const usedCombinations = this.getUsedCombinations();

    for (const ctor of this.availableEntityTypes) {
      const entityType = ctor.ENTITY_TYPE;
      const availableFields = this.availablePropertiesFor(entityType);
      const unusedField = availableFields.find(
        (field) => !usedCombinations.has(`${entityType}:${field}`),
      );

      if (unusedField) {
        this.entityPropertyPairs.push({ entityType, property: unusedField });
        this.updateEntityTypeOptionsPerRow();
        this.updateAndEmitConfig();
        return;
      }
    }
  }

  removePair(index: number) {
    this.entityPropertyPairs.splice(index, 1);
    this.updateEntityTypeOptionsPerRow();
    this.updateAndEmitConfig();
  }

  private updateAndEmitConfig() {
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  updateLocalConfig() {
    const entities: { [entityType: string]: string | string[] } = {};

    for (const pair of this.entityPropertyPairs) {
      if (pair.entityType && pair.property) {
        const entityType = pair.entityType;
        const property = pair.property;

        if (entities[entityType]) {
          // If entity already exists, convert to array or add to existing array
          if (Array.isArray(entities[entityType])) {
            (entities[entityType] as string[]).push(property);
          } else {
            entities[entityType] = [entities[entityType] as string, property];
          }
        } else {
          entities[entityType] = property;
        }
      }
    }

    this.localConfig = {
      threshold: this.localConfig.threshold,
      entities,
    };
  }

  hideNonBirthdayFieldsForRow(currentIndex: number) {
    return (option: FormFieldConfig): boolean => {
      if (option.dataType !== "date-with-age") {
        return true;
      }

      const currentEntityType =
        this.entityPropertyPairs[currentIndex]?.entityType;
      if (currentEntityType && option.id) {
        const usedCombinations = this.getUsedCombinations(currentIndex);
        return usedCombinations.has(`${currentEntityType}:${option.id}`);
      }

      return false;
    };
  }

  emitConfigChange() {
    // Set form control validity based on whether all pairs are complete
    if (this.isFormValid) {
      this.formControl.setValue({ ...this.localConfig });
      this.formControl.setErrors(null);
    } else {
      this.formControl.setErrors({ invalidPairs: true });
    }
  }
}
