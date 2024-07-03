import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
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
import { MatDialogModule } from "@angular/material/dialog";
import { DialogButtonsComponent } from "../../../core/form-dialog/dialog-buttons/dialog-buttons.component";
import { DialogCloseComponent } from "../../../core/common-components/dialog-close/dialog-close.component";
import { EntityArchivedInfoComponent } from "../../../core/entity-details/entity-archived-info/entity-archived-info.component";
import { EntityFieldEditComponent } from "../../../core/common-components/entity-field-edit/entity-field-edit.component";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { AbstractEntityDetailsComponent } from "../../../core/entity-details/abstract-entity-details/abstract-entity-details.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityAbility } from "../../../core/permissions/ability/entity-ability";
import { Router } from "@angular/router";
import { LoggingService } from "../../../core/logging/logging.service";
import { UnsavedChangesService } from "../../../core/entity-details/form/unsaved-changes.service";
import { MatProgressBar } from "@angular/material/progress-bar";
import { ViewActionsComponent } from "../../../core/common-components/view-actions/view-actions.component";

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
    ViewTitleComponent,
    MatProgressBar,
    ViewActionsComponent,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent
  extends AbstractEntityDetailsComponent
  implements OnChanges
{
  @Input() entity: Note;
  entityConstructor = Note;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  @Input() topForm = [
    "date",
    "warningLevel",
    "category",
    "authors",
    "attachment",
  ];
  @Input() middleForm = ["subject", "text"];
  @Input() bottomForm = ["children", "schools"];

  topFieldGroups: FieldGroup[];
  bottomFieldGroups: FieldGroup[];

  form: EntityForm<Note>;
  tmpEntity: Note;

  constructor(
    entityMapperService: EntityMapperService,
    entities: EntityRegistry,
    ability: EntityAbility,
    router: Router,
    logger: LoggingService,
    unsavedChanges: UnsavedChangesService,
    private configService: ConfigService,
    private entityFormService: EntityFormService,
  ) {
    super(
      entityMapperService,
      entities,
      ability,
      router,
      logger,
      unsavedChanges,
    );

    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note")?.config.exportConfig;
  }

  async ngOnChanges(changes: SimpleChanges) {
    await super.ngOnChanges(changes);

    this.topFieldGroups = this.topForm.map((f) => ({ fields: [f] }));
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
