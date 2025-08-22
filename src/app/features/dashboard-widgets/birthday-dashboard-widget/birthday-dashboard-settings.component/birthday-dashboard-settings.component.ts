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
  ],
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"],
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  @Input() formControl: FormControl<BirthdayDashboardSettingsConfig>;

  availableEntityTypes: EntityConstructor[] = [];
  availableProperties: string[] = [];

  selectedEntityType: string;
  selectedProperty: string;

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

    const entities = this.formControl.value?.entities ?? {
      Child: "dateOfBirth",
    };
    this.selectedEntityType = Object.keys(entities)[0];
    this.selectedProperty = entities[this.selectedEntityType];

    this.updateAvailableProperties();
    this.updateLocalConfig();
  }

  updateAvailableProperties() {
    const ctor = this.availableEntityTypes.find(
      (c) => c.ENTITY_TYPE === this.selectedEntityType,
    );
    if (!ctor) {
      this.availableProperties = [];
      return;
    }
    const schema = getEntitySchema(ctor);

    this.availableProperties = Array.from(schema.entries())
      .filter(([_, field]: any) => field.dataType === "date-with-age")
      .map(([key]) => key);
  }

  onEntityTypeChange(entityType: string) {
    this.selectedEntityType = entityType;
    this.updateAvailableProperties();
    this.selectedProperty = this.availableProperties[0];
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  onPropertyChange(property: string) {
    this.selectedProperty = property;
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  onThresholdChange() {
    this.updateLocalConfig();
    this.emitConfigChange();
  }

  updateLocalConfig() {
    this.localConfig = {
      threshold: this.formControl.value?.threshold ?? 32,
      entities: {
        [this.selectedEntityType]: this.selectedProperty,
      },
    };
  }

  emitConfigChange() {
    this.formControl.setValue({ ...this.localConfig });
  }
}
