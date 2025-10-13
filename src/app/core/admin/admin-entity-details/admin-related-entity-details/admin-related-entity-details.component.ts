import { Component, inject, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { FormConfig } from "../../../entity-details/form/form.component";
import { MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import { EntityConfigService } from "../../../entity/entity-config.service";

/**
 * Dialog component for editing the entity's field configuration.
 * Loads fields from the entity's attributes in the Config database.
 * Shows configured attributes as "active fields" in the drag-and-drop area,
 * and all other schema fields as "available fields" in the sidebar.
 */
@Component({
  selector: "app-admin-related-entity-details",
  imports: [
    CommonModule,
    AdminEntityFormComponent,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
  ],
  templateUrl: "./admin-related-entity-details.component.html",
  styleUrls: [
    "./admin-related-entity-details.component.scss",
    "../../admin-entity/admin-entity-styles.scss",
  ],
})
export class AdminRelatedEntityDetailsComponent implements OnInit {
  private entityMapper = inject(EntityMapperService);
  private entityConfigService = inject(EntityConfigService);

  @Input() entityConstructor: EntityConstructor;

  formConfig: FormConfig = { fieldGroups: [] };

  async ngOnInit(): Promise<void> {
    await this.loadEntityAttributesConfig();
  }

  /**
   * Load the entity's field configuration from EntityConfig.attributes in the database.
   * This shows which fields are configured for the entity.
   * AdminEntityFormComponent will automatically:
   * - Show configured attributes as "active fields" in the drag-and-drop area
   * - Show other schema fields as "available fields" in the sidebar
   */
  private async loadEntityAttributesConfig(): Promise<void> {
    const config = await this.entityMapper.load(Config, Config.CONFIG_KEY);
    
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + this.entityConstructor.ENTITY_TYPE;
    
    const entityConfig = config.data[entityConfigKey];
    
    // Get the configured attributes (fields) for this entity
    const attributes = entityConfig?.attributes || {};
    
    // Extract field IDs from attributes
    const fieldIds = Object.keys(attributes);
    
    if (fieldIds.length > 0) {
      // Show these fields as active fields in the form
      this.formConfig = {
        fieldGroups: [{ fields: fieldIds }],
      };
    } else {
      // If no attributes configured, start with empty (all fields will be "available")
      this.formConfig = { fieldGroups: [] };
    }
  }
}
