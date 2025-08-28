import { Component, inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { DialogCloseComponent } from "../../../../core/common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";

export interface BirthdayDashboardSettingsData {
  entities: EntityPropertyMap;
  threshold: number;
}

export interface EntityPropertyMap {
  [key: string]: string;
}

interface EntityPropertyPair {
  entityType: string;
  property: string;
}

@Component({
  selector: "app-birthday-dashboard-settings",
  templateUrl: "./birthday-dashboard-settings.component.html",
  styleUrls: ["./birthday-dashboard-settings.component.scss"],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    DialogCloseComponent,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class BirthdayDashboardSettingsComponent implements OnInit {
  private data = inject<BirthdayDashboardSettingsData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private entityRegistry = inject(EntityRegistry);
  private schemaService = inject(EntitySchemaService);

  threshold: FormControl;
  entityProperties: FormArray;
  outputData: FormGroup;

  availableEntityTypes: string[] = [];
  availableProperties: { [entityType: string]: string[] } = {};

  ngOnInit(): void {
    this.initializeAvailableEntityTypes();
    this.initializeAvailableProperties();

    this.threshold = new FormControl(this.data.threshold || 32, [
      Validators.required,
      Validators.min(1),
    ]);

    // Convert entities object to array of entity-property pairs
    const entityPropertyPairs: EntityPropertyPair[] = Object.entries(
      this.data.entities || { Child: "dateOfBirth" },
    ).map(([entityType, property]) => ({
      entityType,
      property,
    }));

    this.entityProperties = this.fb.array(
      entityPropertyPairs.map((pair) => this.createEntityPropertyForm(pair)),
    );

    this.outputData = new FormGroup({
      threshold: this.threshold,
      entityProperties: this.entityProperties,
    });
  }

  private initializeAvailableEntityTypes(): void {
    this.availableEntityTypes = Array.from(this.entityRegistry.keys()).filter(
      (entityType) => {
        // Filter out internal entities
        const constructor = this.entityRegistry.get(entityType);
        return !constructor.isInternalEntity;
      },
    );
  }

  private initializeAvailableProperties(): void {
    this.availableEntityTypes.forEach((entityType) => {
      const constructor = this.entityRegistry.get(entityType);
      const schema = constructor.schema;

      // Find properties that have date datatype
      const dateProperties: string[] = [];
      schema.forEach((fieldConfig, fieldName) => {
        if (
          fieldConfig.dataType === "date" ||
          fieldConfig.dataType === "date-with-age"
        ) {
          dateProperties.push(fieldName);
        }
      });

      this.availableProperties[entityType] = dateProperties;
    });
  }

  createEntityPropertyForm(pair: EntityPropertyPair): FormGroup {
    return this.fb.group({
      entityType: this.fb.control(pair.entityType, [Validators.required]),
      property: this.fb.control(pair.property, [Validators.required]),
    });
  }

  addEntityProperty(): void {
    const newPair: EntityPropertyPair = {
      entityType: this.availableEntityTypes[0] || "",
      property: "",
    };
    this.entityProperties.push(this.createEntityPropertyForm(newPair));
  }

  removeEntityProperty(index: number): void {
    this.entityProperties.removeAt(index);
  }

  getPropertiesForEntity(entityType: string): string[] {
    return this.availableProperties[entityType] || [];
  }

  onEntityTypeChange(index: number, entityType: string): void {
    const control = this.entityProperties.at(index) as FormGroup;
    const propertyControl = control.get("property");

    // Reset property selection when entity type changes
    propertyControl?.setValue("");
  }

  getOutputData(): BirthdayDashboardSettingsData {
    const formValue = this.outputData.value;

    // Convert array back to object format
    const entities: EntityPropertyMap = {};
    formValue.entityProperties.forEach((pair: EntityPropertyPair) => {
      entities[pair.entityType] = pair.property;
    });

    return {
      entities,
      threshold: formValue.threshold,
    };
  }
}
