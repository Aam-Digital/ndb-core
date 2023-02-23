import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";
import { School } from "../../schools/model/school";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { compareEnums } from "../../../utils/utils";
import { FormDialogWrapperComponent } from "../../../core/form-dialog/form-dialog-wrapper/form-dialog-wrapper.component";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { DatePipe, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { Angulartics2Module } from "angulartics2";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { ConfigurableEnumDirective } from "../../../core/configurable-enum/configurable-enum-directive/configurable-enum.directive";
import { BorderHighlightDirective } from "../../../core/common-components/border-highlight/border-highlight.directive";
import { EntitySelectComponent } from "../../../core/entity-components/entity-select/entity-select/entity-select.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-attendance/child-meeting-note-attendance.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  EntityForm,
  EntityFormService,
} from "../../../core/entity-components/entity-form/entity-form.service";
import { toFormFieldConfig } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";

/**
 * Component responsible for displaying the Note creation/view window
 */
@UntilDestroy()
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
  imports: [
    FormDialogWrapperComponent,
    DatePipe,
    FormsModule,
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
    ExportDataDirective,
    Angulartics2Module,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    ConfigurableEnumDirective,
    BorderHighlightDirective,
    EntitySelectComponent,
    MatCheckboxModule,
    NgIf,
    ChildMeetingNoteAttendanceComponent,
    MatDialogModule,
  ],
  standalone: true,
})
export class NoteDetailsComponent implements ShowsEntity<Note>, OnInit {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true })
  formDialogWrapper: FormDialogWrapperComponent<Note>;

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;
  readonly User: EntityConstructor<User> = User;
  readonly dateLabel = Note.schema.get("date").label;
  readonly statusLabel = Note.schema.get("warningLevel").label;
  readonly categoryLabel = Note.schema.get("category").label;
  readonly authorsLabel = Note.schema.get("authors").label;
  readonly authorsPlaceholder = this.getPlaceholder(this.authorsLabel);
  readonly subjectLabel = Note.schema.get("subject").label;
  readonly textLabel = Note.schema.get("text").label;
  readonly childrenLabel = Note.schema.get("children").label;
  readonly childrenPlaceholder = this.getPlaceholder(this.childrenLabel);
  readonly schoolsLabel = Note.schema.get("schools").label;
  readonly schoolsPlaceholder = this.getPlaceholder(this.schoolsLabel);
  readonly relatedEntitiesSchema: EntitySchemaField =
    Note.schema.get("relatedEntities");

  readonly INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;
  readonly compareFn = compareEnums;
  includeInactiveChildren: boolean = false;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  /** Is it mobile view or not */
  mobile = false;
  form: EntityForm<Note>;

  constructor(
    private configService: ConfigService,
    private screenWidthObserver: ScreenWidthObserver,
    private entityFormService: EntityFormService
  ) {
    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note").config.exportConfig;
    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));
  }

  ngOnInit() {
    this.form = this.entityFormService.createFormGroup(
      [
        "date",
        "warning-level",
        "category",
        "authors",
        "subject",
        "text",
        "children",
        "schools",
        "additional",
      ].map(toFormFieldConfig),
      this.entity
    );
  }

  toggleIncludeInactiveChildren() {
    this.includeInactiveChildren = !this.includeInactiveChildren;
    // This needs to be set so that the filtering will start immediately
    this.filterInactiveChildren = this.includeInactiveChildren
      ? (_) => true
      : (c) => c.isActive;
  }

  filterInactiveChildren: (Child) => boolean = (c: Child) => c.isActive;

  private getPlaceholder(label: string): string {
    return $localize`:Placeholder for input to add entities|context Add User(s):Add ${label}`;
  }
}
