import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

import { EntityConstructor } from "../../../core/entity/model/entity";
import { AdminEntityFormComponent } from "../../../core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { NoteDetailsConfig } from "../note-details/note-details-config.interface";
import { FormConfig } from "../../../core/entity-details/form/form.component";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { getDefaultNoteDetailsConfig } from "../add-default-note-views";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

/**
 * Admin component for configuring NoteDetails view.
 * Allows users to configure the three form sections with full field editing capabilities.
 */
@Component({
  selector: "app-admin-note-details",
  imports: [AdminEntityFormComponent, HintBoxComponent],
  templateUrl: "./admin-note-details.component.html",
})
export class AdminNoteDetailsComponent implements OnInit {
  @Input() config: NoteDetailsConfig = {};
  @Input() entityConstructor: EntityConstructor;
  @Output() configChange = new EventEmitter<NoteDetailsConfig>();

  noteDetailsConfig: FormConfig = { fieldGroups: [] };

  ngOnInit(): void {
    this.initializeFormConfigs();
  }

  private initializeFormConfigs(): void {
    const currentConfig = {
      ...getDefaultNoteDetailsConfig(),
      ...this.config,
    } as NoteDetailsConfig;

    // Convert string to FieldGroup for the admin form and add header for distinguishing sections
    const topFieldGroup: FieldGroup = {
      fields: currentConfig.topForm,
      header: "Top Form",
    };

    const middleFieldGroup: FieldGroup = {
      fields: currentConfig.middleForm,
      header: "Middle Form",
    };

    const bottomFieldGroup: FieldGroup = {
      fields: currentConfig.bottomForm,
      header: "Bottom Form",
    };

    this.noteDetailsConfig = {
      fieldGroups: [topFieldGroup, middleFieldGroup, bottomFieldGroup],
    };
  }

  onNoteDetailsConfigChange(formConfig: FormConfig): void {
    this.noteDetailsConfig = formConfig;
    // Extract fields from each section based on headers and convert back to string arrays
    const topGroup = formConfig.fieldGroups.find(
      (group) => group.header === "Top Form",
    );
    const middleGroup = formConfig.fieldGroups.find(
      (group) => group.header === "Middle Form",
    );
    const bottomGroup = formConfig.fieldGroups.find(
      (group) => group.header === "Bottom Form",
    );

    // Update the config as simple string arrays
    this.config.topForm = topGroup ? (topGroup.fields as string[]) : [];
    this.config.middleForm = middleGroup
      ? (middleGroup.fields as string[])
      : [];
    this.config.bottomForm = bottomGroup
      ? (bottomGroup.fields as string[])
      : [];

    this.configChange.emit(this.config);
  }
}
