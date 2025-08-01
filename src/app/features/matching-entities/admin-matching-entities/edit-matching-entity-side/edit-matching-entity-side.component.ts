import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
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
export class EditMatchingEntitySideComponent implements OnChanges {
  readonly dialog = inject(MatDialog);
  readonly entityRegistry = inject(EntityRegistry);

  @Input() sideConfig: MatchingSideConfig;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sideConfig) {
      this.initFormConfig();
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
    }
  }

  /**
   * Initializes the form configuration for columns and filters based on the current sideConfig.
   * Sets entityConstructor, columns, and filters properties accordingly.
   */
  private initFormConfig() {
    const sideEntityType = this.sideConfig.entityType;
    this.entityConstructor =
      typeof sideEntityType === "string"
        ? this.entityRegistry.get(sideEntityType)
        : sideEntityType;

    this.columns =
      this.sideConfig.columns?.filter((c): c is ColumnConfig => c != null) ??
      [];
    this.filters = this.sideConfig.availableFilters?.map((f) => f.id) ?? [];
  }

  onEntityTypeChange(entityType: string): void {
    if (this.sideConfig.entityType === entityType) return;
    //  Resets configuration for the side when its entity type changes.
    this.configChange.emit({
      entityType,
      columns: [],
      availableFilters: [],
      prefilter: {},
    });
  }

  onColumnsChange(newCols: ColumnConfig[]) {
    this.configChange.emit({
      ...this.sideConfig,
      columns: newCols,
    });
  }

  onFiltersChange(newFilters: ColumnConfig[]) {
    const updatedFilters = newFilters.map((f) =>
      typeof f === "string" ? f : f.id,
    );
    this.configChange.emit({
      ...this.sideConfig,
      availableFilters: updatedFilters.map((id) => ({ id })),
    });
  }

  /**
   * Opens a dialog for editing the prefilter JSON configuration.
   * After the dialog is closed, emits the updated prefilter if provided.
   */
  openPrefilterEditor() {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.sideConfig.prefilter || {}, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == null) return;
      this.configChange.emit({
        ...this.sideConfig,
        prefilter: result,
      });
    });
  }
}
