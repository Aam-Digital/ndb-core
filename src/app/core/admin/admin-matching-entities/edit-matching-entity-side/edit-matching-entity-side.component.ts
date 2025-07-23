import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EntityConstructor } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { AdminListManagerComponent } from "../../admin-list-manager/admin-list-manager.component";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { MatchingSideConfig } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import { JsonEditorDialogComponent } from "../../json-editor/json-editor-dialog/json-editor-dialog.component";

@Component({
  selector: "app-edit-matching-entity-side",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    AdminListManagerComponent,
    FontAwesomeModule,
    MatButtonModule,
  ],
  templateUrl: "./edit-matching-entity-side.component.html",
  styleUrls: ["./edit-matching-entity-side.component.scss"],
})
export class EditMatchingEntitySideComponent implements OnChanges {
  readonly dialog = inject(MatDialog);
  readonly entityRegistry = inject(EntityRegistry);

  @Input() form: FormGroup;
  @Input() controlName: string;
  @Input() sideConfig: MatchingSideConfig;
  @Input() title: string;

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
      this.sideConfig.columns
        ?.map((c) => (typeof c === "string" ? c : c?.id))
        .filter((c) => c !== undefined) ?? [];
    this.filters = this.sideConfig.availableFilters?.map((f) => f.id) ?? [];
  }

  onColumnsChange(newCols: ColumnConfig[]) {
    this.emitChange({ ...this.sideConfig, columns: newCols });
  }

  onFiltersChange(newFilters: ColumnConfig[]): void {
    const updatedFilters = newFilters.map((f) =>
      typeof f === "string" ? f : f.id,
    );
    this.emitChange({
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
      this.emitChange({ ...this.sideConfig, prefilter: result });
    });
  }

  /**
   * Emits the updated MatchingSideConfig through the configChange EventEmitter.
   */
  private emitChange(config: MatchingSideConfig) {
    this.configChange.emit(config);
  }
}
