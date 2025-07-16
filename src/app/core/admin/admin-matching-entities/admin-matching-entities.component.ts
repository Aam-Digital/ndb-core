import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";

import { MatButtonModule } from "@angular/material/button";
import { EntityConstructor } from "../../entity/model/entity";
import { ConfigService } from "../../config/config.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { MatchingEntitiesConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EditMatchingViewComponent } from "./edit-matching-view/edit-matching-view.component";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../json-editor/json-editor-dialog/json-editor-dialog.component";
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
  readonly dialog = inject(MatDialog);
  readonly location = inject(Location);
  readonly alertService = inject(AlertService);

  configForm: FormGroup;
  originalConfig: MatchingEntitiesConfig;
  entityType: string[] = [];

  leftSideEntity: EntityConstructor;
  rightSideEntity: EntityConstructor;

  leftColumns: ColumnConfig[] = [];
  rightColumns: ColumnConfig[] = [];

  leftFilters: string[] = [];
  rightFilters: string[] = [];

  ngOnInit(): void {
    this.initConfig();
    this.initForm();
    this.configForm.get("leftType").valueChanges.subscribe((key) => {
      this.leftSideEntity = this.entityRegistry.get(key) ?? null;
      this.leftColumns = [];
      this.leftFilters = [];
      this.originalConfig.leftSide = {
        ...this.originalConfig.leftSide,
        prefilter: {},
      };
    });

    this.configForm.get("rightType").valueChanges.subscribe((key) => {
      this.rightSideEntity = this.entityRegistry.get(key) ?? null;
      this.rightColumns = [];
      this.rightFilters = [];
      this.originalConfig.rightSide = {
        ...this.originalConfig.rightSide,
        prefilter: {},
      };
    });
  }

  private initConfig(): void {
    this.originalConfig =
      this.configService.getConfig("appConfig:matching-entities") || {};
    const cols = this.originalConfig.columns ?? [];
    this.leftColumns = cols.map((col: any[]) =>
      typeof col[0] === "string" ? col[0] : col[0],
    );
    this.rightColumns = cols.map((col: any[]) =>
      typeof col[1] === "string" ? col[1] : col[1],
    );

    this.leftFilters = (
      this.originalConfig.leftSide?.availableFilters ?? []
    ).map((f) => f.id);
    this.rightFilters = (
      this.originalConfig.rightSide?.availableFilters ?? []
    ).map((f) => f.id);

    this.entityType = this.entityRegistry
      .getEntityTypes()
      .map((ctor) => ctor.value.ENTITY_TYPE);
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      leftType: [this.originalConfig.leftSide?.entityType ?? ""],
      rightType: [this.originalConfig.rightSide?.entityType ?? ""],
    });

    const { leftType, rightType } = this.configForm.value;

    this.leftSideEntity = this.entityRegistry.get(leftType) ?? null;
    this.rightSideEntity = this.entityRegistry.get(rightType) ?? null;
  }

  /**
   * Open the conditions JSON editor popup.
   */
  openPrefilterEditor(side: "left" | "right"): void {
    const conditionsForm = this.fb.group({
      prefilter: [
        side === "left"
          ? (this.originalConfig.leftSide?.prefilter ?? {})
          : (this.originalConfig.rightSide?.prefilter ?? {}),
      ],
    });

    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: {
        value: conditionsForm.value.prefilter,
        closeButton: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if (side === "left") {
        this.originalConfig.leftSide = {
          ...this.originalConfig.leftSide,
          prefilter: result,
        };
      } else {
        this.originalConfig.rightSide = {
          ...this.originalConfig.rightSide,
          prefilter: result,
        };
      }
    });
  }

  /**
   * Save the updated matching entities configuration.
   */
  save(): void {
    const leftType = this.configForm.value.leftType;
    const rightType = this.configForm.value.rightType;

    const columns: [ColumnConfig, ColumnConfig][] = [];

    const maxLength = Math.max(
      this.leftColumns.length,
      this.rightColumns.length,
    );
    for (let i = 0; i < maxLength; i++) {
      const left = this.leftColumns[i] ?? "";
      const right = this.rightColumns[i] ?? "";
      columns.push([left, right]);
    }

    const fullConfig = this.configService.exportConfig(true);

    fullConfig["appConfig:matching-entities"] = {
      ...this.originalConfig,
      columns,
      leftSide: {
        ...this.originalConfig.leftSide,
        entityType: leftType,
        availableFilters: this.leftFilters.map((id) => ({ id })),
        prefilter: this.originalConfig.leftSide?.prefilter,
      },
      rightSide: {
        ...this.originalConfig.rightSide,
        entityType: rightType,
        availableFilters: this.rightFilters.map((id) => ({ id })),
        prefilter: this.originalConfig.rightSide?.prefilter,
      },
      matchingViews: this.originalConfig.onMatch,
    };
    // console.log("Full config:",  fullConfig["appConfig:matching-entities"]);

    this.configService.saveConfig(fullConfig).then(() => {
      this.alertService.addInfo($localize`Configuration updated successfully.`);
      console.log("Full config:", fullConfig);
    });
  }

  cancel(): void {
    this.location.back();
  }
}
