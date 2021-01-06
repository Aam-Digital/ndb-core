import { Component, Input, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";

/**
 * Component responsible for displaying the Note creation/view window
 */
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
export class NoteDetailsComponent implements ShowsEntity {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;

  constructor(
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>
  ) {}

  closeDialog(entity: Entity) {
    if (!this.matDialogRef) {
      return;
    }

    // Return the entity which has been saved
    this.matDialogRef
      .beforeClosed()
      .subscribe(() => this.matDialogRef.close(entity));
  }
}
