import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { Child } from "../../children/model/child";
import { ExportColumnConfig } from "../../../core/export/data-transformation-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { FormDialogWrapperComponent } from "../../../core/form-dialog/form-dialog-wrapper/form-dialog-wrapper.component";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { DatePipe, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { ExportDataDirective } from "../../../core/export/export-data-directive/export-data.directive";
import { Angulartics2Module } from "angulartics2";
import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-attendance/child-meeting-note-attendance.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  EntityForm,
  EntityFormService,
} from "../../../core/entity-components/entity-form/entity-form.service";
import { toFormFieldConfig } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { DynamicComponentDirective } from "../../../core/view/dynamic-components/dynamic-component.directive";

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
    ChildMeetingNoteAttendanceComponent,
    EntityFormComponent,
    DynamicComponentDirective,
    NgIf,
    DatePipe,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    FontAwesomeModule,
    ExportDataDirective,
    Angulartics2Module,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class NoteDetailsComponent implements ShowsEntity<Note>, OnInit {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true })
  formDialogWrapper: FormDialogWrapperComponent<Note>;

  includeInactiveChildren: boolean = false;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  /** Is it mobile view or not */
  mobile = false;
  topForm = ["date", "warningLevel", "category", "authors"].map((field) => [
    toFormFieldConfig(field),
  ]);
  middleForm = ["subject", "text"].map(toFormFieldConfig);
  // TODO related entities is not necessarily set
  // TODO make this configurable
  bottomForm = ["children", "schools", "relatedEntities"].map(
    toFormFieldConfig
  );
  form: EntityForm<Note>;
  tmpEntity: Note;

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
      this.middleForm.concat(...this.topForm, this.bottomForm),
      this.entity
    );
    this.tmpEntity = this.entity;
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const dynamicConstructor: any = this.entity.getConstructor();
      this.tmpEntity = Object.assign(new dynamicConstructor(), value);
    });
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

  removeChild(id: string) {
    // TODO type is broken
    const children = this.form.get("children").value as any as string[];
    const index = children.indexOf(id);
    children.splice(index, 1);
    this.form.get("children").setValue([...children] as any);
  }
}
