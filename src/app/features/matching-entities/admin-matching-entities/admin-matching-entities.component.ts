import { Component, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../../core/config/config.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
} from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EditMatchingViewComponent } from "./edit-matching-view/edit-matching-view.component";
import { Location } from "@angular/common";
import { AlertService } from "../../../core/alerts/alert.service";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side/edit-matching-entity-side.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { ViewActionsComponent } from "#src/app/core/common-components/view-actions/view-actions.component";
import { ColumnConfig } from "../../../core/common-components/entity-form/FormConfig";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Configure the details of the MatchingEntitiesComponent.
 */
@Component({
  selector: "app-admin-matching-entities",
  imports: [
    MatButtonModule,
    EditMatchingViewComponent,
    EditMatchingEntitySideComponent,
    ViewTitleComponent,
    ViewActionsComponent,
  ],
  templateUrl: "./admin-matching-entities.component.html",
  styleUrls: ["./admin-matching-entities.component.scss"],
})
export class AdminMatchingEntitiesComponent implements OnInit {
  readonly configService = inject(ConfigService);
  readonly entityRegistry = inject(EntityRegistry);
  readonly location = inject(Location);
  readonly alertService = inject(AlertService);

  originalConfig: MatchingEntitiesConfig;

  /**
   * Holds matching configuration for both sides of the matching entities.
   */
  sides: Record<"left" | "right", MatchingSideConfig> = {
    left: {
      entityType: null,
      columns: [],
      availableFilters: [],
      prefilter: {},
    },
    right: {
      entityType: null,
      columns: [],
      availableFilters: [],
      prefilter: {},
    },
  };

  ngOnInit(): void {
    this.originalConfig =
      this.configService.getConfig("appConfig:matching-entities") || {};
  }

  /**
   * Applies updates to the left side configuration from the child component.
   * @param config - Updated MatchingSideConfig for the left side.
   */
  updateLeftSideConfig(config: MatchingSideConfig): void {
    this.sides.left = config;
  }

  /**
   * Applies updates to the right side configuration from the child component.
   * @param config - Updated MatchingSideConfig for the right side.
   */
  updateRightSideConfig(config: MatchingSideConfig): void {
    this.sides.right = config;
  }

  /**
   * Save the updated matching entities configuration.
   */
  save(): void {
    const columns = this.generateColumnsFromSides();
    const fullConfig = this.configService.exportConfig(true);

    fullConfig["appConfig:matching-entities"] = {
      ...this.originalConfig,
      columns,
      leftSide: {
        ...this.originalConfig.leftSide,
        ...this.sides.left,
      },
      rightSide: {
        ...this.originalConfig.rightSide,
        ...this.sides.right,
      },
      matchingViews: this.originalConfig.onMatch,
    };

    this.configService.saveConfig(fullConfig).then(() => {
      this.alertService.addInfo($localize`Configuration updated successfully.`);
    });
  }

  /**
   * Generate the columns array for saving by pairing left and right side columns.
   */
  private generateColumnsFromSides(): [ColumnConfig, ColumnConfig][] {
    const columns: [ColumnConfig, ColumnConfig][] = [];
    const maxLength = Math.max(
      this.sides.left.columns.length,
      this.sides.right.columns.length,
    );
    for (let i = 0; i < maxLength; i++) {
      const left = this.sides.left.columns[i] ?? undefined;
      const right = this.sides.right.columns[i] ?? undefined;
      columns.push([left, right]);
    }
    return columns;
  }

  getEntityConstructor(
    entityType: string | EntityConstructor,
  ): EntityConstructor {
    if (typeof entityType === "string") {
      return this.entityRegistry.get(entityType);
    }
    return entityType;
  }

  cancel(): void {
    this.location.back();
  }
}
