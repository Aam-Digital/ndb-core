import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-birthday-dashboard-settings",
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
export class BirthdayDashboardSettingsComponent {
  formControl = input.required<FormControl<BirthdayDashboardSettingsConfig>>();

  private entityRegistry = inject(EntityRegistry);

  availableEntityTypes: EntityConstructor[] = this.entityRegistry
    .getEntityTypes(true)
    .map(({ value }) => value)
    .filter((ctor: EntityConstructor) => {
      const schema = getEntitySchema(ctor);
      return Array.from(schema.values()).some(
        (field: any) => field.dataType === "date-with-age",
      );
    });

  /** Map of entity types to their available date-with-age fields */
  dateFieldsByEntityType: { [entityType: string]: string[] } =
    Object.fromEntries(
      this.availableEntityTypes.map((ctor) => [
        ctor.ENTITY_TYPE,
        Array.from(getEntitySchema(ctor).entries())
          .filter(([_, field]: any) => field.dataType === "date-with-age")
          .map(([key]) => key),
      ]),
    );

  threshold = linkedSignal(() => this.formControl().value?.threshold ?? 32);

  entityPropertyPairs = linkedSignal<EntityPropertyPair[]>(() => {
    const entities = this.formControl().value?.entities;
    const pairs: EntityPropertyPair[] = [];

    if (entities) {
      for (const [entityType, properties] of Object.entries(entities)) {
        if (
          !this.availableEntityTypes.some(
            (ctor) => ctor.ENTITY_TYPE === entityType,
          )
        )
          continue;
        const propertyList = Array.isArray(properties)
          ? properties
          : [properties];
        for (const property of propertyList) {
          if (this.dateFieldsByEntityType[entityType]?.includes(property)) {
            pairs.push({ entityType, property });
          }
        }
      }
    }

    if (pairs.length === 0) {
      const defaultEntityType = this.availableEntityTypes[0]?.ENTITY_TYPE;
      const defaultProperty = defaultEntityType
        ? this.dateFieldsByEntityType[defaultEntityType]?.[0]
        : undefined;
      if (defaultEntityType && defaultProperty) {
        return [{ entityType: defaultEntityType, property: defaultProperty }];
      }
    }

    return pairs;
  });

  /** Available entity type options for each row, filtered to prevent duplicates */
  entityTypeOptionsPerRow = computed(() =>
    this.entityPropertyPairs().map((pair, index) => {
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
    }),
  );

  canAddMorePairs = computed(() => {
    const usedCombinations = this.getUsedCombinations();
    return this.availableEntityTypes.some((ctor) => {
      const entityType = ctor.ENTITY_TYPE;
      const availableFields = this.availablePropertiesFor(entityType);
      return availableFields.some(
        (field) => !usedCombinations.has(`${entityType}:${field}`),
      );
    });
  });

  isFormValid = computed(() =>
    this.entityPropertyPairs().every(
      (pair) => pair.entityType && pair.property,
    ),
  );

  constructor() {
    // Sync signal state to the form control whenever any value changes
    effect(() => {
      if (this.isFormValid()) {
        this.formControl().setValue({
          threshold: this.threshold(),
          entities: this.pairsToEntitiesMap(this.entityPropertyPairs()),
        });
        this.formControl().setErrors(null);
      } else {
        this.formControl().setErrors({ invalidPairs: true });
      }
    });
  }

  private pairsToEntitiesMap(pairs: EntityPropertyPair[]): {
    [entityType: string]: string | string[];
  } {
    const entities: { [entityType: string]: string | string[] } = {};
    for (const { entityType, property } of pairs) {
      if (!entityType || !property) continue;
      if (Array.isArray(entities[entityType])) {
        (entities[entityType] as string[]).push(property);
      } else if (entities[entityType]) {
        entities[entityType] = [entities[entityType] as string, property];
      } else {
        entities[entityType] = property;
      }
    }
    return entities;
  }

  private availablePropertiesFor(entityType: string): string[] {
    return this.dateFieldsByEntityType[entityType] ?? [];
  }

  private getUsedCombinations(excludeIndex?: number): Set<string> {
    return new Set(
      this.entityPropertyPairs()
        .filter((_, i) => i !== excludeIndex)
        .map((p) => `${p.entityType}:${p.property}`),
    );
  }

  onEntityTypeChange(entityType: string, index: number) {
    const usedCombinations = this.getUsedCombinations(index);
    const property =
      this.availablePropertiesFor(entityType).find(
        (prop) => !usedCombinations.has(`${entityType}:${prop}`),
      ) ?? "";
    this.entityPropertyPairs.update((prev) =>
      prev.map((pair, i) => (i === index ? { entityType, property } : pair)),
    );
  }

  onPropertyChange(property: string, index: number) {
    this.entityPropertyPairs.update((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, property } : pair)),
    );
  }

  addPair() {
    const usedCombinations = this.getUsedCombinations();
    for (const ctor of this.availableEntityTypes) {
      const entityType = ctor.ENTITY_TYPE;
      const unusedField = this.availablePropertiesFor(entityType).find(
        (field) => !usedCombinations.has(`${entityType}:${field}`),
      );
      if (unusedField) {
        this.entityPropertyPairs.update((prev) => [
          ...prev,
          { entityType, property: unusedField },
        ]);
        return;
      }
    }
  }

  removePair(index: number) {
    this.entityPropertyPairs.update((prev) =>
      prev.filter((_, i) => i !== index),
    );
  }

  /** Per-row filter function for entity-field-select, hiding already-used combinations */
  hideOptionsPerRow = computed(() =>
    this.entityPropertyPairs().map((_, index) => {
      const usedCombinations = this.getUsedCombinations(index);
      const currentEntityType = this.entityPropertyPairs()[index]?.entityType;
      return (option: FormFieldConfig): boolean => {
        if (option.dataType !== "date-with-age") return true;
        if (currentEntityType && option.id) {
          return usedCombinations.has(`${currentEntityType}:${option.id}`);
        }
        return false;
      };
    }),
  );
}
