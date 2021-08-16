import { Component, Input, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";
import { School } from "../../schools/model/school";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
/**
 * Component responsible for displaying the Note creation/view window
 */
export class NoteDetailsComponent implements ShowsEntity<Note> {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  readonly Child: EntityConstructor<Child> = Child;
  readonly School: EntityConstructor<School> = School;
  readonly User: EntityConstructor<User> = User;

  INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;
  includeInactiveChildren: boolean = false;

  constructor(
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>
  ) {}

  toggleIncludeInactiveChildren() {
    this.includeInactiveChildren = !this.includeInactiveChildren;
    // This needs to be set so that the filtering will start immediately
    this.filterInactiveChildren = this.includeInactiveChildren
      ? (_) => true
      : (c) => c.isActive;
  }

  filterInactiveChildren: (Child) => boolean = (c: Child) => c.isActive;

  closeDialog(entity: Entity) {
    if (!this.matDialogRef) {
      return;
    }

    // Return the entity which has been saved
    this.matDialogRef
      .beforeClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.matDialogRef.close(entity));
  }
}
