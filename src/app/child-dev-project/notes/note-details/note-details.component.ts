import {
  Component,
  Inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { Note } from "../model/note";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { DatePipe, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { Angulartics2Module } from "angulartics2";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  EntityForm,
  EntityFormService,
} from "../../../core/entity-components/entity-form/entity-form.service";
import { toFormFieldConfig } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { DynamicComponentDirective } from "../../../core/view/dynamic-components/dynamic-component.directive";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { InvalidFormFieldError } from "../../../core/entity-components/entity-form/invalid-form-field.error";
import { AlertService } from "../../../core/alerts/alert.service";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../core/entity/entity-remove.service";
import { DisableEntityOperationDirective } from "../../../core/permissions/permission-directive/disable-entity-operation.directive";

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
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    ExportDataDirective,
    Angulartics2Module,
    EntityFormComponent,
    DynamicComponentDirective,
    DisableEntityOperationDirective,
    NgIf,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent implements OnInit {
  @Input() entity: Note;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  topForm = ["date", "warningLevel", "category", "authors"].map((field) => [
    toFormFieldConfig(field),
  ]);
  middleForm = ["subject", "text"].map(toFormFieldConfig);
  bottomForm = ["children", "schools"].map(toFormFieldConfig);
  form: EntityForm<Note>;
  tmpEntity: Note;

  constructor(
    private configService: ConfigService,
    private entityFormService: EntityFormService,
    @Inject(MAT_DIALOG_DATA) data: { entity: Note },
    private dialog: MatDialogRef<any>,
    private alertService: AlertService,
    private entityRemoveService: EntityRemoveService
  ) {
    this.entity = data.entity;
    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note").config.exportConfig;
    const formConfig = this.configService.getConfig<any>(
      "app-config:note-details"
    );
    ["topForm", "middleForm", "bottomForm"].forEach((form) => {
      this[form] = formConfig?.[form]?.map(toFormFieldConfig) ?? this[form];
    });
  }

  ngOnInit() {
    this.form = this.entityFormService.createFormGroup(
      this.middleForm.concat(...this.topForm, this.bottomForm),
      this.entity
    );
    this.tmpEntity = this.entity.copy();
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.tmpEntity = Object.assign(this.tmpEntity, value);
    });
  }

  async save() {
    // Maybe move to abstract class (similar to TodoDetails and RowDetails)
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.dialog.close();
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  delete() {
    this.entityRemoveService.remove(this.entity).subscribe((result) => {
      if (result === RemoveResult.REMOVED) {
        this.dialog.close();
      }
    });
  }
}
