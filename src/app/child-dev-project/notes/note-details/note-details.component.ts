import { Component, Input, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../../core/entity/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { accessorFn } from "../../../core/entity-components/entity-select/entity-select/entity-select.component";
import { Child } from "../../children/model/child";

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

  INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;
  includeInactiveChildren: boolean = true;

  constructor(
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>
  ) {}

  toggleIncludeInactiveChildren() {
    this.includeInactiveChildren = !this.includeInactiveChildren;
    // This needs to be set so that the filtering can start immediately
    this.filterInactiveChildren = this.includeInactiveChildren
      ? (_) => true
      : (c) => c.isActive;
  }

  filterInactiveChildren: (Child) => boolean = (_) => true;

  readonly childAccessor: accessorFn<Child> = (c: Child) => c.name;

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
