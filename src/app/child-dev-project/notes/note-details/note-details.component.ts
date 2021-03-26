import { Component, Input, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity, EntityConstructor } from "../../../core/entity/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { accessorFn } from "../../../core/entity-select/entity-select/entity-select.component";
import { Child } from "../../children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

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
  selectedChildren: Child[] = [];
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  readonly Child: EntityConstructor<Child> = Child;

  INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;

  constructor(
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>,
    private entityMapperService: EntityMapperService
  ) {
    this.entityMapperService
      .loadType<Child>(Child)
      .then((children: Child[]) => {
        for (const child of children) {
          if (this.entity.children.find((c) => c === child.getId())) {
            this.selectedChildren.push(child);
          }
        }
      });
  }

  readonly accessor: accessorFn<Child> = (c: Child) => c.name;

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
