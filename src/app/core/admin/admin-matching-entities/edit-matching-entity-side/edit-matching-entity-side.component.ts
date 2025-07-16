import { Component, EventEmitter, Input, Output } from "@angular/core";
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
export class EditMatchingEntitySideComponent {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() entityType: string[] = [];

  @Input() sideEntity: EntityConstructor;
  @Input() columns!: ColumnConfig[];
  @Input() filters!: string[];
  @Input() title!: string;
  @Input() prefilter: any;

  @Output() columnsChange = new EventEmitter<ColumnConfig[]>();
  @Output() filtersChange = new EventEmitter<string[]>();
  @Output() openPrefilterEditor = new EventEmitter<void>();

  onColumnsChange(newColumns: ColumnConfig[]): void {
    console.log("Emitting updated columns:", newColumns);
    this.columnsChange.emit(newColumns);
  }

  onFiltersChange(newFilters: ColumnConfig[]): void {
    if (newFilters.every((f) => typeof f === "string")) {
      this.filtersChange.emit(newFilters);
    }
  }

  onOpenPrefilterEditor(): void {
    this.openPrefilterEditor.emit();
  }
}
