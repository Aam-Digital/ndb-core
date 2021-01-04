import { Component, Input, OnInit, Optional, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import { MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../core/entity/entity";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "../model/interaction-type.interface";
import { ConfigService } from "../../../core/config/config.service";
import { CONFIGURABLE_ENUM_CONFIG_PREFIX } from "../../../core/configurable-enum/configurable-enum.interface";

/**
 * Component responsible for displaying the Note creation/view window
 */
@Component({
  selector: "app-note-details",
  templateUrl: "./note-details.component.html",
  styleUrls: ["./note-details.component.scss"],
})
export class NoteDetailsComponent implements ShowsEntity, OnInit {
  @Input() entity: Note;
  @ViewChild("dialogForm", { static: true }) formDialogWrapper;

  /** interaction types loaded from config file */
  interactionTypes: InteractionType[];

  constructor(
    private configService: ConfigService,
    @Optional() private matDialogRef: MatDialogRef<NoteDetailsComponent>
  ) {}

  ngOnInit() {
    this.interactionTypes = this.configService.getConfig(
      CONFIGURABLE_ENUM_CONFIG_PREFIX + INTERACTION_TYPE_CONFIG_ID
    );
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
}
