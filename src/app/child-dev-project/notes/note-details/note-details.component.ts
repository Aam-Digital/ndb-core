import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Note } from "../model/note";
import { ShowsEntity } from "../../../core/form-dialog/shows-entity.interface";
import {
  InteractionType,
  NoteConfig,
} from "../note-config-loader/note-config.interface";
import { NoteConfigLoaderService } from "../note-config-loader/note-config-loader.service";

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

  constructor(private configLoader: NoteConfigLoaderService) {}

  ngOnInit() {
    // get all note categorys from config file
    this.interactionTypes = this.configLoader.interactionTypes;
  }
}
