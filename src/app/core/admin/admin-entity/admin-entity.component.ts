import { Location } from "@angular/common";
import {
  Component,
  ContentChild,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatListItem, MatNavList } from "@angular/material/list";
import { ActivatedRoute } from "@angular/router";
import { AdminNoteDetailsComponent } from "../../../child-dev-project/notes/admin-note-details/admin-note-details.component";
import { BetaFeatureComponent } from "../../../features/coming-soon/beta-feature/beta-feature.component";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ConfigService } from "../../config/config.service";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { EntityListConfig } from "../../entity-list/EntityListConfig";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityConfig } from "../../entity/entity-config";
import { EntityConfigService } from "../../entity/entity-config.service";
import { EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { AdminEntityDetailsComponent } from "../admin-entity-details/admin-entity-details/admin-entity-details.component";
import { AdminEntityListComponent } from "../admin-entity-list/admin-entity-list.component";
import { AdminEntityPublicFormsComponent } from "../admin-entity-public-forms/admin-entity-public-forms-component";
import { AdminEntityService } from "../admin-entity.service";
import { AdminEntityGeneralSettingsComponent } from "./admin-entity-general-settings/admin-entity-general-settings.component";

@Component({
  selector: "app-admin-entity",
  imports: [
    EntityTypeLabelPipe,
    MatButton,
    ViewTitleComponent,
    AdminEntityListComponent,
    MatNavList,
    MatListItem,
    AdminEntityDetailsComponent,
    AdminEntityGeneralSettingsComponent,
    BetaFeatureComponent,
    AdminEntityPublicFormsComponent,
    AdminNoteDetailsComponent,
  ],
  templateUrl: "./admin-entity.component.html",
  styleUrl: "./admin-entity.component.scss",
})
export class AdminEntityComponent implements OnInit {
  private entities = inject(EntityRegistry);
  private configService = inject(ConfigService);
  private location = inject(Location);
  private adminEntityService = inject(AdminEntityService);
  private entityActionsService = inject(EntityActionsService);
  private routes = inject(ActivatedRoute);

  @Input() entityType: string;
  entityConstructor: EntityConstructor;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  /**
   * Track related entity types that have been modified through the panel config dialog.
   * These will need to be saved when the main Save button is clicked.
   */
  private readonly modifiedRelatedEntities = new Set<EntityConstructor>();

  configDetailsView: DynamicComponentConfig<any>; // typed any to avoid type issues with different detail components
  configListView: DynamicComponentConfig<EntityListConfig>;
  configEntitySettings: EntityConfig;

  protected mode: "details" | "list" | "general" | "publicForm" = "details";

  @ViewChild(AdminEntityGeneralSettingsComponent)
  generalSettingsComponent?: AdminEntityGeneralSettingsComponent;

  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;

  ngOnInit(): void {
    this.init();
    this.routes.queryParams.subscribe((params) => {
      this.mode = params.mode ?? this.mode;
    });
  }

  private init() {
    this.entityConstructor = this.entities.get(this.entityType);
    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );

    this.configDetailsView = this.loadViewConfig(
      this.entityConstructor,
      "details",
    );
    this.configListView = this.loadViewConfig(this.entityConstructor, "list");

    this.configEntitySettings = this.getEntitySettingsFromConstructor(
      this.entityConstructor,
    );
  }

  private getEntitySettingsFromConstructor(
    entityCtr: EntityConstructor,
  ): EntityConfig {
    const config: EntityConfig = {
      label: entityCtr.label,
      labelPlural: entityCtr.labelPlural,
      icon: entityCtr.icon,
      color: entityCtr.color,
      toStringAttributes: [...entityCtr.toStringAttributes],
      hasPII: entityCtr.hasPII,
      enableUserAccounts: entityCtr.enableUserAccounts,
    };

    // Only include toBlockDetailsAttributes if it has meaningful values
    if (
      entityCtr.toBlockDetailsAttributes &&
      (entityCtr.toBlockDetailsAttributes.title ||
        entityCtr.toBlockDetailsAttributes.image ||
        (entityCtr.toBlockDetailsAttributes.fields &&
          entityCtr.toBlockDetailsAttributes.fields.length > 0))
    ) {
      config.toBlockDetailsAttributes = entityCtr.toBlockDetailsAttributes;
    }

    return config;
  }

  private loadViewConfig(
    entityType: EntityConstructor,
    viewType: "details" | "list",
  ): DynamicComponentConfig {
    const viewId =
      viewType === "details"
        ? EntityConfigService.getDetailsViewId(entityType)
        : EntityConfigService.getListViewId(entityType);
    const viewConfig: DynamicComponentConfig =
      this.configService.getConfig(viewId);

    if (!viewConfig) {
      // return default view config
      if (viewType === "details") {
        return {
          component: "EntityDetails",
          config: { entityType: this.entityType, panels: [] },
        };
      } else {
        return {
          component: "EntityList",
          config: { entityType: this.entityType },
        };
      }
    }

    viewConfig.config = viewConfig.config ?? { entityType: this.entityType };

    // cleanup note details config, which should not have an entity instance assigned
    if (viewConfig.config.entity && viewConfig.component === "NoteDetails") {
      delete viewConfig.config.entity;
    }
    // work on a deep copy as we are editing in place (for titles, sections, etc.)
    return JSON.parse(JSON.stringify(viewConfig));
  }

  cancel() {
    this.entityConstructor.schema = new Map(this.originalEntitySchemaFields);
    this.location.back();
  }

  async save() {
    if (
      this.generalSettingsComponent &&
      !this.generalSettingsComponent.isFormValid()
    ) {
      return;
    }

    // Save the main entity configuration along with all related entities in a single transaction
    const result = await this.adminEntityService.setAndSaveEntityConfig(
      this.entityConstructor,
      this.configEntitySettings,
      this.configListView,
      this.configDetailsView,
      Array.from(this.modifiedRelatedEntities),
    );

    this.entityActionsService.showSnackbarConfirmationWithUndo(
      $localize`:Save config confirmation message:Configuration updated`,
      [result.previous],
    );

    this.location.back();
  }

  /**
   * Register a related entity as modified, so its schema will be saved when the main Save button is clicked.
   * This is called from child components (e.g., panel components) when they modify related entity schemas.
   */
  registerRelatedEntityForSave(entityConstructor: EntityConstructor): void {
    this.modifiedRelatedEntities.add(entityConstructor);
  }
}
