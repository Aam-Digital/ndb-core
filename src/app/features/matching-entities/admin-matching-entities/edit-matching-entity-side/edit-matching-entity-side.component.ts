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
import { CommonModule } from "@angular/common";
import { AdminListManagerComponent } from "../../../../core/admin/admin-list-manager/admin-list-manager.component";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MatchingSideConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../../../../core/admin/json-editor/json-editor-dialog/json-editor-dialog.component";

@Component({
  selector: "app-edit-matching-entity-side",
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FontAwesomeModule,
    AdminListManagerComponent,
  ],
  templateUrl: "./edit-matching-entity-side.component.html",
  styleUrls: ["./edit-matching-entity-side.component.scss"],
})
export class EditMatchingEntitySideComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly entityRegistry = inject(EntityRegistry);

  @Input() index: number;
  @Input() originalSideConfig: MatchingSideConfig;
  @Input() allColumns: ColumnConfig[][] = [];

  @Output() configChange = new EventEmitter<MatchingSideConfig>();

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
  sideConfig: MatchingSideConfig;

  ngOnInit(): void {
    const sideColumns =
      this.allColumns?.map((col) => col?.[this.index])?.filter(Boolean) ?? [];

    this.sideConfig = {
      entityType: this.originalSideConfig?.entityType ?? null,
      columns: sideColumns,
      availableFilters: this.originalSideConfig?.availableFilters ?? [],
      prefilter: this.originalSideConfig?.prefilter ?? {},
    };

    this.configChange.emit(this.sideConfig);

    this.availableEntityTypes = this.entityRegistry
      .getEntityTypes()
      .map((ctor) => ctor.value.ENTITY_TYPE);

    // We use setTimeout to add additionalFields only after base fields are loaded
    setTimeout(() => {
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
    });

    this.initFormConfig();
  }

  /**
   * Initializes the form configuration for columns and filters based on the current sideConfig.
   * Sets entityConstructor, columns, and filters properties accordingly.
   */
  private initFormConfig(): void {
    const sideEntityType = this.sideConfig?.entityType;
    this.entityConstructor =
      typeof sideEntityType === "string"
        ? this.entityRegistry.get(sideEntityType)
        : sideEntityType;

    this.columns = this.sideConfig?.columns ?? [];
    this.filters = this.sideConfig?.availableFilters?.map((f) => f.id) ?? [];
  }

  onEntityTypeChange(entityType: string): void {
    if (this.sideConfig.entityType === entityType) return;
    const updated: MatchingSideConfig = {
      entityType,
      columns: [],
      availableFilters: [],
      prefilter: {},
    };
    this.sideConfig = updated;
    this.configChange.emit(updated);
  }

  onColumnsChange(newCols: ColumnConfig[]) {
    this.sideConfig = {
      ...this.sideConfig,
      columns: newCols,
    };
    this.configChange.emit(this.sideConfig);
  }

  onFiltersChange(newFilters: ColumnConfig[]) {
    const updatedFilters = newFilters.map((f) =>
      typeof f === "string" ? f : f.id,
    );
    this.sideConfig = {
      ...this.sideConfig,
      availableFilters: updatedFilters.map((id) => ({ id })),
    };
    this.configChange.emit(this.sideConfig);
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
      this.configChange.emit(this.sideConfig);
    });
  }
}
