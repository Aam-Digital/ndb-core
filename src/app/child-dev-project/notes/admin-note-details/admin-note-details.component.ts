import { Component, Input, OnInit, inject, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { AdminListManagerComponent } from "../../../core/admin/admin-list-manager/admin-list-manager.component";
import { ColumnConfig } from "../../../core/common-components/entity-form/FormConfig";
import { NoteDetailsConfig } from "../note-details/note-details-config.interface";

/**
 * Admin component for configuring NoteDetails view.
 * Allows users to select and reorder fields for the topForm, middleForm, and bottomForm sections.
 */
@Component({
  selector: "app-admin-note-details",
  imports: [
    CommonModule,
    AdminListManagerComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: "./admin-note-details.component.html",
  styleUrl: "./admin-note-details.component.scss",
})
export class AdminNoteDetailsComponent implements OnInit {
  @Input() config: NoteDetailsConfig = {};
  @Input() entityConstructor: EntityConstructor;
  @Output() configChange = new EventEmitter<NoteDetailsConfig>();

  topFormFields: ColumnConfig[] = [];
  middleFormFields: ColumnConfig[] = [];
  bottomFormFields: ColumnConfig[] = [];

  private readonly defaultConfig: Required<NoteDetailsConfig> = {
    topForm: ["date", "warningLevel", "category", "authors", "attachment"],
    middleForm: ["subject", "text"],
    bottomForm: ["children", "schools"],
  };

  ngOnInit(): void {
    this.initializeFields();
  }

  private initializeFields(): void {
    // Initialize with current config or default values
    const currentConfig = {
      ...this.defaultConfig,
      ...this.config,
    };

    this.topFormFields = this.convertToColumnConfigs(currentConfig.topForm);
    this.middleFormFields = this.convertToColumnConfigs(currentConfig.middleForm);
    this.bottomFormFields = this.convertToColumnConfigs(currentConfig.bottomForm);
  }

  private convertToColumnConfigs(fieldIds: string[]): ColumnConfig[] {
    return fieldIds.map((fieldId) => ({ id: fieldId }));
  }

  private convertToFieldIds(columnConfigs: ColumnConfig[]): string[] {
    return columnConfigs.map((config) => {
      if (typeof config === "string") {
        return config;
      } else {
        return config.id;
      }
    });
  }

  onTopFormChange(fields: ColumnConfig[]): void {
    this.topFormFields = fields;
    this.config.topForm = this.convertToFieldIds(fields);
    this.configChange.emit(this.config);
  }

  onMiddleFormChange(fields: ColumnConfig[]): void {
    this.middleFormFields = fields;
    this.config.middleForm = this.convertToFieldIds(fields);
    this.configChange.emit(this.config);
  }

  onBottomFormChange(fields: ColumnConfig[]): void {
    this.bottomFormFields = fields;
    this.config.bottomForm = this.convertToFieldIds(fields);
    this.configChange.emit(this.config);
  }
}
