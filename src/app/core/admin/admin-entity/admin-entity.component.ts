import {
  Component,
  ContentChild,
  Input,
  OnInit,
  TemplateRef,
} from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntityDetailsConfig } from "../../entity-details/EntityDetailsConfig";
import { EntityConfigService } from "../../entity/entity-config.service";
import { EntityConfig } from "../../entity/entity-config";
import { EntityConstructor } from "../../entity/model/entity";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { EntityListConfig } from "../../entity-list/EntityListConfig";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { MatButton, MatIconButton } from "@angular/material/button";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { AdminEntityListComponent } from "../admin-entity-list/admin-entity-list.component";
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from "@angular/material/sidenav";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatListItem, MatNavList } from "@angular/material/list";
import { AdminEntityDetailsComponent } from "../admin-entity-details/admin-entity-details/admin-entity-details.component";
import { AdminEntityGeneralSettingsComponent } from "./admin-entity-general-settings/admin-entity-general-settings.component";
import { BetaFeatureComponent } from "../../../features/coming-soon/beta-feature/beta-feature.component";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { AdminEntityService } from "../admin-entity.service";

@Component({
  selector: "app-admin-entity",
  standalone: true,
  imports: [
    CommonModule,
    EntityTypeLabelPipe,
    MatButton,
    ViewTitleComponent,
    AdminEntityListComponent,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    FaIconComponent,
    MatIconButton,
    RouterLink,
    MatNavList,
    MatListItem,
    AdminEntityDetailsComponent,
    AdminEntityGeneralSettingsComponent,
    BetaFeatureComponent,
  ],
  templateUrl: "./admin-entity.component.html",
  styleUrl: "./admin-entity.component.scss",
})
export class AdminEntityComponent implements OnInit {
  @Input() entityType: string;
  entityConstructor: EntityConstructor;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  configDetailsView: DynamicComponentConfig<EntityDetailsConfig>;
  configListView: DynamicComponentConfig<EntityListConfig>;
  configEntitySettings: EntityConfig;
  protected mode: "details" | "list" | "general" = "details";

  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;

  constructor(
    private entities: EntityRegistry,
    private configService: ConfigService,
    private location: Location,
    private adminEntityService: AdminEntityService,
    private entityActionsService: EntityActionsService,
    private routes: ActivatedRoute,
  ) {}

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

    this.configEntitySettings = this.entityConstructor;
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
    // work on a deep copy as we are editing in place (for titles, sections, etc.)
    return JSON.parse(JSON.stringify(viewConfig));
  }

  cancel() {
    this.entityConstructor.schema = new Map(this.originalEntitySchemaFields);
    this.location.back();
  }

  async save() {
    const result = await this.adminEntityService.setAndSaveEntityConfig(
      this.entityConstructor,
      this.configEntitySettings,
      this.configListView,
      this.configDetailsView,
    );

    this.entityActionsService.showSnackbarConfirmationWithUndo(
      $localize`:Save config confirmation message:Configuration updated`,
      [result.previous],
    );

    this.location.back();
  }
}
