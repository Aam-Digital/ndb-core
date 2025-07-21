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
  entityType: string[] = [];

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
      this.updateSideConfig("left", key);
    });

    this.configForm.get("rightType").valueChanges.subscribe((key) => {
      this.updateSideConfig("right", key);
    });
  }

  private initConfig(): void {
    this.originalConfig =
      this.configService.getConfig("appConfig:matching-entities") || {};
    const cols = this.originalConfig.columns ?? [];
    const leftColumns = cols.map((col: ColumnConfig[]) => col[0]);
    const rightColumns = cols.map((col: ColumnConfig[]) => col[1]);

    this.sides.left = {
      entityType: this.originalConfig.leftSide?.entityType || null,
      columns: leftColumns || [],
      availableFilters: this.originalConfig.leftSide?.availableFilters || [],
      prefilter: this.originalConfig.leftSide?.prefilter || {},
    };

    this.sides.right = {
      entityType: this.originalConfig.rightSide?.entityType || null,
      columns: rightColumns || [],
      availableFilters: this.originalConfig.rightSide?.availableFilters || [],
      prefilter: this.originalConfig.rightSide?.prefilter || {},
    };

    this.entityType = this.entityRegistry
      .getEntityTypes()
      .map((ctor) => ctor.value.ENTITY_TYPE);
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      leftType: [this.originalConfig.leftSide?.entityType ?? ""],
      rightType: [this.originalConfig.rightSide?.entityType ?? ""],
    });
  }

  private updateSideConfig(side: "left" | "right", entityKey: string): void {
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

  updateLeftSideConfig(config: MatchingSideConfig): void {
    this.sides.left = config;
  }

  updateRightSideConfig(config: MatchingSideConfig): void {
    this.sides.right = config;
  }

  /**
   * Save the updated matching entities configuration.
   */
  save(): void {
    const columns: [ColumnConfig, ColumnConfig][] = [];
    const maxLength = Math.max(
      this.sides.left.columns.length,
      this.sides.right.columns.length,
    );

    for (let i = 0; i < maxLength; i++) {
      const left = this.sides.left.columns[i] ?? "";

      const right = this.sides.right.columns[i] ?? "";

      columns.push([left, right]);
    }

    const fullConfig = this.configService.exportConfig(true);

    fullConfig["appConfig:matching-entities"] = {
      ...this.originalConfig,
      columns,
      leftSide: {
        ...this.originalConfig.leftSide,
        entityType: this.configForm.value.leftType,
        columns: this.sides.left.columns,
        availableFilters: this.sides.left.availableFilters,
        prefilter: this.sides.left.prefilter,
      },
      rightSide: {
        ...this.originalConfig.rightSide,
        entityType: this.configForm.value.rightType,
        columns: this.sides.right.columns,
        availableFilters: this.sides.right.availableFilters,
        prefilter: this.sides.right.prefilter,
      },
      matchingViews: this.originalConfig.onMatch,
    };

    console.log("Saving matching entities config:", fullConfig["appConfig:matching-entities"]);

    this.configService.saveConfig(fullConfig).then(() => {
      this.alertService.addInfo($localize`Configuration updated successfully.`);
    });
  }

  cancel(): void {
    this.location.back();
  }
}
