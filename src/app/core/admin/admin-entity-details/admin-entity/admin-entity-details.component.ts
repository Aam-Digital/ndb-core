import { Component, Input, OnInit, ViewChild } from "@angular/core";
import {
  EntityDetailsConfig,
  Panel,
} from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { ConfigService } from "../../../config/config.service";
import { ViewConfig } from "../../../config/dynamic-routing/view-config.interface";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { Location, NgForOf, NgIf } from "@angular/common";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../../config/config";
import { EntityConfigService } from "../../../entity/entity-config.service";
import { EntityConfig } from "../../../entity/entity-config";
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs";
import { EntityActionsService } from "../../../entity/entity-actions/entity-actions.service";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { AdminSectionHeaderComponent } from "../admin-section-header/admin-section-header.component";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { AdminEntityPanelComponentComponent } from "../admin-entity-panel-component/admin-entity-panel-component.component";
import { MatTooltipModule } from "@angular/material/tooltip";

@DynamicComponent("AdminEntityDetails")
@Component({
  selector: "app-admin-entity-details",
  templateUrl: "./admin-entity-details.component.html",
  styleUrls: ["./admin-entity-details.component.scss"],
  standalone: true,
  imports: [
    MatTabsModule,
    FaIconComponent,
    MatButtonModule,
    EntityTypeLabelPipe,
    ViewTitleComponent,
    AdminSectionHeaderComponent,
    AdminEntityFormComponent,
    AdminEntityPanelComponentComponent,
    MatTooltipModule,
    NgForOf,
    NgIf,
  ],
})
export class AdminEntityDetailsComponent implements OnInit {
  @Input() entityType: string;
  entityConstructor: EntityConstructor;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  configDetailsView: EntityDetailsConfig;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  constructor(
    private entities: EntityRegistry,
    private configService: ConfigService,
    private location: Location,
    private entityMapper: EntityMapperService,
    private entityActionsService: EntityActionsService,
  ) {}

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.entityConstructor = this.entities.get(this.entityType);
    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );

    const detailsView: ViewConfig<EntityDetailsConfig> =
      this.configService.getConfig(
        EntityConfigService.getDetailsViewId(this.entityConstructor),
      );
    if (detailsView.component !== "EntityDetails") {
      // not supported currently
      return;
    }

    // work on a deep copy as we are editing in place (for titles, sections, etc.)
    this.configDetailsView = JSON.parse(JSON.stringify(detailsView.config));
  }

  cancel() {
    this.entityConstructor.schema = new Map(this.originalEntitySchemaFields);
    this.location.back();
  }

  async save() {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newConfig = originalConfig.copy();

    this.setViewConfig(newConfig);
    this.setEntityConfig(newConfig);

    await this.entityMapper.save(newConfig);
    this.entityActionsService.showSnackbarConfirmationWithUndo(
      $localize`:Save config confirmation message:Configuration updated`,
      [originalConfig],
    );

    this.location.back();
  }

  private setViewConfig(newConfig: Config) {
    const viewId = EntityConfigService.getDetailsViewId(this.entityConstructor);
    newConfig.data[viewId].config = this.configDetailsView;
  }

  private setEntityConfig(newConfig: Config) {
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + this.entityType;

    // init config if not present
    newConfig.data[entityConfigKey] =
      newConfig.data[entityConfigKey] ?? ({ attributes: {} } as EntityConfig);
    newConfig.data[entityConfigKey].attributes =
      newConfig.data[entityConfigKey].attributes ?? {};

    const entitySchemaConfig: EntityConfig = newConfig.data[entityConfigKey];

    for (const [fieldId, field] of this.entityConstructor.schema.entries()) {
      if (!field._isCustomizedField) {
        // do not write unchanged default fields from the classes into config
        continue;
      }
      entitySchemaConfig.attributes[fieldId] = field;
    }
  }

  createPanel() {
    const newPanel: Panel = { title: "New Tab", components: [] };
    this.configDetailsView.panels.push(newPanel);

    // wait until view has actually added the new tab before we can auto-select it
    setTimeout(() => {
      const newTabIndex = this.configDetailsView.panels.length - 1;
      this.tabGroup.selectedIndex = newTabIndex;
      this.tabGroup.focusTab(newTabIndex);
    });
  }

  addComponent(panel: Panel) {
    panel.components.push({
      title: "New Section",
      component: "Form", // TODO: make this configurable
      config: { fieldGroups: [] },
    });
  }
}
