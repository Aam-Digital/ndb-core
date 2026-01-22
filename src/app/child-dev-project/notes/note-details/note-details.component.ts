import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from "@angular/core";
import { Note } from "../model/note";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-list/EntityListConfig";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { Angulartics2Module } from "angulartics2";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityFormService } from "../../../core/common-components/entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormComponent } from "../../../core/common-components/entity-form/entity-form/entity-form.component";
import { MatDialogModule } from "@angular/material/dialog";
import { DialogButtonsComponent } from "../../../core/form-dialog/dialog-buttons/dialog-buttons.component";
import { EntityArchivedInfoComponent } from "../../../core/entity-details/entity-archived-info/entity-archived-info.component";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { AbstractEntityDetailsComponent } from "../../../core/entity-details/abstract-entity-details/abstract-entity-details.component";
import { MatProgressBar } from "@angular/material/progress-bar";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";
import { NoteDetailsConfig } from "./note-details-config.interface";
import { getDefaultNoteDetailsConfig } from "../add-default-note-views";

/**
 * Component responsible for displaying the Note creation/view window
 */
@UntilDestroy()
@DynamicComponent("NoteDetails")
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
  imports: [
    MatDialogModule,
    CustomDatePipe,
    FontAwesomeModule,
    ExportDataDirective,
    Angulartics2Module,
    EntityFormComponent,
    DialogButtonsComponent,
    MatMenuModule,
    EntityArchivedInfoComponent,
    ViewTitleComponent,
    MatProgressBar,
    ViewActionsComponent,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent
  extends AbstractEntityDetailsComponent
  implements OnChanges, NoteDetailsConfig
{
  private configService = inject(ConfigService);
  private entityFormService = inject(EntityFormService);

  @Input() declare entity: Note;
  override entityConstructor = Note;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  private readonly defaultFormConfig = getDefaultNoteDetailsConfig();
  @Input() topForm = this.defaultFormConfig.topForm;
  @Input() middleForm = this.defaultFormConfig.middleForm;
  @Input() bottomForm = this.defaultFormConfig.bottomForm;

  topFieldGroups: FieldGroup[];
  middleFieldGroups: FieldGroup[];
  bottomFieldGroups: FieldGroup[];

  form: EntityForm<Note>;
  tmpEntity: Note;

  override async ngOnChanges(changes: SimpleChanges) {
    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note")?.config.exportConfig;

    await super.ngOnChanges(changes);

    await this.initForm();
  }

  private async initForm() {
    if (!this.entity) return;

    this.topFieldGroups = this.topForm.map((f) => ({ fields: [f] }));
    this.middleFieldGroups = [{ fields: this.middleForm }];
    this.bottomFieldGroups = [{ fields: this.bottomForm }];

    this.form = await this.entityFormService.createEntityForm(
      this.middleForm.concat(this.topForm, this.bottomForm),
      this.entity,
    );

    // create an object reflecting unsaved changes to use in template (e.g. for dynamic title)
    this.tmpEntity = this.entity.copy();
    this.form.formGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.tmpEntity = Object.assign(this.tmpEntity, value);
      });
  }
}
