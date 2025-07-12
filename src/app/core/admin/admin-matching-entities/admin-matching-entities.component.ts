import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { AdminListManagerComponent } from "../admin-list-manager/admin-list-manager.component";
import { EntityConstructor } from "../../entity/model/entity";
import { ConfigService } from "../../config/config.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { MatchingEntitiesConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EditMatchingViewComponent } from "./edit-matching-view/edit-matching-view.component";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../json-editor/json-editor-dialog/json-editor-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-admin-matching-entities",
  imports: [
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    AdminListManagerComponent,
    EditMatchingViewComponent,
    FontAwesomeModule,
  ],
  templateUrl: "./admin-matching-entities.component.html",
  styleUrls: ["./admin-matching-entities.component.scss"],
})
export class AdminMatchingEntitiesComponent implements OnInit {
  configForm!: FormGroup;
  originalConfig: MatchingEntitiesConfig;

  entityType: string[] = [];

  leftSideEntity: EntityConstructor;
  rightSideEntity: EntityConstructor;

  leftColumns: string[] = [];
  rightColumns: string[] = [];

  leftFilters: string[] = [];
  rightFilters: string[] = [];

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private entityRegistry: EntityRegistry,
    readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.initConfig();
    this.initForm();
    this.configForm.get("leftType")!.valueChanges.subscribe((key) => {
      this.leftSideEntity = this.entityRegistry.get(key) ?? null;
      this.leftColumns = [];
      this.leftFilters = [];
    });

    this.configForm.get("rightType")!.valueChanges.subscribe((key) => {
      this.rightSideEntity = this.entityRegistry.get(key) ?? null;
      this.rightColumns = [];
      this.rightFilters = [];
    });
  }

  private initConfig(): void {
    this.originalConfig =
      this.configService.getConfig("appConfig:matching-entities") || {};

    const cols = this.originalConfig.columns ?? [];
    console.log(cols, "test");
    this.leftColumns = cols.map((col: any[]) =>
      typeof col[0] === "string" ? col[0] : col[0].id,
    );
    this.rightColumns = cols.map((col: any[]) =>
      typeof col[1] === "string" ? col[1] : col[1].id,
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
 // todo: may be while saving this we can use the select column for the table and list view?
 // todo: json editor for prefilter?
   */
  save(): void {
    const leftType = this.configForm.value.leftType;
    const rightType = this.configForm.value.rightType;

    const columns = this.leftColumns.map((l, i) => [
      l,
      this.rightColumns[i] ?? null,
    ]);

    const leftSide = {
      ...this.originalConfig.leftSide,
      entityType: leftType,
      availableFilters: this.leftFilters.map((id) => ({ id })),

      prefilter: this.originalConfig.leftSide?.prefilter,
    };
    const rightSide = {
      ...this.originalConfig.rightSide,
      entityType: rightType,
      availableFilters: this.rightFilters.map((id) => ({ id })),
      prefilter: this.originalConfig.rightSide?.prefilter,
    };

    const onMatch = this.originalConfig.onMatch;

    const updatedConfig = { columns, leftSide, rightSide, onMatch };

    console.log("Config saved:", updatedConfig);
  }

  cancel(): void {
    console.log("Cancelled");
  }

  /**
   * Open the conditions JSON editor popup.
   */
  openConditionsInJsonEditorPopup(side: "left" | "right") {
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
}
