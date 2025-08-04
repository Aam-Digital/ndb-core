import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../../core/config/config.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
} from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EditNewMatchActionComponent } from "#src/app/features/matching-entities/admin-matching-entities/edit-new-match-action/edit-new-match-action.component";
import { Location } from "@angular/common";
import { AlertService } from "../../../core/alerts/alert.service";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side/edit-matching-entity-side.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { ViewActionsComponent } from "#src/app/core/common-components/view-actions/view-actions.component";
import { ColumnConfig } from "../../../core/common-components/entity-form/FormConfig";

/**
 * Configure the details of the MatchingEntitiesComponent.
 */
@Component({
  selector: "app-admin-matching-entities",
  imports: [
    MatButtonModule,
    EditNewMatchActionComponent,
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

    this.location.back();
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

  cancel(): void {
    this.location.back();
  }
}
