import { Component, Input, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { EntityConstructor } from "../../../core/entity/model/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";
import { School } from "../../schools/model/school";

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
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;
  readonly User: EntityConstructor<User> = User;

  readonly INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;
  includeInactiveChildren: boolean = false;

  toggleIncludeInactiveChildren() {
    this.includeInactiveChildren = !this.includeInactiveChildren;
    // This needs to be set so that the filtering will start immediately
    this.filterInactiveChildren = this.includeInactiveChildren
      ? (_) => true
      : (c) => c.isActive;
  }

  filterInactiveChildren: (Child) => boolean = (c: Child) => c.isActive;

  get isMeeting(): boolean {
    return this.entity.category?.isMeeting || false;
  }
}
