import { Component, Input, OnChanges } from "@angular/core";
import { EntityDetailsConfig } from "../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../../config/dynamic-routing/view-config.interface";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { Location } from "@angular/common";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Config } from "../../config/config";
import {
  EntityConfig,
  EntityConfigService,
} from "../../entity/entity-config.service";
import { EntitySchemaField_withId } from "../config-entity-form/config-entity-form.component";

@DynamicComponent("ConfigEntity")
@Component({
  selector: "app-config-entity",
  templateUrl: "./config-entity.component.html",
  styleUrls: ["./config-entity.component.scss"],
})
export class ConfigEntityComponent implements OnChanges {
  @Input() entityType: string;
  entityConstructor: EntityConstructor;

  configDetailsView: EntityDetailsConfig;
  schemaFieldChanges: EntitySchemaField_withId[] = [];

  get DETAILS_VIEW_ID() {
    return (
      PREFIX_VIEW_CONFIG +
      this.entityConstructor.route.replace(/^\//, "") +
      "/:id"
    );
  }

  constructor(
    private entities: EntityRegistry,
    private configService: ConfigService,
    private location: Location,
    private entityMapper: EntityMapperService,
  ) {}

  ngOnChanges(): void {
    this.init();
  }

  private init() {
    this.entityConstructor = this.entities.get(this.entityType);

    const detailsView: ViewConfig<EntityDetailsConfig> =
      this.configService.getConfig(this.DETAILS_VIEW_ID);
    if (detailsView.component !== "EntityDetails") {
      // not supported currently
      return;
    }
    this.configDetailsView = detailsView.config;
  }

  cancel() {
    // TODO: reload entity schema from config, because it has been edited in place
    this.location.back();
  }

  async save() {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newConfig = originalConfig.copy();

    // TODO: this is not working yet - need two-way binding into config-entity-form component
    newConfig.data[this.DETAILS_VIEW_ID].config = this.configDetailsView;

    const entityAttr = (
      newConfig.data[
        EntityConfigService.PREFIX_ENTITY_CONFIG + this.entityType
      ] as EntityConfig
    ).attributes;
    console.log("pre", JSON.stringify(entityAttr));
    for (const newField of this.schemaFieldChanges) {
      entityAttr.push({ name: newField.id, schema: newField });
      // TODO: more rigorously filter attributes that are equal to default class definition, so they can still be updated through code updates?
    }
    console.log("post", JSON.stringify(entityAttr));

    await this.entityMapper.save(newConfig);
    // TODO: snackbar + undo action (this should maybe become a default somewhere in a central service, used a lot)
  }
}
