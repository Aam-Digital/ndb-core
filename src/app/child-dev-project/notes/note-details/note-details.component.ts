import { Component, Input, OnInit, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/entity";
import { INTERACTION_TYPE_CONFIG_ID } from "../model/interaction-type.interface";
import { User } from "../../../core/user/user";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

/**
 * Component responsible for displaying the Note creation/view window
 */
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
export class NoteDetailsComponent implements ShowsEntity<Note>, OnInit {
  @Input() entity: Note;
  _noteAuthors: User[] = [];
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  INTERACTION_TYPE_CONFIG = INTERACTION_TYPE_CONFIG_ID;

  constructor(
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>,
    private entityMapper: EntityMapperService
  ) {}

  get noteAuthors(): User[] {
    return this._noteAuthors;
  }

  set noteAuthors(users: User[]) {
    this.entity.authors = users.map((user) => user.getId());
    this._noteAuthors = users;
  }

  closeDialog(entity: Entity) {
    if (!this.matDialogRef) {
      return;
    }

    // Return the entity which has been saved
    this.matDialogRef
      .beforeClosed()
      .subscribe(() => this.matDialogRef.close(entity));
  }

  ngOnInit(): void {
    this.entityMapper.loadType<User>(User).then((users) => {
      this._noteAuthors = users.filter((u) =>
        this.entity.authors.includes(u.getId())
      );
    });
  }
}
