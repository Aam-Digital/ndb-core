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
  private dialog = inject(MatDialog);
  private entityRegistry = inject(EntityRegistry);

  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() entityType: string[] = [];
  @Input() sideConfig!: MatchingSideConfig;
  @Input() title!: string;

  @Output() configChange = new EventEmitter<MatchingSideConfig>();

  entityConstructor!: EntityConstructor | null;
  columns: string[] = [];
  filters: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sideConfig) {
      this.initFormConfig();
    }
  }

  private initFormConfig() {
    this.entityConstructor = this.entityRegistry.get(
      this.sideConfig.entityType as string,
    )!;
    this.columns =
      this.sideConfig.columns?.map((c) => (typeof c === "string" ? c : c.id)) ??
      [];
    this.filters = this.sideConfig.availableFilters?.map((f) => f.id) ?? [];
  }

  onColumnsChange(newCols: string[]) {
    this.emitChange({ ...this.sideConfig, columns: newCols });
  }

  onFiltersChange(newFilters: string[]) {
    this.emitChange({
      ...this.sideConfig,
      availableFilters: newFilters.map((id) => ({ id })),
    });
  }

  openPrefilterEditor() {
    const dialogRef = this.dialog.open(JsonEditorDialogComponent, {
      data: { value: this.sideConfig.prefilter || {}, closeButton: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == null) return;
      console.log("Prefilter:", result);
      this.emitChange({ ...this.sideConfig, prefilter: result });
    });
  }

  private emitChange(config: MatchingSideConfig) {
    this.configChange.emit(config);
  }
}
