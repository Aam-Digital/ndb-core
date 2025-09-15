import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { AdminEntityFormComponent } from "../../../core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { NoteDetailsConfig } from "../note-details/note-details-config.interface";
import { FormConfig } from "../../../core/entity-details/form/form.component";

/**
 * Admin component for configuring NoteDetails view.
 * Allows users to configure the three form sections with full field editing capabilities.
 */
@Component({
  selector: "app-admin-note-details",
  imports: [CommonModule, AdminEntityFormComponent],
  templateUrl: "./admin-note-details.component.html",
  styleUrl: "./admin-note-details.component.scss",
})
export class AdminNoteDetailsComponent implements OnInit {
  @Input() config: NoteDetailsConfig = {};
  @Input() entityConstructor: EntityConstructor;
  @Output() configChange = new EventEmitter<NoteDetailsConfig>();

  topFormConfig: FormConfig = { fieldGroups: [] };
  middleFormConfig: FormConfig = { fieldGroups: [] };
  bottomFormConfig: FormConfig = { fieldGroups: [] };

  private readonly defaultConfig: Required<NoteDetailsConfig> = {
    topForm: [
      { fields: ["date", "warningLevel", "category", "authors", "attachment"] },
    ],
    middleForm: [{ fields: ["subject", "text"] }],
    bottomForm: [{ fields: ["children", "schools"] }],
  };

  ngOnInit(): void {
    this.initializeFormConfigs();
  }

  private initializeFormConfigs(): void {
    const currentConfig = {
      ...this.defaultConfig,
      ...this.config,
    } as Required<NoteDetailsConfig>;

    // Normalize to guard against legacy configs where top/middle/bottom may be string[]
    const normalizedTop = this.normalizeToFieldGroups(currentConfig.topForm);
    const normalizedMiddle = this.normalizeToFieldGroups(
      currentConfig.middleForm,
    );
    const normalizedBottom = this.normalizeToFieldGroups(
      currentConfig.bottomForm,
    );

    this.topFormConfig = { fieldGroups: [...normalizedTop] };
    this.middleFormConfig = { fieldGroups: [...normalizedMiddle] };
    this.bottomFormConfig = { fieldGroups: [...normalizedBottom] };
  }

  /**
   * Normalize legacy configs where a form is provided as string[] instead of
   * [{ fields: string[] }]. Ensures we always return an array of field-group objects.
   */
  private normalizeToFieldGroups(input: any): { fields: string[] }[] {
    if (!Array.isArray(input)) {
      return [];
    }
    // If first element is a string, treat the whole array as fields of a single group
    if (input.length > 0 && typeof input[0] === "string") {
      return [{ fields: input as string[] }];
    }
    // Otherwise assume it's already in the correct shape
    return input as { fields: string[] }[];
  }

  onTopFormConfigChange(formConfig: FormConfig): void {
    this.topFormConfig = formConfig;
    this.config.topForm = formConfig.fieldGroups;
    this.configChange.emit(this.config);
  }

  onMiddleFormConfigChange(formConfig: FormConfig): void {
    this.middleFormConfig = formConfig;
    this.config.middleForm = formConfig.fieldGroups;
    this.configChange.emit(this.config);
  }

  onBottomFormConfigChange(formConfig: FormConfig): void {
    this.bottomFormConfig = formConfig;
    this.config.bottomForm = formConfig.fieldGroups;
    this.configChange.emit(this.config);
  }
}
