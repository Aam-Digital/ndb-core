import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { AdminEntityFormComponent } from "../../../core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { NoteDetailsConfig } from "../note-details/note-details-config.interface";
import { FormConfig } from "../../../core/entity-details/form/form.component";
import { FieldGroup } from "../../../core/entity-details/form/field-group";

/**
 * Admin component for configuring NoteDetails view.
 * Allows users to configure the three form sections with full field editing capabilities.
 */
@Component({
  selector: "app-admin-note-details",
  imports: [CommonModule, AdminEntityFormComponent],
  templateUrl: "./admin-note-details.component.html",
  styleUrls: ["../../../core/admin/admin-entity/admin-entity-styles.scss"],
})
export class AdminNoteDetailsComponent implements OnInit {
  @Input() config: NoteDetailsConfig = {};
  @Input() entityConstructor: EntityConstructor;
  @Output() configChange = new EventEmitter<NoteDetailsConfig>();

  combinedFormConfig: FormConfig = { fieldGroups: [] };

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

    // Add headers to distinguish sections and combine all field groups
    const topWithHeaders = normalizedTop.map((group: FieldGroup) => ({
      ...group,
      header: "Top Form Section",
    }));

    const middleWithHeaders = normalizedMiddle.map((group: FieldGroup) => ({
      ...group,
      header: "Middle Form Section",
    }));

    const bottomWithHeaders = normalizedBottom.map((group: FieldGroup) => ({
      ...group,
      header: "Bottom Form Section",
    }));

    this.combinedFormConfig = {
      fieldGroups: [
        ...topWithHeaders,
        ...middleWithHeaders,
        ...bottomWithHeaders,
      ],
    };
  }

  /**
   * Normalize legacy configs where a form is provided as string[] instead of
   * [{ fields: string[] }]. Ensures we always return an array of field-group objects.
   */
  private normalizeToFieldGroups(input: any): FieldGroup[] {
    if (!Array.isArray(input)) {
      return [];
    }
    // If first element is a string, treat the whole array as fields of a single group
    if (input.length > 0 && typeof input[0] === "string") {
      return [{ fields: input as string[] }];
    }
    // Otherwise assume it's already in the correct shape
    return input as FieldGroup[];
  }

  onCombinedFormConfigChange(formConfig: FormConfig): void {
    this.combinedFormConfig = formConfig;

    // Separate the combined field groups back into their respective sections
    const topGroups: FieldGroup[] = [];
    const middleGroups: FieldGroup[] = [];
    const bottomGroups: FieldGroup[] = [];

    formConfig.fieldGroups.forEach((group) => {
      if (group.header === "Top Form Section") {
        topGroups.push(group);
      } else if (group.header === "Middle Form Section") {
        middleGroups.push(group);
      } else if (group.header === "Bottom Form Section") {
        bottomGroups.push(group);
      }
    });

    // Update the config - remove headers to match the original format
    this.config.topForm = topGroups;
    this.config.middleForm = middleGroups;
    this.config.bottomForm = bottomGroups;

    console.log(this.config, "this.config");
    this.configChange.emit(this.config);
  }
}
