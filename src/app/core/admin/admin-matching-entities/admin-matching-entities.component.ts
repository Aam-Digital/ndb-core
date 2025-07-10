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
  ) {}

  ngOnInit(): void {
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

    const leftFilter = this.originalConfig.leftSide?.availableFilters ?? [];
    this.leftFilters = leftFilter.map((f: any) => f.id);
    const rightFilter = this.originalConfig.rightSide?.availableFilters ?? [];
    this.rightFilters = rightFilter.map((f: any) => f.id);

    this.entityType = this.entityRegistry
      .getEntityTypes()
      .map((ctor) => ctor.value.ENTITY_TYPE);

    this.configForm = this.fb.group({
      leftType: [this.originalConfig.leftSide?.entityType ?? ""],
      rightType: [this.originalConfig.rightSide?.entityType ?? ""],
    });

    const initLeftKey = this.configForm.value.leftType;
    const initRightKey = this.configForm.value.rightType;
    this.leftSideEntity = this.entityRegistry.get(initLeftKey) ?? null;
    this.rightSideEntity = this.entityRegistry.get(initRightKey) ?? null;

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

  save(): void {
    console.log("saving", this.configForm.value);
    // todo: may be while saving this we can use the select column for the table and list view?
    // todo: json editor for prefilter?
  }

  cancel(): void {
    console.log("Cancelled");
  }
}
