import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";

import { AdminListManagerComponent } from "../../../../core/admin/admin-list-manager/admin-list-manager.component";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MatchingSideConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../../../../core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { IconButtonComponent } from "../../../../core/common-components/icon-button/icon-button.component";

@Component({
  selector: "app-edit-matching-entity-side",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FontAwesomeModule,
    AdminListManagerComponent,
    EntityTypeSelectComponent,
    IconButtonComponent,
  ],
  templateUrl: "./edit-matching-entity-side.component.html",
  styleUrls: ["./edit-matching-entity-side.component.scss"],
})
export class EditMatchingEntitySideComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly entityRegistry = inject(EntityRegistry);

  @Input() sideConfig: MatchingSideConfig;
  @Output() sideConfigChange = new EventEmitter<MatchingSideConfig>();

  /**
   * Holds a predefined list of additional column options that can be appended to the entity view.
   */
  additionalFields: ColumnConfig[] = [];

  /**
   * Holds a list of available entity types for selection in the dropdown.
   */
  availableEntityTypes: string[] = [];
  entityConstructor: EntityConstructor | null;
  columns: ColumnConfig[] = [];
  filters: string[] = [];

  ngOnInit(): void {
    this.availableEntityTypes = this.entityRegistry
      .getEntityTypes()
      .map((ctor) => ctor.value.ENTITY_TYPE);

    this.additionalFields = [
      { id: "distance", label: "Distance" },
      {
        id: "_id",
        label: $localize`:label for field represented as DisplayEntity block to select in Admin UI:Name (record preview)`,
        additional: this.sideConfig.entityType,
        noSorting: true,
        viewComponent: "DisplayEntity",
      },
    ];

    this.initFormConfig();
  }

  /**
   * Initializes the form configuration for columns and filters based on the current sideConfig.
   * Sets entityConstructor, columns, and filters properties accordingly.
   */
  private initFormConfig(): void {
    const sideEntityType = this.sideConfig?.entityType;
    this.entityConstructor = this.entityRegistry.get(sideEntityType);
    this.columns = this.sideConfig?.columns ?? [];
    this.filters = this.sideConfig?.availableFilters?.map((f) => f.id) ?? [];
  }

  onEntityTypeChange(entityType: string | string[]): void {
    entityType = <string>entityType; // assert this is a string because we don't use multi-select mode
    if (this.sideConfig.entityType === entityType) return;

    const updated: MatchingSideConfig = {
      entityType,
      columns: [],
      availableFilters: [],
      prefilter: {},
    };
    this.sideConfig = updated;
    this.initFormConfig();
    this.sideConfigChange.emit(this.sideConfig);
  }

  onColumnsChange(newCols: ColumnConfig[]) {
    this.sideConfig = {
      ...this.sideConfig,
      columns: newCols,
    };
    this.sideConfigChange.emit(this.sideConfig);
  }

  onFiltersChange(newFilters: ColumnConfig[]) {
    const updatedFilters = newFilters.map((f) =>
      typeof f === "string" ? f : f.id,
    );
    this.sideConfig = {
      ...this.sideConfig,
      availableFilters: updatedFilters.map((id) => ({ id })),
    };
    this.sideConfigChange.emit(this.sideConfig);
  }

  openPrefilterEditor() {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.sideConfig.prefilter || {}, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == null) return;
      this.sideConfig = {
        ...this.sideConfig,
        prefilter: result,
      };
      this.sideConfigChange.emit(this.sideConfig);
    });
  }
}
