import { Component, Input, OnInit, inject } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FormControl, FormsModule } from "@angular/forms";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { getEntitySchema } from "#src/app/core/entity/database-field.decorator";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";

export interface BirthdayDashboardSettingsConfig {
  /**
   * How many days in advance an upcoming birthday/anniversary should be displayed.
   */
  threshold?: number;

  /**
   * Map of entity type(s) and the "date-with-age" field within the type
   * that should be scanned for upcoming anniversaries.
   * e.g. `{ "Child": "dateOfBirth", "School": "foundingDate" }`
   */
  entities?: { [entityType: string]: string };
}

interface EntityPropertyPair {
  entityType: string;
  property: string;
}

@Component({
  selector: "app-birthday-dashboard-settings",
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    EntityTypeSelectComponent,
    EntityFieldSelectComponent,
    MatButtonModule,
    FontAwesomeModule,
  ],
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"],
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<BirthdayDashboardSettingsConfig>;

  availableEntityTypes: EntityConstructor[] = [];
  availablePropertiesMap: { [entityType: string]: string[] } = {};

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

    // Build availablePropertiesMap for each entity type
    for (const ctor of this.availableEntityTypes) {
      const schema = getEntitySchema(ctor);
      this.availablePropertiesMap[ctor.ENTITY_TYPE] = Array.from(
        schema.entries(),
      )
        .filter(([_, field]: any) => field.dataType === "date-with-age")
        .map(([key]) => key);
    }

    // Initialize pairs from config or default
    const entities = this.formControl.value?.entities ?? {
      Child: "dateOfBirth",
    };
    this.entityPropertyPairs = Object.entries(entities).map(
      ([entityType, property]) => ({
        entityType,
        property,
      }),
    );
    if (this.entityPropertyPairs.length === 0) {
      // Always show at least one pair
      this.entityPropertyPairs.push({
        entityType: this.availableEntityTypes[0]?.ENTITY_TYPE ?? "",
        property:
          this.availablePropertiesMap[
            this.availableEntityTypes[0]?.ENTITY_TYPE
          ]?.[0] ?? "",
      });
    }

    this.localConfig.threshold = this.formControl.value?.threshold ?? 32;
    this.updateLocalConfig();
  }

  availablePropertiesFor(entityType: string): string[] {
    return this.availablePropertiesMap[entityType] ?? [];
  }

  onEntityTypeChange(entityType: string, index: number) {
    this.entityPropertyPairs[index].entityType = entityType;
    const props = this.availablePropertiesFor(entityType);
    this.entityPropertyPairs[index].property = props[0] ?? "";
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  onPropertyChange(property: string, index: number) {
    this.entityPropertyPairs[index].property = property;
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  onThresholdChange() {
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  addPair() {
    // Add new pair with first available entity type and property
    const entityType = this.availableEntityTypes[0]?.ENTITY_TYPE ?? "";
    const property = this.availablePropertiesFor(entityType)[0] ?? "";
    this.entityPropertyPairs.push({ entityType, property });
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  removePair(index: number) {
    this.entityPropertyPairs.splice(index, 1);
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  updateLocalConfig() {
    const entities: { [entityType: string]: string } = {};
    for (const pair of this.entityPropertyPairs) {
      if (pair.entityType && pair.property) {
        entities[pair.entityType] = pair.property;
      }
    }
    this.localConfig = {
      threshold: this.localConfig.threshold,
      entities,
    };
  }

  hideNonBirthdayFields(option: FormFieldConfig): boolean {
    return option.dataType !== "date-with-age";
  }

  emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
