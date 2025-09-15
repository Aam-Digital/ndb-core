import {
  Component,
  Input,
  OnInit,
  inject,
  Output,
  EventEmitter,
} from "@angular/core";
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
    console.log(
      this.topFormConfig,
      this.middleFormConfig,
      this.bottomFormConfig,
    );
    console.log(this.entityConstructor.schema.entries());
    console.log(this.config);
  }

  private initializeFormConfigs(): void {
    const currentConfig = {
      ...this.defaultConfig,
      ...this.config,
    };

    this.topFormConfig = { fieldGroups: [...currentConfig.topForm] };
    this.middleFormConfig = { fieldGroups: [...currentConfig.middleForm] };
    this.bottomFormConfig = { fieldGroups: [...currentConfig.bottomForm] };
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
