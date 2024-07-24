import { Component, OnInit } from "@angular/core";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from "@angular/material/table";
import { MatButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { EntityConstructor } from "../../entity/model/entity";
import { RouterLink } from "@angular/router";
import { generateIdFromLabel } from "../../../utils/generate-id-from-label/generate-id-from-label";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityConfig } from "../../entity/entity-config";
import { EntityDetailsConfig } from "../../entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../../entity-list/EntityListConfig";
import { Config } from "../../config/config";
import { EntityConfigService } from "../../entity/entity-config.service";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";

/**
 * Manage the configuration of all entity types.
 * Currently, this only serves as a utility for internal use, speeding up setup processes.
 *
 * TODO: This component is only a raw prototype! Needs further concept and implementation.
 */
@Component({
  selector: "app-admin-entity-types",
  standalone: true,
  imports: [
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatCell,
    MatHeaderCell,
    MatColumnDef,
    MatTable,
    MatButton,
    MatCellDef,
    MatHeaderCellDef,
    FaIconComponent,
    NgIf,
    RouterLink,
  ],
  templateUrl: "./admin-entity-types.component.html",
  styleUrl: "./admin-entity-types.component.scss",
})
export class AdminEntityTypesComponent implements OnInit {
  entityTypes: EntityConstructor[] = [];
  columnsToDisplay: string[] = ["label", "icon"];

  constructor(
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService,
  ) {}

  ngOnInit() {
    this.loadEntityTypes();
  }

  protected loadEntityTypes(onlyUserFacing = true) {
    this.entityTypes = this.entities
      .getEntityTypes(onlyUserFacing)
      .map((e) => e.value);
  }

  async create() {
    const name = prompt("Please enter entity type name:");
    if (!name) {
      return;
    }
    const id = generateIdFromLabel(name);
    if (this.entityTypeExists(id)) {
      alert("Entity type already exists.");
      return;
    }

    // save default entity schema
    await this.saveDefaultEntityConfig(
      id,
      this.getDefaultEntityConfig(id, name),
      this.getDefaultDetailsViewConfig(id),
      this.getDefaultListViewConfig(id),
    );
  }

  private entityTypeExists(id: string) {
    return Array.from(this.entities.keys()).some(
      (key) => key.toLowerCase() === id.toLowerCase(),
    );
  }

  private async saveDefaultEntityConfig(
    id: string,
    entityConfig: EntityConfig,
    detailsViewConfig: DynamicComponentConfig,
    listViewConfig: DynamicComponentConfig,
  ) {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newConfig = originalConfig.copy();

    newConfig.data[EntityConfigService.PREFIX_ENTITY_CONFIG + id] =
      entityConfig;
    newConfig.data[EntityConfigService.getDetailsViewId(entityConfig)] =
      detailsViewConfig;
    newConfig.data[EntityConfigService.getListViewId(entityConfig)] =
      listViewConfig;

    await this.entityMapper.save(newConfig);
  }

  private getDefaultEntityConfig(
    entityTypeId: string,
    name: string,
  ): EntityConfig {
    return {
      label: name,
      route: entityTypeId,
    };
  }

  private getDefaultDetailsViewConfig(
    entityType: string,
  ): DynamicComponentConfig<EntityDetailsConfig> {
    return {
      component: "EntityDetails",
      config: {
        entityType: entityType,
        panels: [
          {
            title: "Basic Information",
            components: [
              {
                title: "",
                component: "Form",
                config: {
                  fieldGroups: [{ fields: [] }],
                },
              },
            ],
          },
        ],
      },
    };
  }

  private getDefaultListViewConfig(
    entityType: string,
  ): DynamicComponentConfig<EntityListConfig> {
    return {
      component: "EntityList",
      config: {
        entityType: entityType,
        columnGroups: {
          default: "Overview",
          mobile: "Overview",
          groups: [
            {
              name: "Overview",
              columns: [],
            },
          ],
        },
      },
    };
  }
}
