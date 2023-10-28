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

  constructor(
    private entities: EntityRegistry,
    private configService: ConfigService,
  ) {}

  ngOnChanges(): void {
    this.init();
  }

  private init() {
    this.entityConstructor = this.entities.get(this.entityType);

    const detailsView: ViewConfig<EntityDetailsConfig> =
      this.configService.getConfig(
        PREFIX_VIEW_CONFIG +
          this.entityConstructor.route.replace(/^\//, "") +
          "/:id",
      );
    if (detailsView.component !== "EntityDetails") {
      // not supported currently
      return;
    }
    this.configDetailsView = detailsView.config;

    console.log(
      "configDetailsView",
      PREFIX_VIEW_CONFIG + this.entityConstructor.route + "/:id",
      this.configDetailsView,
    );
  }
}
