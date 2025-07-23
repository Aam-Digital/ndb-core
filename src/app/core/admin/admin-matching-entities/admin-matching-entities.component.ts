import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";

import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../config/config.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import {
  MatchingEntitiesConfig,
  MatchingSideConfig,
} from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EditMatchingViewComponent } from "./edit-matching-view/edit-matching-view.component";
import { Location } from "@angular/common";
import { AlertService } from "../../alerts/alert.service";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side/edit-matching-entity-side.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { ViewActionsComponent } from "#src/app/core/common-components/view-actions/view-actions.component";
import { ColumnConfig } from "../../common-components/entity-form/FormConfig";

@Component({
  selector: "app-admin-matching-entities",
  imports: [
    ReactiveFormsModule,
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
  readonly fb = inject(FormBuilder);
  readonly configService = inject(ConfigService);
  readonly entityRegistry = inject(EntityRegistry);
  readonly location = inject(Location);
  readonly alertService = inject(AlertService);

  configForm: FormGroup;
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
    this.initConfig();
    this.initForm();

    this.configForm.get("leftType").valueChanges.subscribe((key) => {
      this.resetSideConfig("left", key);
    });

    this.configForm.get("rightType").valueChanges.subscribe((key) => {
      this.resetSideConfig("right", key);
    });
  }

  private initConfig(): void {
    this.originalConfig =
      this.configService.getConfig("appConfig:matching-entities") || {};
    const columns = this.originalConfig.columns ?? [];
    this.initSide("left", columns, 0);
    this.initSide("right", columns, 1);
  }

  /**
   * Initializes the configuration for a side (left or right) of the matching entities.
   * @param side - Identifier for the side ('left' or 'right').
   * @param columns - Array of column configurations.
   * @param index - Index to select the specific column configuration for the side.
   */
  private initSide(
    side: "left" | "right",
    columns: ColumnConfig[][],
    index: number,
  ): void {
    const sideColumns = columns.map((col) => col[index]);
    const originalSide = this.originalConfig[`${side}Side`];
    this.sides[side] = {
      entityType: originalSide?.entityType || null,
      columns: sideColumns || [],
      availableFilters: originalSide?.availableFilters || [],
      prefilter: originalSide?.prefilter || {},
    };
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      leftType: [this.originalConfig.leftSide?.entityType ?? ""],
      rightType: [this.originalConfig.rightSide?.entityType ?? ""],
    });
  }

  /**
   * Resets configuration for the specified side when its entity type changes.
   * @param side - Identifier for the side ('left' or 'right').
   * @param entityKey - The newly selected entity type key.
   */
  private resetSideConfig(side: "left" | "right", entityKey: string): void {
    this.sides[side] = {
      ...this.sides[side],
      entityType: entityKey,
      columns: [],
      availableFilters: [],
      prefilter: {},
    };

    this.originalConfig[`${side}Side`] = {
      ...this.originalConfig[`${side}Side`],
      prefilter: {},
    };
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
        entityType: this.configForm.value.leftType,
        availableFilters: this.sides.left.availableFilters,
        prefilter: this.sides.left.prefilter,
      },
      rightSide: {
        ...this.originalConfig.rightSide,
        entityType: this.configForm.value.rightType,
        availableFilters: this.sides.right.availableFilters,
        prefilter: this.sides.right.prefilter,
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

  cancel(): void {
    this.location.back();
  }
}
