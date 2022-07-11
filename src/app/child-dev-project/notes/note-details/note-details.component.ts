import { Component, Input, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";
import { School } from "../../schools/model/school";
import { ExportColumnConfig } from "../../../core/export/export-service/export-column-config";
import { ConfigService } from "../../../core/config/config.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { compareEnums } from "../../../utils/utils";
import { BreakpointObserver } from "@angular/cdk/layout";
import { FormDialogWrapperComponent } from "../../../core/form-dialog/form-dialog-wrapper/form-dialog-wrapper.component";

/**
 * Component responsible for displaying the Note creation/view window
 */
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
export class NoteDetailsComponent implements ShowsEntity<Note> {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true })
  formDialogWrapper: FormDialogWrapperComponent<Note>;

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;
  readonly User: EntityConstructor<User> = User;

  readonly INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;
  readonly compareFn = compareEnums;
  includeInactiveChildren: boolean = false;

  /** export format for notes to be used for downloading the individual details */
  exportConfig: ExportColumnConfig[];

  /** Is it mobile view or not */
  mobile = false;

  constructor(
    private configService: ConfigService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.exportConfig = this.configService.getConfig<{
      config: EntityListConfig;
    }>("view:note").config.exportConfig;
    this.breakpointObserver
      .observe("(max-width: 1000px)")
      .subscribe((next) => (this.mobile = next.matches));
  }

  toggleIncludeInactiveChildren() {
    this.includeInactiveChildren = !this.includeInactiveChildren;
    // This needs to be set so that the filtering will start immediately
    this.filterInactiveChildren = this.includeInactiveChildren
      ? (_) => true
      : (c) => c.isActive;
  }

  filterInactiveChildren: (Child) => boolean = (c: Child) => c.isActive;
}
