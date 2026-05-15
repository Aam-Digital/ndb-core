import {
  Component,
  ChangeDetectionStrategy,
  input,
  linkedSignal,
  output,
} from "@angular/core";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-note-details",
  imports: [AdminEntityFormComponent, HintBoxComponent],
  templateUrl: "./admin-note-details.component.html",
})
export class AdminNoteDetailsComponent {
  private static readonly TOP_FORM_HEADER = "Top Form";
  private static readonly MIDDLE_FORM_HEADER = "Middle Form";
  private static readonly BOTTOM_FORM_HEADER = "Bottom Form";

  config = input<NoteDetailsConfig>({});
  entityConstructor = input.required<EntityConstructor>();
  configChange = output<NoteDetailsConfig>();

  noteDetailsConfig = linkedSignal<FormConfig>(() =>
    this.toFormConfig(this.config()),
  );

  private toFormConfig(config: NoteDetailsConfig): FormConfig {
    const currentConfig = {
      ...getDefaultNoteDetailsConfig(),
      ...config,
    } as NoteDetailsConfig;

    const topFieldGroup: FieldGroup = {
      fields: currentConfig.topForm,
      header: AdminNoteDetailsComponent.TOP_FORM_HEADER,
    };

    const middleFieldGroup: FieldGroup = {
      fields: currentConfig.middleForm,
      header: AdminNoteDetailsComponent.MIDDLE_FORM_HEADER,
    };

    const bottomFieldGroup: FieldGroup = {
      fields: currentConfig.bottomForm,
      header: AdminNoteDetailsComponent.BOTTOM_FORM_HEADER,
    };

    return {
      fieldGroups: [topFieldGroup, middleFieldGroup, bottomFieldGroup],
    };
  }

  private toConfig(formConfig: FormConfig): NoteDetailsConfig {
    const topGroup = formConfig.fieldGroups.find(
      (group) => group.header === AdminNoteDetailsComponent.TOP_FORM_HEADER,
    );
    const middleGroup = formConfig.fieldGroups.find(
      (group) => group.header === AdminNoteDetailsComponent.MIDDLE_FORM_HEADER,
    );
    const bottomGroup = formConfig.fieldGroups.find(
      (group) => group.header === AdminNoteDetailsComponent.BOTTOM_FORM_HEADER,
    );

    return {
      topForm: topGroup ? (topGroup.fields as string[]) : [],
      middleForm: middleGroup ? (middleGroup.fields as string[]) : [],
      bottomForm: bottomGroup ? (bottomGroup.fields as string[]) : [],
    };
  }

  onNoteDetailsConfigChange(formConfig: FormConfig): void {
    this.noteDetailsConfig.set(formConfig);
    this.configChange.emit(this.toConfig(formConfig));
  }
}
