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
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { ViewConfig } from "../../config/dynamic-routing/view-config.interface";
import { EntityDetailsConfig } from "../../entity-details/EntityDetailsConfig";
import { EntityConfigService } from "../../entity/entity-config.service";
import { Config } from "../../config/config";
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
  ],
  templateUrl: "./admin-entity.component.html",
  styleUrl: "./admin-entity.component.scss",
})
export class AdminEntityComponent implements OnInit {
  @Input() entityType: string;
  entityConstructor: EntityConstructor;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  configDetailsView: EntityDetailsConfig;
  configListView: EntityListConfig;
  configEntitySettings: EntityConfig;
  protected mode: "details" | "list" | "general" = "details";

  @ContentChild(TemplateRef) templateRef: TemplateRef<any>;

  constructor(
    private entities: EntityRegistry,
    private configService: ConfigService,
    private location: Location,
    private entityMapper: EntityMapperService,
    private entityActionsService: EntityActionsService,
    private routes: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.init();
    this.routes.queryParams.subscribe((params) => {
      this.mode = params.mode;
    });
  }

  private init() {
    this.entityConstructor = this.entities.get(this.entityType);
    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );

    this.configDetailsView = this.loadViewConfig(
      EntityConfigService.getDetailsViewId(this.entityConstructor),
    );
    this.configListView = this.loadViewConfig(
      EntityConfigService.getListViewId(this.entityConstructor),
    );
    this.configEntitySettings = this.entityConstructor;
  }

  private loadViewConfig<C = EntityDetailsConfig | EntityListConfig>(
    viewId: string,
  ): C {
    const viewConfig: ViewConfig<C> = this.configService.getConfig(viewId);

    // work on a deep copy as we are editing in place (for titles, sections, etc.)
    return JSON.parse(JSON.stringify(viewConfig.config));
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

    this.setViewConfig(
      newConfig,
      EntityConfigService.getDetailsViewId(this.entityConstructor),
      this.configDetailsView,
      "EntityDetails",
    );
    this.setViewConfig(
      newConfig,
      EntityConfigService.getListViewId(this.entityConstructor),
      this.configListView,
      "EntityList",
    );
    this.setEntityConfig(newConfig);

    await this.entityMapper.save(newConfig);
    this.entityActionsService.showSnackbarConfirmationWithUndo(
      $localize`:Save config confirmation message:Configuration updated`,
      [originalConfig],
    );

    this.location.back();
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
    if (this.configEntitySettings) {
      entitySchemaConfig.label = this.configEntitySettings.label;
      entitySchemaConfig.labelPlural = this.configEntitySettings.labelPlural;
      entitySchemaConfig.icon = this.configEntitySettings.icon;
      entitySchemaConfig.toStringAttributes =
        this.configEntitySettings.toStringAttributes;
      entitySchemaConfig.hasPII = this.configEntitySettings.hasPII;
    }
  }

  private setViewConfig(
    targetConfig,
    detailsViewId: string,
    viewConfig: EntityDetailsConfig | EntityListConfig,
    componentForNewConfig: string,
  ) {
    if (targetConfig.data[detailsViewId]) {
      targetConfig.data[detailsViewId].config = viewConfig;
    } else {
      // create new config
      viewConfig.entityType = this.entityType;
      targetConfig.data[detailsViewId] = {
        component: componentForNewConfig,
        config: viewConfig,
      } as ViewConfig<EntityDetailsConfig | EntityListConfig>;
    }
  }
}
