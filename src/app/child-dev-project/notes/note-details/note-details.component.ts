import {
  Component,
  Inject,
  Input,
  OnInit,
  Optional,
  ViewEncapsulation,
} from "@angular/core";
import { Note } from "../model/note";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-list/EntityListConfig";
import { DatePipe } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { Angulartics2Module } from "angulartics2";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  EntityForm,
  EntityFormService,
} from "../../../core/common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../../core/common-components/entity-form/entity-form/entity-form.component";
import { DynamicComponentDirective } from "../../../core/config/dynamic-components/dynamic-component.directive";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { DialogButtonsComponent } from "../../../core/form-dialog/dialog-buttons/dialog-buttons.component";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { EntityArchivedInfoComponent } from "../../../core/entity-details/entity-archived-info/entity-archived-info.component";
import { EntityFieldEditComponent } from "../../../core/common-components/entity-field-edit/entity-field-edit.component";
import { FieldGroup } from "../../../core/entity-details/form/field-group";

/**
 * Component responsible for displaying the Note creation/view window
 */
@UntilDestroy()
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
  imports: [
    MatDialogModule,
    DatePipe,
    FontAwesomeModule,
    ExportDataDirective,
    Angulartics2Module,
    EntityFormComponent,
    DynamicComponentDirective,
    DialogButtonsComponent,
    MatMenuModule,
    DialogCloseComponent,
    EntityArchivedInfoComponent,
    EntityFieldEditComponent,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent implements OnInit {
  @Input() entity: Note;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  topForm = ["date", "warningLevel", "category", "authors", "attachment"];
  middleForm = ["subject", "text"];
  bottomForm = ["children", "schools"];
  topFieldGroups: FieldGroup[];
  bottomFieldGroups: FieldGroup[];

  form: EntityForm<Note>;
  tmpEntity: Note;

  constructor(
    private configService: ConfigService,
    private entityFormService: EntityFormService,
    @Optional() @Inject(MAT_DIALOG_DATA) data: { entity: Note },
  ) {
    if (data) {
      this.entity = data.entity;
    }
    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note")?.config.exportConfig;

    const formConfig = this.configService.getConfig<any>(
      "appConfig:note-details",
    );
    this.topForm = formConfig?.topForm ?? this.topForm;
    this.middleForm = formConfig?.middleForm ?? this.middleForm;
    this.bottomForm = formConfig?.bottomForm ?? this.bottomForm;
  }

  ngOnInit() {
    this.topFieldGroups = this.topForm.map((f) => ({ fields: [f] }));
    this.bottomFieldGroups = [{ fields: this.bottomForm }];

    this.form = this.entityFormService.createFormGroup(
      this.middleForm.concat(this.topForm, this.bottomForm),
      this.entity,
    );
    // create an object reflecting unsaved changes to use in template (e.g. for dynamic title)
    this.tmpEntity = this.entity.copy();
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.tmpEntity = Object.assign(this.tmpEntity, value);
    });
  }
}
